import type { AuthProviderProps } from "react-oidc-context";

export const cognitoConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY as string,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI as string,
  response_type: "code",
};

export const cognitoLogoutUri =
  (import.meta.env.VITE_COGNITO_LOGOUT_URI as string | undefined) ??
  `${import.meta.env.VITE_COGNITO_REDIRECT_URI as string}/logout`;

export const signOutRedirect = () => {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
  const domain = import.meta.env.VITE_COGNITO_DOMAIN as string;

  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(cognitoLogoutUri)}`;
};
