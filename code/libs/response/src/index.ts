import type { APIGatewayProxyResult } from "aws-lambda";

export function Ok(data?: object): APIGatewayProxyResult {
  return {
    statusCode: 200,
    body: data !== undefined ? JSON.stringify(data) : "",
  };
}

export function Created(data: object): APIGatewayProxyResult {
  return {
    statusCode: 201,
    body: JSON.stringify(data),
  };
}

export function BadRequest(): APIGatewayProxyResult {
  return { statusCode: 400, body: JSON.stringify({ message: "Bad Request" }) };
}

export function Unauthorized(): APIGatewayProxyResult {
  return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
}

export function NotFound(): APIGatewayProxyResult {
  return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
}

export function Conflict(): APIGatewayProxyResult {
  return { statusCode: 409, body: JSON.stringify({ message: "Conflict" }) };
}

export function UnsupportedMediaType(): APIGatewayProxyResult {
  return {
    statusCode: 415,
    body: JSON.stringify({ message: "Unsupported Media Type" }),
  };
}

export function Cors(response: APIGatewayProxyResult): APIGatewayProxyResult {
  return {
    ...response,
    headers: {
      ...response.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    },
  };
}
