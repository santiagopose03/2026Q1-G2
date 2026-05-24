import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

import { DateTime } from "luxon";

import { normalize } from "@lib/headers";
import { Conflict, Cors, Created, UnsupportedMediaType } from "@lib/response";

type RequestBody = { chargerId: string; connectors: number };

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const headers = normalize(event.headers ?? {});
  if (headers["content-type"] !== "application/json") {
    return Cors(UnsupportedMediaType());
  }

  const { chargerId, connectors: connectorCount }: RequestBody = JSON.parse(
    event.body!,
  );

  const timestamp = DateTime.utc().toISO();

  const connectors = new Array(connectorCount)
    .fill(0)
    .map(() => ({
      status: "Unavailable",
      error: "NoError",
      timestamp,
    }))
    .reduce(
      (set, connector, index) => ({
        ...set,
        [index + 1]: connector,
      }),
      {},
    );

  const command = new PutItemCommand({
    TableName: "Chargers",
    ConditionExpression: "attribute_not_exists(chargerId)",
    Item: marshall({
      chargerId,
      connectionId: null,
      info: {},
      connectors,
    }),
  });

  try {
    await client.send(command);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return Cors(Conflict());
    }

    throw error;
  }

  return Cors(Created({ chargerId, online: false, info: {}, connectors }));
};
