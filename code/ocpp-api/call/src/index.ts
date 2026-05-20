import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";

import type { Call, CallError, CallResult } from "./types.js";
import { client } from "./client.js";

import {
  bootNotification,
  type BootNotificationReq,
} from "./handlers/boot-notification.js";
import { heartbeat, type HeartbeatReq } from "./handlers/heartbeat.js";
import {
  statusNotification,
  type StatusNotificationReq,
} from "./handlers/status-notification.js";
import {
  startTransaction,
  type StartTransactionReq,
} from "./handlers/start-transaction.js";
import {
  stopTransaction,
  type StopTransactionReq,
} from "./handlers/stop-transaction.js";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (
  event,
  _context,
) => {
  const connectionId = event.requestContext.connectionId;
  const [_, id, action, req]: Call = JSON.parse(event.body!);

  const chargerId = await getChargerId(connectionId);

  try {
    let res: object;

    switch (action) {
      case "BootNotification":
        res = await bootNotification(chargerId, req as BootNotificationReq);
        break;
      case "Heartbeat":
        res = await heartbeat(chargerId, req as HeartbeatReq);
        break;
      case "StatusNotification":
        res = await statusNotification(chargerId, req as StatusNotificationReq);
        break;
      case "StartTransaction":
        res = await startTransaction(chargerId, req as StartTransactionReq);
        break;
      case "StopTransaction":
        res = await stopTransaction(chargerId, req as StopTransactionReq);
        break;
      default:
        throw new Error("NotImplemented");
    }

    return { body: JSON.stringify(createResult(id, res)) };
  } catch (error) {
    return {
      body: JSON.stringify(createError(id, error as Error)),
    };
  }
};

async function getChargerId(connectionId: string): Promise<string> {
  const command = new GetItemCommand({
    TableName: "ChargerByConnection",
    Key: marshall({ connectionId }),
  });

  const response = await client.send(command);
  if (response.Item === undefined) {
    throw new Error("NotFound");
  }

  const { chargerId } = unmarshall(response.Item);

  return chargerId;
}

function createResult(id: string, payload: object): CallResult {
  return [3, id, payload];
}

function createError(id: string, error: Error): CallError {
  return [4, id, error.message, "", {}];
}
