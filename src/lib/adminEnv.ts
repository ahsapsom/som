type AdminEnv = {
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
  hasSecretsObject: boolean;
};

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

export function getAdminEnv(): AdminEnv {
  const secretsObject = readSecretsObject();
  const secrets = secretsObject ?? {};
  const ADMIN_PASSWORD =
    (secrets.ADMIN_PASSWORD as string | undefined) ??
    process.env.ADMIN_PASSWORD ??
    "";
  const ADMIN_SECRET =
    (secrets.ADMIN_SECRET as string | undefined) ??
    process.env.ADMIN_SECRET ??
    "";
  return {
    ADMIN_PASSWORD: ADMIN_PASSWORD.trim(),
    ADMIN_SECRET: ADMIN_SECRET.trim(),
    hasSecretsObject: Boolean(secretsObject),
  };
}
