import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import DashboardPage from "./pages/dashboard";
import AuthLayout from "./layouts/auth";
import LogoutPage from "./pages/logout";

const appBasePath = (() => {
  try {
    const path = new URL(
      import.meta.env.VITE_COGNITO_REDIRECT_URI as string,
    ).pathname;

    return path === "/" ? undefined : path;
  } catch {
    return undefined;
  }
})();

export default function App() {
  return (
    <BrowserRouter basename={appBasePath}>
      <Routes>
        <Route path="/logout" element={<LogoutPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
