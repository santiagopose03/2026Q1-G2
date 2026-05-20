import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";

import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import {
  ConditionalCheckFailedException,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import type { Call, EventBody } from "./types.js";

export const client = new DynamoDBClient({});

const gateway = new ApiGatewayManagementApiClient({
  endpoint: process.env.OCPP_GW_ENDPOINT,
});

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (
  event,
  _context,
) => {
  const { method, chargerId, connectorId }: EventBody = JSON.parse(event.body!);

  const getCharger = new GetItemCommand({
    TableName: "Chargers",
    Key: marshall({ chargerId }),
  });

  const { Item } = await client.send(getCharger);
  if (Item === undefined) {
    return {
      body: JSON.stringify({
        event: "error.not-found",
        chargerId,
      }),
    };
  }

  const { connectionId } = unmarshall(Item);
  if (connectionId === null) {
    return {
      body: JSON.stringify({
        event: "error.offline",
        chargerId,
      }),
    };
  }

  const uniqueId = randomUUID();

  const currentTime = DateTime.now();
  const timeoutAt = currentTime.plus({ minutes: 2 }).toUnixInteger();

  const concurrencyCheck = new PutItemCommand({
    TableName: "OcppCalls",
    Item: marshall({ connectionId, uniqueId, method, timeoutAt }),
    ConditionExpression:
      "attribute_not_exists(connectionId) OR timeoutAt<:currentTime",
    ExpressionAttributeValues: marshall({
      ":currentTime": currentTime.toUnixInteger(),
    }),
  });

  try {
    await client.send(concurrencyCheck);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return { body: JSON.stringify({ event: "error.busy", chargerId }) };
    } else {
      throw error;
    }
  }

  let req: object;
  switch (method) {
    case "RemoteStartTransaction":
      req = { idTag: "admin", connectorId };
      break;
    case "RemoteStopTransaction":
      req = { transactionId: connectorId };
      break;
    default:
      return { body: JSON.stringify({ event: "error.unimplemented", method }) };
  }

  const message = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify([2, uniqueId, method, req] satisfies Call),
  });

  await gateway.send(message);

  return {
    body: JSON.stringify({
      event: "ocpp.pending",
      chargerId,
      method,
    }),
  };
};
