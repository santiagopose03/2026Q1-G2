import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

import type { CallError } from "./types.js";
import { marshall } from "@aws-sdk/util-dynamodb";

export const client = new DynamoDBClient({});

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (
  event,
  _context,
) => {
  const [_, uniqueId, _errorCode]: CallError = JSON.parse(event.body!);

  const connectionId = event.requestContext.connectionId;

  const command = new DeleteItemCommand({
    TableName: "OcppCalls",
    Key: marshall({ connectionId }),
    ConditionExpression:
      "attribute_exists(connectionId) AND uniqueId=:uniqueId",
    ExpressionAttributeValues: marshall({ ":uniqueId": uniqueId }),
  });

  await client.send(command);

  return {};
};
