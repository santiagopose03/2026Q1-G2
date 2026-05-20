output "resources_cors" {
  value = { for key, val in var.resources : key => {
    method_id               = aws_api_gateway_method.options[key].id
    integration_id          = aws_api_gateway_integration.options[key].id
    integration_response_id = aws_api_gateway_integration_response.options[key].id
    method_response_id      = aws_api_gateway_method_response.options[key].id
  } }
}
