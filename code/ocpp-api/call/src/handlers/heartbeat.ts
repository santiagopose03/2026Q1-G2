import { DateTime } from "luxon";

export type HeartbeatReq = {};
export type HeartbeatRes = { currentTime: string };

export async function heartbeat(
  _chargerId: string,
  _req: HeartbeatReq,
): Promise<HeartbeatRes> {
  return { currentTime: DateTime.utc().toISO() };
}
