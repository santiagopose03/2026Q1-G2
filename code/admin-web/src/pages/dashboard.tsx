import { useCallback, useEffect, useMemo, useState } from "react";
import type { Charger, WsEvent, OcppMethod } from "../api/types";
import { useApi } from "../contexts/ApiContext";
import ChargerCard from "../components/ChargerCard";
import { signOutRedirect } from "../constants/cognito";

export default function DashboardPage() {
  const { chargersApi, socket } = useApi();

  const [chargers, setChargers] = useState<Charger[]>([]);

  const [chargerId, setChargerId] = useState("");
  const [connectors, setConnectors] = useState(2);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [socketReadyState, setSocketReadyState] = useState(socket.readyState);

  const stats = useMemo(() => {
    const total = chargers.length;
    const online = chargers.filter((charger) => charger.online).length;
    const connectorStates = chargers.reduce<Record<string, number>>(
      (states, charger) => {
        for (const connector of Object.values(charger.connectors)) {
          states[connector.status] = (states[connector.status] ?? 0) + 1;
        }
        return states;
      },
      {},
    );
    const connectorCount = Object.values(connectorStates).reduce(
      (count, value) => count + value,
      0,
    );
    const unavailable = connectorStates.Unavailable ?? 0;
    return {
      total,
      online,
      offline: total - online,
      connectorCount,
      connectorStates,
      unavailable,
    };
  }, [chargers]);

  const loadChargers = useCallback(async () => {
    await chargersApi
      .get()
      .then(setChargers)
      .finally(() => setIsLoading(false));
  }, [chargersApi]);

  const createCharger = useCallback(
    async (chargerId: string, connectors: number) => {
      setIsSaving(true);

      await chargersApi
        .register(chargerId, connectors)
        .then((charger) => setChargers((array) => [...array, charger]))
        .finally(() => setIsSaving(false));
    },
    [chargersApi],
  );

  const deleteCharger = useCallback(
    async (chargerId: string) => {
      await chargersApi
        .deregister(chargerId)
        .then(() =>
          setChargers((array) =>
            array.filter((charger) => charger.chargerId !== chargerId),
          ),
        );
    },
    [chargersApi],
  );

  const sendOcppAction = useCallback(
    (chargerId: string, connectorId: number, method: OcppMethod) => {
      if (socket.readyState !== WebSocket.OPEN) {
        setActionMessage("El WebSocket no esta conectado.");
        return;
      }

      setActionMessage(null);
      socket.send(
        JSON.stringify({ action: "ocpp.call", method, chargerId, connectorId }),
      );
    },
    [socket],
  );

  const handleLogoutClick = useCallback(() => {
    signOutRedirect();
  }, []);

  useEffect(() => {
    void loadChargers();
  }, [loadChargers]);

  useEffect(() => {
    function onOpen() {
      setSocketReadyState(WebSocket.OPEN);
    }

    function onClose() {
      setSocketReadyState(WebSocket.CLOSED);
    }

    function onError() {
      setSocketReadyState(WebSocket.CLOSED);
      setActionMessage("El WebSocket encontro un error de conexion.");
    }

    function onMessage({ data }: MessageEvent<string>) {
      const wsEvent = JSON.parse(data) as WsEvent;

      if (wsEvent.event === "charger.update") {
        setChargers((array) =>
          array.some((charger) => charger.chargerId === wsEvent.data.chargerId)
            ? array.map((charger) =>
                wsEvent.data.chargerId === charger.chargerId
                  ? wsEvent.data
                  : charger,
              )
            : [...array, wsEvent.data],
        );
        return;
      }

      if (wsEvent.event === "ocpp.pending") {
        const label =
          wsEvent.method === "RemoteStartTransaction" ? "Inicio" : "Corte";
        setActionMessage(
          `${label} enviado a ${wsEvent.chargerId}. Esperando respuesta.`,
        );
        return;
      }

      if (wsEvent.event === "error.busy") {
        setActionMessage(`${wsEvent.chargerId} esta ocupado con otra accion.`);
        return;
      }

      if (wsEvent.event === "error.offline") {
        setActionMessage(`${wsEvent.chargerId} esta offline.`);
        return;
      }

      if (wsEvent.event === "error.not-found") {
        setActionMessage(`${wsEvent.chargerId} no existe.`);
        return;
      }

      if (wsEvent.event === "error.unimplemented") {
        setActionMessage(`Accion no implementada: ${wsEvent.method}.`);
      }
    }

    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
    };
  }, [socket]);

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Estado operacional</p>
          <h1>Cargadores</h1>
        </div>
        <div className="topbar-actions">
          <span
            className={`socket-pill ${socketReadyState === WebSocket.OPEN ? "live" : ""}`}
          >
            {socketReadyState === WebSocket.OPEN ? "Live" : "Offline"}
          </span>
          <button className="ghost-button" onClick={() => void loadChargers()}>
            Actualizar
          </button>
          <button className="ghost-button" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </header>

      <section className="metrics-grid">
        <article>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Online</span>
          <strong>{stats.online}</strong>
        </article>
        <article>
          <span>Offline</span>
          <strong>{stats.offline}</strong>
        </article>
        <article>
          <span>No disponibles</span>
          <strong>{stats.unavailable}</strong>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="create-panel">
          <h2>Nuevo cargador</h2>
          <label>
            ID del cargador
            <input
              minLength={4}
              maxLength={36}
              required
              value={chargerId}
              onChange={(event) => setChargerId(event.target.value)}
              placeholder="Ej: Charger-01"
            />
          </label>
          <label>
            Conectores
            <select
              value={connectors}
              onChange={(event) => setConnectors(Number(event.target.value))}
            >
              <option value={1}>1 conector</option>
              <option value={2}>2 conectores</option>
            </select>
          </label>
          <button
            className="primary-button"
            disabled={isSaving}
            type="submit"
            onClick={() => void createCharger(chargerId, connectors)}
          >
            {isSaving ? "Creando..." : "Crear cargador"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>

        <section className="chargers-panel">
          <div className="section-heading">
            <h2>Estado de cargadores</h2>
            {isLoading && <span>Cargando...</span>}
          </div>
          <section className="connector-summary">
            <div className="connector-summary-heading">
              <h3>Conectores</h3>
              <strong>{stats.connectorCount}</strong>
            </div>
            <div className="connector-state-list">
              {Object.entries(stats.connectorStates).length === 0 && (
                <span>Sin conectores registrados</span>
              )}
              {Object.entries(stats.connectorStates).map(([status, count]) => (
                <span key={status}>
                  {status}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </section>
          {actionMessage && <p className="action-message">{actionMessage}</p>}
          <div className="charger-list">
            {chargers.map((charger) => (
              <ChargerCard
                key={charger.chargerId}
                charger={charger}
                socketOpen={socketReadyState === WebSocket.OPEN}
                onAction={(connectorId, method) =>
                  sendOcppAction(charger.chargerId, connectorId, method)
                }
                onDelete={() => void deleteCharger(charger.chargerId)}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
