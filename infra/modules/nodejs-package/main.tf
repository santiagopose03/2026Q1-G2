
resource "local_file" "env" {
  filename = local.env_file_path
  content  = local.env_file_content
}

resource "null_resource" "this" {
  triggers = {
    lockfile = local.lockfile_hash
    source   = local.source_hash
    public   = local.public_hash
    extra    = local.extra_files_hash

    env_file = local_file.env.id
  }

  provisioner "local-exec" {
    working_dir = var.root_dir
    command     = "npm ci --quiet && npm run build --quiet"
  }

  depends_on = [local_file.env]
}
