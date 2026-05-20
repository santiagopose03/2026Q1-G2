import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

import { Cors, NotFound, Ok } from "@lib/response";

type RequestPathParams = { chargerId: string };

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const { chargerId } = event.pathParameters as RequestPathParams;

  const command = new GetItemCommand({
    TableName: "Chargers",
    Key: marshall({ chargerId }),
  });

  const response = await client.send(command);

  if (response.Item === undefined) {
    return Cors(NotFound());
  }

  const { connectionId, info, connectors } = unmarshall(response.Item);
  const charger = {
    chargerId,
    online: connectionId !== null,
    info,
    connectors,
  };

  return Cors(Ok(charger));
};
