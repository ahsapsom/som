import nodemailer from "nodemailer";

import { readMailSettings } from "@/lib/mailSettingsStore";

type MailerConfig = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  mailTo?: string;
};

type MailerEnv = {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  MAIL_FROM?: string;
  MAIL_TO?: string;
};

function normalize(value: string | undefined) {
  return (value ?? "").trim();
}

async function getMailerConfig(): Promise<MailerConfig> {
  const env = process.env as MailerEnv;
  const settings = await readMailSettings().catch(() => null);

  const smtpHost = normalize(settings?.smtpHost) || normalize(env.SMTP_HOST);
  const smtpPortRaw =
    normalize(settings?.smtpPort) || normalize(env.SMTP_PORT);
  const smtpUser = normalize(settings?.smtpUser) || normalize(env.SMTP_USER);
  const smtpPass = normalize(settings?.smtpPass) || normalize(env.SMTP_PASS);
  const mailFrom = normalize(settings?.mailFrom) || normalize(env.MAIL_FROM);
  const mailTo = normalize(settings?.mailTo) || normalize(env.MAIL_TO);

  const smtpPort = Number(smtpPortRaw);
  if (!smtpHost) throw new Error("Missing mail config: SMTP_HOST");
  if (!smtpPort || Number.isNaN(smtpPort)) {
    throw new Error("Missing mail config: SMTP_PORT");
  }
  if (!smtpUser) throw new Error("Missing mail config: SMTP_USER");
  if (!smtpPass) throw new Error("Missing mail config: SMTP_PASS");
  if (!mailFrom) throw new Error("Missing mail config: MAIL_FROM");

  const smtpSecure =
    typeof settings?.smtpSecure === "boolean"
      ? settings.smtpSecure
      : env.SMTP_SECURE?.toLowerCase() === "true"
        ? true
        : smtpPort === 465;

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    mailFrom,
    mailTo: mailTo || undefined,
  };
}

declare global {
  var __mailerTransporter: nodemailer.Transporter | undefined;
  var __mailerTransporterKey: string | undefined;
}

async function getTransporter(config: MailerConfig) {
  const key = JSON.stringify({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    user: config.smtpUser,
    pass: config.smtpPass,
  });
  if (globalThis.__mailerTransporter && globalThis.__mailerTransporterKey === key) {
    return globalThis.__mailerTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });

  globalThis.__mailerTransporter = transporter;
  globalThis.__mailerTransporterKey = key;
  return transporter;
}

export async function sendMail(args: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  to?: string;
}) {
  const config = await getMailerConfig();
  const transporter = await getTransporter(config);
  const to = args.to ?? config.mailTo;
  if (!to) {
    throw new Error("Missing mail config: MAIL_TO");
  }

  await transporter.sendMail({
    from: config.mailFrom,
    to,
    replyTo: args.replyTo,
    subject: args.subject,
    text: args.text,
    html: args.html,
  });
}
