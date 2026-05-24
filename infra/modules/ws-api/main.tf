resource "aws_apigatewayv2_api" "this" {
  name = var.name

  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
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
      aws_apigatewayv2_route.ocpp_call.id,
      aws_apigatewayv2_route_response.ocpp_call.id,

      aws_apigatewayv2_integration.connect.id,
      aws_apigatewayv2_integration.disconnect.id,
      aws_apigatewayv2_integration.ocpp_call.id,
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

resource "aws_apigatewayv2_route" "ocpp_call" {
  api_id = aws_apigatewayv2_api.this.id

  route_key = "ocpp.call"
  target    = "integrations/${aws_apigatewayv2_integration.ocpp_call.id}"
}

resource "aws_apigatewayv2_route_response" "ocpp_call" {
  api_id   = aws_apigatewayv2_api.this.id
  route_id = aws_apigatewayv2_route.ocpp_call.id

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

resource "aws_apigatewayv2_integration" "ocpp_call" {
  api_id = aws_apigatewayv2_api.this.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.handlers.ocpp_call.invoke_arn
}



resource "aws_lambda_permission" "this" {
  for_each = toset([
    var.handlers.connect.function_name,
    var.handlers.disconnect.function_name,
    var.handlers.ocpp_call.function_name,
  ])

  function_name = each.key

  statement_id = "AllowAPIGatewayInvoke"
  action       = "lambda:InvokeFunction"
  principal    = "apigateway.amazonaws.com"
  source_arn   = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
