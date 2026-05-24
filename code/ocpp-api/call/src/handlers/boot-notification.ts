import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

import { DateTime } from "luxon";

import { client } from "../client.js";

export type BootNotificationReq = {
  chargePointModel: string;
  chargePointVendor: string;
  firmwareVersion?: string;
  meterType?: string;
};

export type BootNotificationRes = {
  currentTime: string;
  interval: number;
  status: "Accepted" | "Pending" | "Rejected";
};

export async function bootNotification(
  chargerId: string,
  {
    chargePointModel,
    chargePointVendor,
    firmwareVersion,
    meterType,
  }: BootNotificationReq,
): Promise<BootNotificationRes> {
  const info = {
    chargePointModel,
    chargePointVendor,
    firmwareVersion,
    meterType,
  };

  const command = new UpdateItemCommand({
    TableName: "Chargers",
    Key: marshall({ chargerId }),
    UpdateExpression: "SET info = :info",
    ExpressionAttributeValues: marshall(
      { ":info": info },
      { removeUndefinedValues: true },
    ),
  });

  await client.send(command);

  return {
    currentTime: DateTime.utc().toISO(),
    interval: 300,
    status: "Accepted",
  };
}
