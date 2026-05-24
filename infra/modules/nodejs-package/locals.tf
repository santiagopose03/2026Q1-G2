locals {
  env_vars_sorted  = { for key in sort(keys(var.env_vars)) : key => var.env_vars[key] }
  env_file_content = join("\n", [for key, val in local.env_vars_sorted : "${key}=${val}"])

  env_file_path = "${var.root_dir}/.env"
  lockfile_path = "${var.root_dir}/package-lock.json"

  lockfile_hash = filesha256(local.lockfile_path)

  source_hash = sha256(join("\n", [
    for file in sort(fileset(var.root_dir, "src/**")) :
    "${file}=${filesha256("${var.root_dir}/${file}")}"
  ]))

  public_hash = sha256(join("\n", [
    for file in sort(fileset(var.root_dir, "public/**")) :
    "${file}=${filesha256("${var.root_dir}/${file}")}"
  ]))

  extra_files_hash = sha256(join("\n", [
    for file in sort(var.extra_files) :
    "${file}=${filesha256("${var.root_dir}/${file}")}"
  ]))
}
