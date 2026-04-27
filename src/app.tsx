import { MandalArtPage } from "./components/mandal-art-page";
import { ThermalStage } from "./components/thermal-stage";

function getRoute() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams(window.location.search);
  const redirectedRoute = params.get("route");

  if (redirectedRoute) {
    const normalizedRoute = redirectedRoute.startsWith("/") ? redirectedRoute : `/${redirectedRoute}`;
    window.history.replaceState(null, "", `${base}${normalizedRoute}`);
    return normalizedRoute;
  }

  if (base && window.location.pathname.startsWith(base)) {
    return window.location.pathname.slice(base.length) || "/";
  }

  return window.location.pathname || "/";
}

export default function App() {
  const route = getRoute();

  return (
    <main className="app">
      {route === "/3d" ? <ThermalStage /> : <MandalArtPage />}
    </main>
  );
}
