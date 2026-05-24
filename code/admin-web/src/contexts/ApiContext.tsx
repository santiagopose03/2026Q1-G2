import { createContext, useContext } from "react";
import type { Charger } from "../api/types";

type ApiContextProps = {
  chargersApi: {
    get: () => Promise<Charger[]>;
    register: (chargerId: string, connectors: number) => Promise<Charger>;
    deregister: (chargerId: string) => Promise<void>;
  };
  socket: WebSocket;
};

export const ApiContext = createContext<ApiContextProps>({
  chargersApi: {
    get: () => new Promise<Charger[]>(() => {}),
    register: () => new Promise<Charger>(() => {}),
    deregister: () => new Promise<void>(() => {}),
  },
  socket: {} as unknown as WebSocket,
});

export function useApi() {
  return useContext(ApiContext);
}
