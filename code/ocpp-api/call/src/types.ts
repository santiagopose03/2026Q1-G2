type UniqueId = string;

type Action =
  | "BootNotification"
  | "Heartbeat"
  | "StatusNotification"
  | "StartTransaction"
  | "StopTransaction";

type Req = object;
type Res = object;

type ErrorCode = string;
type ErrorDesc = string;
type ErrorDetails = object;

export type Call = [2, UniqueId, Action, Req];
export type CallResult = [3, UniqueId, Res];
export type CallError = [4, UniqueId, ErrorCode, ErrorDesc, ErrorDetails];
