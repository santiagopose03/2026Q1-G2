import type { APIGatewayProxyHandler } from "aws-lambda";
import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (_event, _context) => {
  const command = new DeleteItemCommand({
    TableName: "WebClients",
    Key: marshall({ group: "global" }),
  });

  await client.send(command);

  return {
    statusCode: 200,
    body: "",
  };
};
