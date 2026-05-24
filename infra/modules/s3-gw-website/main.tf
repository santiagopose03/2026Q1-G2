data "aws_iam_role" "api_gateway" {
  name = "LabRole"
}

resource "aws_s3_bucket" "this" {
  bucket_prefix = var.bucket_prefix

  force_destroy = true
}

resource "aws_api_gateway_rest_api" "this" {
  name = var.proxy_gateway_name
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id

  path_part = "{proxy+}"
}

resource "aws_api_gateway_resource" "logout" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id

  path_part = "logout"
}

resource "aws_api_gateway_method" "root" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_rest_api.this.root_resource_id

  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.proxy.id

  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

resource "aws_api_gateway_method" "logout" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.logout.id

  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "root" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_rest_api.this.root_resource_id
  http_method = aws_api_gateway_method.root.http_method

  type                    = "AWS"
  integration_http_method = "GET"
  credentials             = data.aws_iam_role.api_gateway.arn

  uri = "arn:aws:apigateway:${var.aws_region}:s3:path/${aws_s3_bucket.this.bucket}/index.html"
}

resource "aws_api_gateway_integration" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  type                    = "AWS"
  integration_http_method = "GET"
  credentials             = data.aws_iam_role.api_gateway.arn
  uri                     = "arn:aws:apigateway:${var.aws_region}:s3:path/${aws_s3_bucket.this.bucket}/{proxy}"

  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

resource "aws_api_gateway_integration" "logout" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.logout.id
  http_method = aws_api_gateway_method.logout.http_method

  type                    = "AWS"
  integration_http_method = "GET"
  credentials             = data.aws_iam_role.api_gateway.arn

  uri = "arn:aws:apigateway:${var.aws_region}:s3:path/${aws_s3_bucket.this.bucket}/index.html"
}

resource "aws_api_gateway_method_response" "root" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_rest_api.this.root_resource_id
  http_method = aws_api_gateway_method.root.http_method

  status_code = "200"

  response_parameters = {
    "method.response.header.Content-Type" = true
  }
}

resource "aws_api_gateway_method_response" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  status_code = "200"

  response_parameters = {
    "method.response.header.Content-Type" = true
  }
}

resource "aws_api_gateway_method_response" "logout" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.logout.id
  http_method = aws_api_gateway_method.logout.http_method

  status_code = "200"

  response_parameters = {
    "method.response.header.Content-Type" = true
  }
}

resource "aws_api_gateway_integration_response" "root" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_rest_api.this.root_resource_id
  http_method = aws_api_gateway_method.root.http_method

  status_code = aws_api_gateway_method_response.root.status_code

  response_parameters = {
    "method.response.header.Content-Type" = "integration.response.header.Content-Type"
  }

  depends_on = [
    aws_api_gateway_integration.root,
    aws_api_gateway_method_response.root,
  ]
}

resource "aws_api_gateway_integration_response" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  status_code = aws_api_gateway_method_response.proxy.status_code

  response_parameters = {
    "method.response.header.Content-Type" = "integration.response.header.Content-Type"
  }

  depends_on = [
    aws_api_gateway_integration.proxy,
    aws_api_gateway_method_response.proxy,
  ]
}

resource "aws_api_gateway_integration_response" "logout" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.logout.id
  http_method = aws_api_gateway_method.logout.http_method

  status_code = aws_api_gateway_method_response.logout.status_code

  response_parameters = {
    "method.response.header.Content-Type" = "integration.response.header.Content-Type"
  }

  depends_on = [
    aws_api_gateway_integration.logout,
    aws_api_gateway_method_response.logout,
  ]
}

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeploy = sha1(jsonencode({
      root_uri   = aws_api_gateway_integration.root.uri
      proxy_uri  = aws_api_gateway_integration.proxy.uri
      logout_uri = aws_api_gateway_integration.logout.uri
    }))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.root,
    aws_api_gateway_integration.proxy,
    aws_api_gateway_integration.logout,
    aws_api_gateway_integration_response.root,
    aws_api_gateway_integration_response.proxy,
    aws_api_gateway_integration_response.logout,
  ]
}

resource "aws_api_gateway_stage" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id

  stage_name = var.stage_name
}
