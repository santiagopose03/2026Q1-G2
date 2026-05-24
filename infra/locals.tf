locals {
  libraries = {
    headers  = { path = "${path.module}/../code/libs/headers" }
    response = { path = "${path.module}/../code/libs/response" }
  }

  admin_web = {
    root_dir = "${path.module}/../code/admin-web"
  }

  ocpp_lambdas = {
    "Connect"    = { path = "${path.module}/../code/ocpp-api/connect" }
    "Disconnect" = { path = "${path.module}/../code/ocpp-api/disconnect" }
    "Call"       = { path = "${path.module}/../code/ocpp-api/call" }
    "Result"     = { path = "${path.module}/../code/ocpp-api/result" }
    "Error"      = { path = "${path.module}/../code/ocpp-api/error" }
  }

  rest_lambdas = {
    "GetManyChargers" = { path = "${path.module}/../code/rest-api/get-many-chargers" }
    "GetOneCharger"   = { path = "${path.module}/../code/rest-api/get-one-charger" }
    "CreateCharger"   = { path = "${path.module}/../code/rest-api/create-charger" }
    "DeleteCharger"   = { path = "${path.module}/../code/rest-api/delete-charger" }
  }

  ws_lambdas = {
    "Connect" = {
      path = "${path.module}/../code/ws-api/connect"

      environment_variables = {}
    }
    "Disconnect" = {
      path = "${path.module}/../code/ws-api/disconnect"

      environment_variables = {}
    }
    "OcppCall" = {
      path = "${path.module}/../code/ws-api/ocpp-call"

      environment_variables = {
        OCPP_GW_ENDPOINT = "https://${trimprefix(module.ocpp_api.api_endpoint, "wss://")}"
      }
    }
  }

  internal_lambdas = {
    "ChargersStream" = {
      path = "${path.module}/../code/internal/chargers-stream"

      environment_variables = {
        WS_GW_ENDPOINT = "https://${trimprefix(module.ws_api.api_endpoint, "wss://")}"
      }
    }
  }
}
