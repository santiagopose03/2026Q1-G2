export type Connector = {
  status: string;
  error: string;
  timestamp: string;
};

export type Charger = {
  chargerId: string;
  online: boolean;
  info: Record<string, unknown>;
  connectors: Record<string, Connector>;
};

export type OcppMethod = "RemoteStartTransaction" | "RemoteStopTransaction";

export type WsEvent =
  | { event: "charger.update"; data: Charger }
  | { event: "ocpp.pending"; chargerId: string; method: OcppMethod }
  | { event: "error.busy"; chargerId: string }
  | { event: "error.offline"; chargerId: string }
  | { event: "error.not-found"; chargerId: string }
  | { event: "error.unimplemented"; method: string };
