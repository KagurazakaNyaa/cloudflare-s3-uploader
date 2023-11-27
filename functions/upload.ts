import { S3 } from "@aws-sdk/client-s3";
import { AwsCredentialIdentity } from "@aws-sdk/types";

interface Env {
  TURNSTILE_SECRET_KEY: string;
  S3_BUCKET: string;
  S3_ENDPOINT: string;
  S3_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
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
    return new Response("CAPTHA not pass");
  }
  const S3_BUCKET = context.env.S3_BUCKET;
  const S3_ENDPOINT = context.env.S3_ENDPOINT;
  const S3_REGION = context.env.S3_REGION;
  const credential: AwsCredentialIdentity = {
    accessKeyId: context.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: context.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3client = new S3({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: credential,
  });
  console.log(`use s3 endpoint ${S3_ENDPOINT} with region ${S3_REGION}`);
  const date = outcome.challenge_ts.split("T")[0];
  const file: File = body.get("file");
  const objectName = "/" + date + "/" + file.name;
  console.log(`Upload file to ${objectName} length: ${file.size}`);
  const uploadResult = await s3client.putObject({
    Bucket: S3_BUCKET,
    Key: objectName,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
    ContentLength: file.size,
  });
  console.log(uploadResult);
  const downloadUrl = context.env.DOWNLOAD_URL_PREFIX + objectName;
  return new Response(downloadUrl);
};
