import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

import { Cors, Ok } from "@lib/response";

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (_event, _context) => {
  const command = new ScanCommand({
    TableName: "Chargers",
  });

  const response = await client.send(command);

  const chargers = response.Items?.map((item) => unmarshall(item))?.map(
    ({ chargerId, connectionId, info, connectors }) => ({
      chargerId,
      online: connectionId !== null,
      info,
      connectors,
    }),
  );

  return Cors(Ok(chargers ?? []));
};
