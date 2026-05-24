resource "aws_apigatewayv2_api" "this" {
  name = var.name

  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.[0]"
}

resource "aws_apigatewayv2_stage" "this" {
  api_id        = aws_apigatewayv2_api.this.id
  deployment_id = aws_apigatewayv2_deployment.this.id

  name = var.stage
}

resource "aws_apigatewayv2_deployment" "this" {
  api_id = aws_apigatewayv2_api.this.id

  triggers = {
    redeploy = sha1(jsonencode([
      aws_apigatewayv2_route.connect.id,
      aws_apigatewayv2_route.disconnect.id,
      aws_apigatewayv2_route.call.id,
      aws_apigatewayv2_route.result.id,
      aws_apigatewayv2_route.error.id,

      aws_apigatewayv2_integration.connect.id,
      aws_apigatewayv2_integration.disconnect.id,
      aws_apigatewayv2_integration.call.id,
      aws_apigatewayv2_integration.result.id,
      aws_apigatewayv2_integration.error.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}



resource "aws_apigatewayv2_route" "connect" {
  api_id = aws_apigatewayv2_api.this.id

  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id = aws_apigatewayv2_api.this.id

  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "call" {
  api_id = aws_apigatewayv2_api.this.id

  operation_name = "Call"

  route_key = "2"
  target    = "integrations/${aws_apigatewayv2_integration.call.id}"
}

resource "aws_apigatewayv2_route" "result" {
  api_id = aws_apigatewayv2_api.this.id

  operation_name = "Result"

  route_key = "3"
  target    = "integrations/${aws_apigatewayv2_integration.result.id}"
}

resource "aws_apigatewayv2_route" "error" {
  api_id = aws_apigatewayv2_api.this.id

  operation_name = "Error"

  route_key = "4"
  target    = "integrations/${aws_apigatewayv2_integration.error.id}"
}

resource "aws_apigatewayv2_route_response" "call" {
  api_id   = aws_apigatewayv2_api.this.id
  route_id = aws_apigatewayv2_route.call.id

  route_response_key = "$default"
}



resource "aws_apigatewayv2_integration" "connect" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.handlers.connect.invoke_arn
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.handlers.disconnect.invoke_arn
}

resource "aws_apigatewayv2_integration" "call" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.handlers.call.invoke_arn
}

resource "aws_apigatewayv2_integration" "result" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.handlers.result.invoke_arn
}

resource "aws_apigatewayv2_integration" "error" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.handlers.error.invoke_arn
}



resource "aws_lambda_permission" "this" {
  for_each = toset([
    var.handlers.connect.function_name,
    var.handlers.disconnect.function_name,
    var.handlers.call.function_name,
    var.handlers.result.function_name,
    var.handlers.error.function_name,
  ])

  function_name = each.key

  statement_id = "AllowAPIGatewayInvoke"
  action       = "lambda:InvokeFunction"
  principal    = "apigateway.amazonaws.com"
  source_arn   = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
