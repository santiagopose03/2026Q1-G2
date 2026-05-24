import type { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { BadRequest } from "@lib/response";
import { DateTime } from "luxon";

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const connectionId = event.requestContext.connectionId;

  if (connectionId === undefined) {
    return BadRequest();
  }

  const expireAt = DateTime.now().plus({ hours: 2 }).toUnixInteger();

  const command = new PutItemCommand({
    TableName: "WebClients",
    Item: marshall({ group: "global", connectionId, expireAt }),
  });

  await client.send(command);

  return {
    statusCode: 200,
    body: "",
  };
};
