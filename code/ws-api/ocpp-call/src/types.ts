type UniqueId = string;

type Method = "RemoteStartTransaction" | "RemoteStopTransaction";
type Req = object;

export type Call = [2, UniqueId, Method, Req];

type RemoteStartTransactionEvent = {
  action: "ocpp.call";
  method: "RemoteStartTransaction";
  chargerId: string;
  connectorId: number;
};

type RemoteStopTransactionEvent = {
  action: "ocpp.call";
  method: "RemoteStopTransaction";
  chargerId: string;
  connectorId: number;
};

export type EventBody =
  | RemoteStartTransactionEvent
  | RemoteStopTransactionEvent;
