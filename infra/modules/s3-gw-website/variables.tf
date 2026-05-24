variable "aws_region" {
  type = string
}

variable "bucket_prefix" {
  type = string
}

variable "proxy_gateway_name" {
  type = string
}

variable "stage_name" {
  type    = string
  default = "app"
}
