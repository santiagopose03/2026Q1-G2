module "nodejs_package" {
  source = "../nodejs-package"

  root_dir    = var.root_dir
  extra_files = var.extra_files
  env_vars    = var.env_vars
}

resource "null_resource" "s3_sync" {
  triggers = {
    build = module.nodejs_package.id
  }

  provisioner "local-exec" {
    working_dir = "${var.root_dir}/dist"
    command     = <<-EOT
      aws s3 sync . "s3://${var.s3_bucket.bucket}/" \
      --include "*"  \
      --exclude "assets/*" \
      --cache-control "${var.cache_control_root}" \
      --region "${var.s3_bucket.bucket_region}" \
      --delete \
      --quiet
    EOT
  }

  provisioner "local-exec" {
    working_dir = "${var.root_dir}/dist"
    command     = <<-EOT
      aws s3 sync . "s3://${var.s3_bucket.bucket}/" \
      --exclude "*" \
      --include "assets/*" \
      --cache-control "${var.cache_control_assets}" \
      --region "${var.s3_bucket.bucket_region}" \
      --delete \
      --quiet
    EOT
  }
}
