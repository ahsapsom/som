import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSM_PATH_PASSWORD =
  "/amplify/d3b993v3dgpwkg/main/ADMIN_PASSWORD";
const SSM_PATH_SECRET =
  "/amplify/d3b993v3dgpwkg/main/ADMIN_SECRET";

function getRegion() {
  return process.env.AWS_REGION || "eu-central-1";
}

async function readParam(
  client: SSMClient,
  name: string,
): Promise<{ value?: string; error?: string }> {
  try {
    const response = await client.send(
      new GetParameterCommand({ Name: name, WithDecryption: true }),
    );
    return { value: response.Parameter?.Value };
  } catch (error) {
    return {
      error: `${name}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function GET() {
  const client = new SSMClient({ region: getRegion() });
  const password = await readParam(client, SSM_PATH_PASSWORD);
  const secret = await readParam(client, SSM_PATH_SECRET);
  const errors = [password.error, secret.error].filter(Boolean);
  const ssmReadable = errors.length === 0;
  return Response.json({
    ok: ssmReadable,
    ssmReadable,
    error: errors.length ? errors.join(" | ") : null,
    hasPassword: Boolean(password.value),
    hasSecret: Boolean(secret.value),
  });
}
