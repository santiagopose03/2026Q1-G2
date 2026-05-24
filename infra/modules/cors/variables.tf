variable "resources" {
  type = map(object({
    id          = string
    rest_api_id = string
  }))
}
