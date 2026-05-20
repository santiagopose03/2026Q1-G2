import type { Charger, OcppMethod } from "../api/types";
import ConnectorCard from "./ConnectorCard";

type ChargerCardProps = {
  charger: Charger;
  socketOpen: boolean;
  onAction: (connectorId: number, method: OcppMethod) => void;
  onDelete: () => void;
};

export default function ChargerCard({
  charger,
  socketOpen,
  onAction,
  onDelete,
}: ChargerCardProps) {
  return (
    <article className="charger-row" key={charger.chargerId}>
      <div className="charger-main">
        <div>
          <h3>{charger.chargerId}</h3>
          <span className={charger.online ? "status online" : "status offline"}>
            {charger.online ? "Online" : "Offline"}
          </span>
        </div>
        <button className="danger-button" onClick={onDelete}>
          Borrar
        </button>
      </div>
      <div className="connector-grid">
        {Object.entries(charger.connectors).map(([connectorId, connector]) => (
          <ConnectorCard
            key={connectorId}
            connectorId={parseInt(connectorId)}
            charger={charger}
            connector={connector}
            socketOpen={socketOpen}
            onAction={(method) => onAction(parseInt(connectorId), method)}
          />
        ))}
      </div>
    </article>
  );
}
