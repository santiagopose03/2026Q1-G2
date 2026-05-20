import {
  ConditionalCheckFailedException,
  DeleteItemCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

import { Cors, NotFound, Ok } from "@lib/response";

type RequestPathParams = { chargerId: string };

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const { chargerId } = event.pathParameters as RequestPathParams;

  const command = new DeleteItemCommand({
    TableName: "Chargers",
    ConditionExpression: "attribute_exists(chargerId)",
    Key: marshall({ chargerId }),
  });

  try {
    await client.send(command);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return Cors(NotFound());
    }

    throw error;
  }

  return Cors(Ok());
};
