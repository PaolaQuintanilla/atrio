import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const region = process.env.SES_REGION ?? "sa-east-1";
const fromEmail = process.env.SES_FROM_EMAIL ?? "";

let _ses: SESClient | null = null;

function ses(): SESClient {
  if (!_ses) {
    _ses = new SESClient({
      region,
      credentials: {
        accessKeyId: process.env.SES_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _ses;
}

/** Send a transactional email via AWS SES (auth verification / password reset). */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await ses().send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: html, Charset: "UTF-8" } },
      },
    }),
  );
}
