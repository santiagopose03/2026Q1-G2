variable "s3_bucket" {
  type = object({
    bucket        = string
    bucket_region = string
  })
  description = "S3 bucket to sync the build into"
}

variable "root_dir" {
  type        = string
  description = "Path to the frontend root directory"
}

variable "extra_files" {
  type        = set(string)
  description = "Additional files to watch for rebuild, relative to root_dir"
  default     = ["index.html", "tsconfig.app.json", "tsconfig.json", "tsconfig.node.json", "vite.config.ts"]
}

variable "env_vars" {
  type        = map(string)
  description = "Key-value pairs written into .env"
  default     = {}
}

variable "cache_control_assets" {
  type        = string
  description = "Cache-Control header for hashed asset files (js/css/media)"
  default     = "public,max-age=31536000,immutable"
}

variable "cache_control_root" {
  type        = string
  description = "Cache-Control header for root files (html/favicon)"
  default     = "no-cache,no-store,must-revalidate"
}
