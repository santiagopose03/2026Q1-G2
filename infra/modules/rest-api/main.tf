resource "aws_api_gateway_rest_api" "this" {
  name = var.name
}



resource "aws_api_gateway_resource" "chargers_collection" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id

  path_part = "chargers"
}

resource "aws_api_gateway_resource" "chargers_item" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.chargers_collection.id

  path_part = "{chargerId}"
}



resource "aws_api_gateway_method" "create_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_collection.id

  authorizer_id        = aws_api_gateway_authorizer.cognito.id
  request_validator_id = aws_api_gateway_request_validator.body_only.id

  authorization = "COGNITO_USER_POOLS"
  http_method   = "POST"

  request_models = {
    "application/json" = aws_api_gateway_model.create_charger.name
  }
}

resource "aws_api_gateway_method" "get_many_chargers" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_collection.id

  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization = "COGNITO_USER_POOLS"
  http_method   = "GET"
}

resource "aws_api_gateway_method" "get_one_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_item.id

  authorizer_id        = aws_api_gateway_authorizer.cognito.id
  request_validator_id = aws_api_gateway_request_validator.params_only.id

  authorization = "COGNITO_USER_POOLS"
  http_method   = "GET"

  request_parameters = {
    "method.request.path.chargerId" = true
  }
}

resource "aws_api_gateway_method" "delete_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_item.id

  authorizer_id        = aws_api_gateway_authorizer.cognito.id
  request_validator_id = aws_api_gateway_request_validator.params_only.id

  authorization = "COGNITO_USER_POOLS"
  http_method   = "DELETE"

  request_parameters = {
    "method.request.path.chargerId" = true
  }
}



resource "aws_api_gateway_integration" "create_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_collection.id
  http_method = aws_api_gateway_method.create_charger.http_method

  integration_http_method = "POST"

  type = "AWS_PROXY"
  uri  = var.handlers.create_charger.invoke_arn
}

resource "aws_api_gateway_integration" "get_many_chargers" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_collection.id
  http_method = aws_api_gateway_method.get_many_chargers.http_method

  integration_http_method = "POST"

  type = "AWS_PROXY"
  uri  = var.handlers.get_many_chargers.invoke_arn
}

resource "aws_api_gateway_integration" "get_one_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_item.id
  http_method = aws_api_gateway_method.get_one_charger.http_method

  integration_http_method = "POST"

  type = "AWS_PROXY"
  uri  = var.handlers.get_one_charger.invoke_arn
}

resource "aws_api_gateway_integration" "delete_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chargers_item.id
  http_method = aws_api_gateway_method.delete_charger.http_method

  integration_http_method = "POST"

  type = "AWS_PROXY"
  uri  = var.handlers.delete_charger.invoke_arn
}



resource "aws_api_gateway_model" "create_charger" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  name = "CreateCharger"

  content_type = "application/json"
  schema = jsonencode({
    type     = "object"
    required = ["chargerId", "connectors"]
    properties = {
      chargerId = {
        type      = "string"
        minLength = 4
        maxLength = 36
      }
      connectors = {
        type    = "integer"
        minimum = 1
        maximum = 4
      }
    }
  })
}

resource "aws_api_gateway_request_validator" "body_only" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  name = "body-only"

  validate_request_body       = true
  validate_request_parameters = false
}

resource "aws_api_gateway_request_validator" "params_only" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  name = "params-only"

  validate_request_body       = false
  validate_request_parameters = true
}



resource "aws_api_gateway_authorizer" "cognito" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  provider_arns = var.cognito_user_pools.providerARNs

  name = "Cognito"
  type = "COGNITO_USER_POOLS"
}



resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeploy = sha1(jsonencode(local.api_config))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id

  stage_name = var.stage
}



resource "aws_lambda_permission" "this" {
  for_each = toset([
    var.handlers.get_many_chargers.function_name,
    var.handlers.get_one_charger.function_name,
    var.handlers.create_charger.function_name,
    var.handlers.delete_charger.function_name,
  ])

  function_name = each.key

  statement_id = "AllowAPIGatewayInvoke"
  action       = "lambda:InvokeFunction"
  principal    = "apigateway.amazonaws.com"
  source_arn   = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

module "cors" {
  source = "../cors"

  resources = {
    "chargers_collection" = aws_api_gateway_resource.chargers_collection
    "chargers_item"       = aws_api_gateway_resource.chargers_item
  }
}
