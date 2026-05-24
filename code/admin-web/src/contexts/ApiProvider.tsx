import { useCallback, useMemo, type PropsWithChildren } from "react";
import { ApiContext } from "./ApiContext";
import { useAuth } from "react-oidc-context";
import axios from "axios";
import { REST_API_BASEURL, WS_API_URL } from "../constants/api";
import type { Charger } from "../api/types";

export function ApiProvider({ children }: PropsWithChildren) {
  const auth = useAuth();

  const socket = useMemo(() => {
    return new WebSocket(`${WS_API_URL}?token=${auth.user?.access_token}`);
  }, [auth.user?.access_token]);

  const rest = useMemo(
    () =>
      axios.create({
        baseURL: REST_API_BASEURL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `${auth.user?.token_type} ${auth.user?.id_token}`,
        },
      }),
    [auth.user?.token_type, auth.user?.id_token],
  );

  const get = useCallback(
    async () => rest.get<Charger[]>("/chargers").then(({ data }) => data),
    [rest],
  );

  const register = useCallback(
    async (chargerId: string, connectors: number) =>
      rest
        .post<Charger>("/chargers", { chargerId, connectors })
        .then(({ data }) => data),
    [rest],
  );

  const deregister = useCallback(
    async (chargerId: string) => {
      await rest.delete<Charger>(`/chargers/${chargerId}`);
    },
    [rest],
  );

  const chargersApi = useMemo(
    () => ({ get, register, deregister }),
    [get, register, deregister],
  );

  return (
    <ApiContext.Provider value={{ chargersApi, socket }}>
      {children}
    </ApiContext.Provider>
  );
}
