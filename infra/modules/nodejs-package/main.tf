
resource "local_file" "env" {
  filename = local.env_file_path
  content  = local.env_file_content
}

resource "null_resource" "npm_install" {
  triggers = {
    lockfile = local.lockfile_hash
  }

  provisioner "local-exec" {
    working_dir = var.root_dir
    command     = "npm ci --quiet"
  }
}

resource "null_resource" "npm_build" {
  triggers = {
    install = null_resource.npm_install.id

    source = local.source_hash
    public = local.public_hash
    extra  = local.extra_files_hash

    env_file = local_file.env.id
  }

  provisioner "local-exec" {
    working_dir = var.root_dir
    command     = "npm run build --quiet"
  }

  depends_on = [local_file.env]
}
