import type { DynamoDBStreamHandler } from "aws-lambda";
import {
  DynamoDBClient,
  GetItemCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

const client = new DynamoDBClient({});
const gateway = new ApiGatewayManagementApiClient({
  endpoint: process.env.WS_GW_ENDPOINT,
});

export const handler: DynamoDBStreamHandler = async ({ Records }, _context) => {
  const command = new GetItemCommand({
    TableName: "WebClients",
    Key: marshall({ group: "global" }),
  });

  const { Item } = await client.send(command);
  if (Item === undefined) {
    return;
  }

  const { connectionId } = unmarshall(Item);

  const newValues = Records.filter(
    ({ eventName }) => eventName === "MODIFY",
  ).map(({ dynamodb }) =>
    unmarshall(dynamodb?.NewImage as Record<string, AttributeValue>),
  );

  const events = newValues.map(
    ({ chargerId, connectionId, info, connectors }) => ({
      event: "charger.update",
      data: { chargerId, online: connectionId !== null, info, connectors },
    }),
  );

  const messages = events.map(
    (event) =>
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(event),
      }),
  );

  await Promise.allSettled(messages.map((message) => gateway.send(message)));

  return;
};
