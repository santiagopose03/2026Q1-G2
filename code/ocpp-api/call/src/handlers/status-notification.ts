import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { DateTime } from "luxon";

import { client } from "../client.js";

export type StatusNotificationReq = {
  connectorId: number;
  errorCode: string;
  status: string;
  timestamp?: string;
};

export type StatusNotificationRes = {};

export async function statusNotification(
  chargerId: string,
  { connectorId, errorCode, status, timestamp }: StatusNotificationReq,
): Promise<StatusNotificationRes> {
  if (connectorId === 0) {
    return {};
  }

  const connector = {
    status,
    error: errorCode,
    timestamp: timestamp ?? DateTime.utc().toISO(),
  };

  const command = new UpdateItemCommand({
    TableName: "Chargers",
    Key: marshall({ chargerId }),
    UpdateExpression: "SET connectors.#connectorId = :connector",
    ConditionExpression:
      "attribute_exists(chargerId) AND attribute_exists(connectors.#connectorId)",
    ExpressionAttributeNames: { "#connectorId": connectorId.toString() },
    ExpressionAttributeValues: marshall({
      ":connector": connector,
    }),
  });

  await client.send(command);

  return {};
}
