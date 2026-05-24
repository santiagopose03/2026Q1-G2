variable "name" {
  type = string
}

variable "stage" {
  type = string
}

variable "handlers" {
  type = object({
    connect = object({
      invoke_arn    = string
      function_name = string
    })
    disconnect = object({
      invoke_arn    = string
      function_name = string
    })
    ocpp_call = object({
      invoke_arn    = string
      function_name = string
    })
  })
}
