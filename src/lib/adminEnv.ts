import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

type AdminEnv = {
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
  hasSecretsObject: boolean;
};

type SsmAdminSecrets = {
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __adminSecretsPromise: Promise<SsmAdminSecrets> | undefined;
}

function readSecretsObject(): Record<string, unknown> | null {
  const raw = (process.env as Record<string, unknown>).secrets;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

function getRegion() {
  return (
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    "eu-central-1"
  );
}

function getAppId() {
  return (
    process.env.AMPLIFY_APP_ID ??
    process.env.AWS_AMPLIFY_APP_ID ??
    "d3b993v3dgpwkg"
  );
}

function getBranch() {
  return (
    process.env.AMPLIFY_BRANCH ??
    process.env.AWS_AMPLIFY_BRANCH ??
    "main"
  );
}

async function readSsmAdminSecrets(): Promise<SsmAdminSecrets> {
  const appId = getAppId();
  const branch = getBranch();
  const names = [
    `/amplify/${appId}/${branch}/ADMIN_PASSWORD`,
    `/amplify/${appId}/${branch}/ADMIN_SECRET`,
  ];
  const client = new SSMClient({ region: getRegion() });
  const response = await client.send(
    new GetParametersCommand({ Names: names, WithDecryption: true }),
  );
  const paramMap = new Map(
    (response.Parameters ?? []).map((param) => [
      param.Name ?? "",
      param.Value ?? "",
    ]),
  );
  return {
    ADMIN_PASSWORD: (paramMap.get(names[0]) ?? "").trim(),
    ADMIN_SECRET: (paramMap.get(names[1]) ?? "").trim(),
  };
}

async function getSsmAdminSecrets(): Promise<SsmAdminSecrets> {
  if (!globalThis.__adminSecretsPromise) {
    globalThis.__adminSecretsPromise = readSsmAdminSecrets().catch(() => ({
      ADMIN_PASSWORD: "",
      ADMIN_SECRET: "",
    }));
  }
  return globalThis.__adminSecretsPromise;
}

export async function getAdminEnv(): Promise<AdminEnv> {
  const secretsObject = readSecretsObject();
  const secrets = secretsObject ?? {};
  const envPassword =
    (secrets.ADMIN_PASSWORD as string | undefined) ??
    process.env.ADMIN_PASSWORD ??
    "";
  const envSecret =
    (secrets.ADMIN_SECRET as string | undefined) ??
    process.env.ADMIN_SECRET ??
    "";
  const ADMIN_PASSWORD = envPassword.trim();
  const ADMIN_SECRET = envSecret.trim();

  if (ADMIN_PASSWORD && ADMIN_SECRET) {
    return {
      ADMIN_PASSWORD,
      ADMIN_SECRET,
      hasSecretsObject: Boolean(secretsObject),
    };
  }

  const ssmSecrets = await getSsmAdminSecrets();
  return {
    ADMIN_PASSWORD: ADMIN_PASSWORD || ssmSecrets.ADMIN_PASSWORD,
    ADMIN_SECRET: ADMIN_SECRET || ssmSecrets.ADMIN_SECRET,
    hasSecretsObject: Boolean(secretsObject),
  };
}
