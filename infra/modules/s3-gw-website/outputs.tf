output "s3_bucket" {
  value = {
    bucket        = aws_s3_bucket.this.bucket
    bucket_region = aws_s3_bucket.this.bucket_region
  }
}

output "website_endpoint" {
  value = aws_api_gateway_stage.this.invoke_url
}
