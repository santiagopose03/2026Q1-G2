import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export default function LogoutPage() {
  const auth = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function clearSessionAndReturnToSignIn() {
      await auth.removeUser();

      if (!cancelled) {
        await auth.signinRedirect();
      }
    }

    void clearSessionAndReturnToSignIn();

    return () => {
      cancelled = true;
    };
  }, [auth]);

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Logout</p>
        <h1>Cerrando sesion</h1>
      </section>
    </main>
  );
}
