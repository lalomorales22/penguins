import { afterEach, beforeEach } from "vitest";
import { PenguinsApp } from "../app.ts";

// oxlint-disable-next-line typescript/unbound-method
const originalConnect = PenguinsApp.prototype.connect;

export function mountApp(pathname: string) {
  window.history.replaceState({}, "", pathname);
  const app = document.createElement("penguins-app") as PenguinsApp;
  document.body.append(app);
  return app;
}

export function registerAppMountHooks() {
  beforeEach(() => {
    PenguinsApp.prototype.connect = () => {
      // no-op: avoid real gateway WS connections in browser tests
    };
    window.__PENGUINS_CONTROL_UI_BASE_PATH__ = undefined;
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    PenguinsApp.prototype.connect = originalConnect;
    window.__PENGUINS_CONTROL_UI_BASE_PATH__ = undefined;
    localStorage.clear();
    document.body.innerHTML = "";
  });
}
