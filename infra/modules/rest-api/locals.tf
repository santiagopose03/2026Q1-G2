locals {
  api_config = {
    resources = [
      aws_api_gateway_resource.chargers_collection.id,
      aws_api_gateway_resource.chargers_item.id,
    ]

    methods = [
      aws_api_gateway_method.create_charger.id,
      aws_api_gateway_method.get_many_chargers.id,
      aws_api_gateway_method.get_one_charger.id,
      aws_api_gateway_method.delete_charger.id,
    ]

    integrations = [
      aws_api_gateway_integration.create_charger.id,
      aws_api_gateway_integration.get_many_chargers.id,
      aws_api_gateway_integration.get_one_charger.id,
      aws_api_gateway_integration.delete_charger.id,
    ]

    validation = [
      aws_api_gateway_model.create_charger.id,
      aws_api_gateway_request_validator.body_only.id,
      aws_api_gateway_request_validator.params_only.id,
    ]

    authorizers = [
      aws_api_gateway_authorizer.cognito.id,
    ]

    cors = module.cors.resources_cors
  }
}
