module "libraries" {
  source = "./modules/nodejs-package"

  for_each = local.libraries
  root_dir = each.value.path
}

module "admin_web" {
  source = "./modules/web-spa"

  root_dir  = local.admin_web.root_dir
  s3_bucket = module.admin_web_deployment.s3_bucket

  env_vars = {
    VITE_COGNITO_DOMAIN       = "https://${aws_cognito_user_pool_domain.admins.domain}.auth.${var.aws_region}.amazoncognito.com"
    VITE_COGNITO_AUTHORITY    = "https://${aws_cognito_user_pool.admins.endpoint}"
    VITE_COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.website.id
    VITE_COGNITO_REDIRECT_URI = module.admin_web_deployment.website_endpoint
    VITE_COGNITO_LOGOUT_URI   = "${module.admin_web_deployment.website_endpoint}/logout"
    VITE_REST_API_ENDPOINT    = module.rest_api.api_endpoint
    VITE_WS_API_ENDPOINT      = module.ws_api.api_endpoint
  }
}

module "admin_web_deployment" {
  source = "./modules/s3-gw-website"

  aws_region    = var.aws_region
  bucket_prefix = "website-"

  proxy_gateway_name = "WebsiteProxy"
}

resource "aws_cognito_user_pool" "admins" {
  name = "Administrators"

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }
}

resource "aws_cognito_user_pool_domain" "admins" {
  user_pool_id = aws_cognito_user_pool.admins.id

  domain = var.cognito_domain
}

resource "aws_cognito_user" "root" {
  user_pool_id = aws_cognito_user_pool.admins.id
  username     = "root"

  attributes = {
    email = var.root_user_email
  }

  desired_delivery_mediums = ["EMAIL"]
}

resource "aws_cognito_user_pool_client" "website" {
  user_pool_id    = aws_cognito_user_pool.admins.id
  generate_secret = false

  name = "Website"

  allowed_oauth_flows_user_pool_client = true

  allowed_oauth_flows  = ["code"]
  allowed_oauth_scopes = ["email", "openid"]
  explicit_auth_flows = [
    "ALLOW_USER_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  callback_urls = [module.admin_web_deployment.website_endpoint]
  logout_urls   = ["${module.admin_web_deployment.website_endpoint}/logout"]

  supported_identity_providers  = ["COGNITO"]
  prevent_user_existence_errors = "ENABLED"
}

module "ocpp_api" {
  source = "./modules/ocpp-api"
  name   = "OcppApi"
  stage  = "ocpp"

  handlers = {
    connect    = module.ocpp_lambdas["Connect"]
    disconnect = module.ocpp_lambdas["Disconnect"]

    call   = module.ocpp_lambdas["Call"]
    result = module.ocpp_lambdas["Result"]
    error  = module.ocpp_lambdas["Error"]
  }
}

module "rest_api" {
  source = "./modules/rest-api"
  name   = "RestApi"
  stage  = "rest"

  cognito_user_pools = {
    providerARNs = [aws_cognito_user_pool.admins.arn]
  }

  handlers = {
    get_many_chargers = module.rest_lambdas["GetManyChargers"]
    get_one_charger   = module.rest_lambdas["GetOneCharger"]
    create_charger    = module.rest_lambdas["CreateCharger"]
    delete_charger    = module.rest_lambdas["DeleteCharger"]
  }
}

module "ws_api" {
  source = "./modules/ws-api"
  name   = "WebClientApi"
  stage  = "ws"

  handlers = {
    connect    = module.ws_lambdas["Connect"]
    disconnect = module.ws_lambdas["Disconnect"]
    ocpp_call  = module.ws_lambdas["OcppCall"]
  }
}



data "aws_iam_role" "lambda" {
  name = "LabRole"
}

module "ocpp_lambdas" {
  source = "./modules/nodejs-lambda"

  for_each = local.ocpp_lambdas

  function_name = "Ocpp${each.key}"
  root_dir      = each.value.path

  depends_on = [module.libraries]
}

module "rest_lambdas" {
  source = "./modules/nodejs-lambda"

  for_each = local.rest_lambdas

  function_name = "Rest${each.key}"
  root_dir      = each.value.path

  depends_on = [module.libraries]
}

module "ws_lambdas" {
  source = "./modules/nodejs-lambda"

  for_each = local.ws_lambdas

  function_name = "WebClient${each.key}"
  root_dir      = each.value.path

  environment_variables = each.value.environment_variables

  depends_on = [module.libraries]
}

module "internal_lambdas" {
  source = "./modules/nodejs-lambda"

  for_each = local.internal_lambdas

  function_name = each.key
  root_dir      = each.value.path

  environment_variables = each.value.environment_variables
}



resource "aws_dynamodb_table" "chargers" {
  name = "Chargers"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "chargerId"

  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"

  attribute {
    name = "chargerId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "charger_by_connection" {
  name = "ChargerByConnection"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = "expireAt"
  }
}

resource "aws_dynamodb_table" "web_clients" {
  name = "WebClients"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "group"

  attribute {
    name = "group"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = "expireAt"
  }
}

resource "aws_dynamodb_table" "ocpp_calls" {
  name = "OcppCalls"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = "timeoutAt"
  }
}

resource "aws_lambda_event_source_mapping" "charger_stream" {
  event_source_arn  = aws_dynamodb_table.chargers.stream_arn
  function_name     = module.internal_lambdas["ChargersStream"].function_name
  starting_position = "LATEST"
}



output "ocpp_api_endpoint" {
  value = module.ocpp_api.api_endpoint
}

output "rest_api_endpoint" {
  value = module.rest_api.api_endpoint
}

output "ws_api_endpoint" {
  value = module.ws_api.api_endpoint
}

output "website_endpoint" {
  value = module.admin_web_deployment.website_endpoint
}
