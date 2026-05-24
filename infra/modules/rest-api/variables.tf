variable "name" {
  type = string
}

variable "stage" {
  type = string
}

variable "cognito_user_pools" {
  type = object({
    providerARNs = set(string)
  })
}

variable "handlers" {
  type = object({
    get_one_charger = object({
      invoke_arn    = string
      function_name = string
    })
    get_many_chargers = object({
      invoke_arn    = string
      function_name = string
    })
    create_charger = object({
      invoke_arn    = string
      function_name = string
    })
    delete_charger = object({
      invoke_arn    = string
      function_name = string
    })
  })
}
