resource "aws_api_gateway_method" "options" {
  for_each = var.resources

  rest_api_id = each.value.rest_api_id
  resource_id = each.value.id

  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options" {
  for_each = aws_api_gateway_method.options

  rest_api_id = each.value.rest_api_id
  resource_id = each.value.resource_id
  http_method = each.value.http_method

  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options" {
  for_each = aws_api_gateway_method.options

  rest_api_id = each.value.rest_api_id
  resource_id = each.value.resource_id
  http_method = each.value.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options" {
  for_each = aws_api_gateway_integration.options

  rest_api_id = each.value.rest_api_id
  resource_id = each.value.resource_id
  http_method = each.value.http_method

  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
