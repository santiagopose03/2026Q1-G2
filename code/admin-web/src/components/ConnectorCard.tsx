import type { Charger, Connector, OcppMethod } from "../api/types";
import { dateTimeFormat } from "../utils/format";

type ConnectorCardProps = {
  connectorId: number;
  socketOpen: boolean;
  charger: Charger;
  connector: Connector;
  onAction: (method: OcppMethod) => void;
};

export default function ConnectorCard({
  connectorId,
  socketOpen,
  charger,
  connector,
  onAction,
}: ConnectorCardProps) {
  const canStop = ["Charging", "SuspendedEV", "SuspendedEVSE"].includes(
    connector.status,
  );

  return (
    <div className="connector-tile" key={connectorId}>
      <div>
        <strong>Conector {connectorId}</strong>
        <span>{dateTimeFormat.format(new Date(connector.timestamp))}</span>
      </div>
      <p>{connector.status}</p>
      <small>{connector.error}</small>
      <div className="connector-actions">
        <button
          className="start-button"
          disabled={
            !charger.online || !socketOpen || connector.status !== "Preparing"
          }
          onClick={() => onAction("RemoteStartTransaction")}
          type="button"
        >
          Iniciar
        </button>
        <button
          className="stop-button"
          disabled={!charger.online || !socketOpen || !canStop}
          onClick={() => onAction("RemoteStopTransaction")}
          type="button"
        >
          Cortar
        </button>
      </div>
    </div>
  );
}
