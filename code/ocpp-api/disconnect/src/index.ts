import type { APIGatewayProxyHandler } from "aws-lambda";
import {
  ConditionalCheckFailedException,
  DeleteItemCommand,
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { NotFound, Ok } from "@lib/response";

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  const connectionId = event.requestContext.connectionId!;

  const deleteCommand = new DeleteItemCommand({
    TableName: "ChargerByConnection",
    Key: marshall({ connectionId }),
    ReturnValues: "ALL_OLD",
  });

  const { Attributes } = await client.send(deleteCommand);
  if (Attributes === undefined) {
    return NotFound();
  }

  const { chargerId } = unmarshall(Attributes);

  const updateCommand = new UpdateItemCommand({
    TableName: "Chargers",
    Key: marshall({ chargerId }),
    UpdateExpression: "SET connectionId = :null",
    ConditionExpression:
      "attribute_exists(chargerId) AND connectionId = :connectionId",
    ExpressionAttributeValues: marshall({
      ":connectionId": connectionId,
      ":null": null,
    }),
  });

  try {
    await client.send(updateCommand);
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) {
      throw error;
    }
  }

  return Ok();
};
