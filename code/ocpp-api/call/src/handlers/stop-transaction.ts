export type StopTransactionReq = {
  transactionId: number;
  meterStop: number;
  timestamp: string;
};
export type StopTransactionRes = {};

export async function stopTransaction(
  _chargerId: string,
  _req: StopTransactionReq,
): Promise<StopTransactionRes> {
  return {};
}
