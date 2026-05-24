import type { APIGatewayProxyHandler } from "aws-lambda";
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { normalize } from "@lib/headers";
import { BadRequest, NotFound } from "@lib/response";
import { DateTime } from "luxon";

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const headers = normalize(event.headers);
  const subprotocols = headers["sec-websocket-protocol"]?.split(", ");

  if (subprotocols === undefined || !subprotocols.includes("ocpp1.6")) {
    return BadRequest();
  }

  const connectionId = event.requestContext.connectionId;
  const { chargerId } = event.queryStringParameters ?? {};

  if (chargerId === undefined || connectionId === undefined) {
    return BadRequest();
  }

  const expireAt = DateTime.now().plus({ hours: 2 }).toUnixInteger();

  const command = new TransactWriteItemsCommand({
    TransactItems: [
      {
        Update: {
          TableName: "Chargers",
          Key: marshall({ chargerId }),
          UpdateExpression: "SET connectionId = :connectionId",
          ExpressionAttributeValues: marshall({
            ":connectionId": connectionId,
          }),
          ConditionExpression: "attribute_exists(chargerId)",
        },
      },
      {
        Put: {
          TableName: "ChargerByConnection",
          Item: marshall({ chargerId, connectionId, expireAt }),
        },
      },
    ],
  });

  try {
    await client.send(command);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return NotFound();
    }

    throw error;
  }

  return {
    statusCode: 200,
    body: "",
    headers: { "sec-websocket-protocol": "ocpp1.6" },
  };
};
