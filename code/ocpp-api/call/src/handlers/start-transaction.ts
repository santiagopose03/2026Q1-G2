export type StartTransactionReq = {
  connectorId: number;
  idTag: string;
  meterStart: number;
  timestamp: string;
};
export type StartTransactionRes = {
  transactionId: number;
  idTagInfo: { status: "Accepted" };
};

export async function startTransaction(
  _chargerId: string,
  { connectorId }: StartTransactionReq,
): Promise<StartTransactionRes> {
  return { transactionId: connectorId, idTagInfo: { status: "Accepted" } };
}
