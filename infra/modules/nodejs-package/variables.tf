variable "root_dir" {
  type        = string
  description = "Path to the package root directory"
}

variable "extra_files" {
  type        = set(string)
  description = "Additional files to watch for rebuild, relative to root_dir"
  default     = []
}

variable "env_vars" {
  type        = map(string)
  description = "Key-value pairs written into .env"
  default     = {}
}
