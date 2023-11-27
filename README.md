# cloudflare-s3-uploader

use cloudflare pages to upload file to s3 and return download url

## Environment Variables

|Environment|describe|
|-----|-----|
|TURNSTILE_SITE_KEY|refer:https://developers.cloudflare.com/turnstile/|
|TURNSTILE_SECRET_KEY|refer:https://developers.cloudflare.com/turnstile/|
|AWS_ACCESS_KEY_ID|S3 Access Key ID|
|AWS_SECRET_ACCESS_KEY|S3 Access Key Secret|
|DOWNLOAD_URL_PREFIX|If you dont deploy download proxy worker, this should same with S3_ENDPOINT|
|S3_BUCKET|S3 Bucket Name|
|S3_ENDPOINT|S3 Endpoint url|
|S3_REGION|S3 Region|
