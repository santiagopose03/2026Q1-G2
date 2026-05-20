variable "function_name" {
  type = string
}

variable "nodejs_version" {
  type    = string
  default = "24.x"
}

variable "root_dir" {
  type = string
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}
