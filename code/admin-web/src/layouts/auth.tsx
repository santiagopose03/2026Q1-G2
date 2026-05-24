import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Outlet } from "react-router";

export default function AuthLayout() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      void auth.signinRedirect();
    }
  }, [auth]);

  return auth.isLoading && auth.isAuthenticated ? (
    <p>Loading...</p>
  ) : (
    <Outlet />
  );
}
