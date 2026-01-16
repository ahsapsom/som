import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_APP_ID = "d3b993v3dgpwkg";
const FALLBACK_BRANCH = "main";

function getRegion() {
  return process.env.AWS_REGION || "eu-central-1";
}

function getAppId() {
  return process.env.AWS_AMPLIFY_APP_ID || FALLBACK_APP_ID;
}

function getBranch() {
  return process.env.AWS_AMPLIFY_BRANCH || FALLBACK_BRANCH;
}

async function readParam(client: SSMClient, name: string) {
  const response = await client.send(
    new GetParameterCommand({ Name: name, WithDecryption: true }),
  );
  return response.Parameter?.Value ?? "";
}

export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const appId = getAppId();
  const branch = getBranch();
  const client = new SSMClient({ region: getRegion() });
  const passwordPath = `/amplify/${appId}/${branch}/ADMIN_PASSWORD`;
  const secretPath = `/amplify/${appId}/${branch}/ADMIN_SECRET`;
  let hasAdminPassword = false;
  let hasAdminSecret = false;
  try {
    const [password, secret] = await Promise.all([
      readParam(client, passwordPath),
      readParam(client, secretPath),
    ]);
    hasAdminPassword = Boolean(password);
    hasAdminSecret = Boolean(secret);
  } catch {
    hasAdminPassword = false;
    hasAdminSecret = false;
  }
  return Response.json({
    ok: true,
    source: "ssm",
    hasAdminPassword,
    hasAdminSecret,
    host,
    proto,
  });
}
