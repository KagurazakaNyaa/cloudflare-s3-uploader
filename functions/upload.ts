import { S3 } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";

interface Env {
  TURNSTILE_SECRET_KEY: string;
  S3_BUCKET: string;
  S3_ENDPOINT: string;
  DOWNLOAD_URL_PREFIX: string;
}

class TurnstileResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const SECRET_KEY = context.env.TURNSTILE_SECRET_KEY;
  const body = await context.request.formData();
  // Turnstile injects a token in "cf-turnstile-response".
  const token = body.get("cf-turnstile-response");
  const ip = context.request.headers.get("CF-Connecting-IP");

  // Validate the token by calling the
  // "/siteverify" API endpoint.
  let formData = new FormData();
  formData.append("secret", SECRET_KEY);
  formData.append("response", token);
  formData.append("remoteip", ip);

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await fetch(url, {
    body: formData,
    method: "POST",
  });

  const outcome = await result.json<TurnstileResponse>();
  if (!outcome.success) {
    return new Response("");
  }
  const s3client = new S3({
    endpoint: context.env.S3_ENDPOINT,
    credentials: fromEnv(),
  });
  const date = outcome.challenge_ts.split("T")[0];
  const file: File = body["file"];
  const objectName = date + "/" + file.name;
  s3client.putObject({
    Bucket: context.env.S3_BUCKET,
    Key: objectName,
    Body: file.stream(),
  });
  const downloadUrl = context.env.DOWNLOAD_URL_PREFIX + objectName;
  return new Response(downloadUrl);
};
