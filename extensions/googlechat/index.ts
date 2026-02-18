import type { PenguinsPluginApi } from "penguins/plugin-sdk";
import { emptyPluginConfigSchema } from "penguins/plugin-sdk";
import { googlechatDock, googlechatPlugin } from "./src/channel.js";
import { handleGoogleChatWebhookRequest } from "./src/monitor.js";
import { setGoogleChatRuntime } from "./src/runtime.js";

const plugin = {
  id: "googlechat",
  name: "Google Chat",
  description: "Penguins Google Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: PenguinsPluginApi) {
    setGoogleChatRuntime(api.runtime);
    api.registerChannel({ plugin: googlechatPlugin, dock: googlechatDock });
    api.registerHttpHandler(handleGoogleChatWebhookRequest);
  },
};

export default plugin;
