import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const SECRET_ID = "som/admin";
const CACHE_TTL_MS = 60_000;
const FALLBACK_REGION = "eu-central-1";

type AdminSecrets = {
  adminPassword?: string;
  adminSecret?: string;
  source: "secretsmanager";
};

let cached: AdminSecrets | null = null;
let cachedAt = 0;
let inflight: Promise<AdminSecrets> | null = null;

function getRegion() {
  return (
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    FALLBACK_REGION
  );
}

function parseSecret(secretString: string | undefined): AdminSecrets {
  if (!secretString) {
    return { source: "secretsmanager" };
  }
  try {
    const parsed = JSON.parse(secretString) as Record<string, unknown>;
    return {
      adminPassword:
        typeof parsed.ADMIN_PASSWORD === "string"
          ? parsed.ADMIN_PASSWORD.trim()
          : undefined,
      adminSecret:
        typeof parsed.ADMIN_SECRET === "string"
          ? parsed.ADMIN_SECRET.trim()
          : undefined,
      source: "secretsmanager",
    };
  } catch {
    return { source: "secretsmanager" };
  }
}

async function fetchSecrets(): Promise<AdminSecrets> {
  const client = new SecretsManagerClient({ region: getRegion() });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: SECRET_ID }),
  );
  let secretString = response.SecretString;
  if (!secretString && response.SecretBinary) {
    secretString = Buffer.from(response.SecretBinary as Uint8Array).toString(
      "utf8",
    );
  }
  return parseSecret(secretString);
}

export async function getAdminSecrets(): Promise<AdminSecrets> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;
  if (inflight) return inflight;
  inflight = fetchSecrets()
    .then((result) => {
      cached = result;
      cachedAt = Date.now();
      return result;
    })
    .catch((error) => {
      console.error("ADMIN_SECRETS_FETCH_FAILED", error);
      return { source: "secretsmanager" };
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
