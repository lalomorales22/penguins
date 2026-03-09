# Extension Developer Guide

Build extensions for Penguins to add tools, hooks, commands, channels, and services.

## Quick Start

Create a new extension in `~/.penguins/extensions/my-extension/`:

```
my-extension/
  penguins.plugin.json    # metadata manifest
  index.ts                # main entry point
  package.json            # (optional) dependencies
```

### penguins.plugin.json

```json
{
  "id": "my-extension",
  "kind": "utility",
  "configSchema": {
    "type": "object",
    "properties": {
      "enabled": { "type": "boolean", "default": true }
    }
  }
}
```

### index.ts

```typescript
import type { PenguinsPluginApi } from "penguins/plugin-sdk";

export default {
  id: "my-extension",
  name: "My Extension",
  description: "Does something useful",
  kind: "utility",

  register(api: PenguinsPluginApi) {
    // Register tools, hooks, commands, etc.
    api.registerTool((ctx) => ({
      name: "my_tool",
      label: "My Tool",
      description: "Does something",
      parameters: {},
      execute: async (toolCallId, params) => {
        return { content: [{ type: "text", text: "Done!" }] };
      },
    }));
  },
};
```

## Plugin API Reference

The `register(api)` function receives a `PenguinsPluginApi` with:

| Property           | Type           | Description             |
| ------------------ | -------------- | ----------------------- |
| `api.id`           | string         | Plugin ID               |
| `api.name`         | string         | Display name            |
| `api.config`       | PenguinsConfig | Full system config      |
| `api.pluginConfig` | object         | Plugin-specific config  |
| `api.runtime`      | PluginRuntime  | Access to internal APIs |
| `api.logger`       | PluginLogger   | Logger instance         |

### Registration Methods

| Method                                   | Description                     |
| ---------------------------------------- | ------------------------------- |
| `registerTool(factory, opts?)`           | Register an agent-callable tool |
| `registerHook(events, handler, opts?)`   | Register lifecycle hooks        |
| `on(hookName, handler, opts?)`           | Shorthand for hook registration |
| `registerHttpHandler(handler, opts?)`    | Register HTTP request handler   |
| `registerHttpRoute(params)`              | Register typed HTTP route       |
| `registerChannel(registration)`          | Register chat channel           |
| `registerGatewayMethod(method, handler)` | Register WebSocket method       |
| `registerCli(registrar, opts?)`          | Register CLI command            |
| `registerService(service)`               | Register background service     |
| `registerProvider(provider)`             | Register AI provider            |
| `registerCommand(command)`               | Register slash command          |

## Tools

Tools are agent-callable actions. They're created via factory functions that receive session context:

```typescript
api.registerTool(
  (ctx) => {
    // ctx has: config, workspaceDir, agentDir, agentId,
    //          sessionKey, messageChannel, sandboxed
    return {
      name: "weather_lookup",
      label: "Weather Lookup",
      description: "Get current weather for a location",
      parameters: Type.Object({
        location: Type.String({ description: "City name" }),
      }),
      execute: async (toolCallId, params) => {
        const weather = await fetchWeather(params.location);
        return {
          content: [{ type: "text", text: JSON.stringify(weather) }],
          details: { location: params.location },
        };
      },
    };
  },
  { names: ["weather_lookup"] },
);
```

**Key points:**

- Return `null` from the factory if the tool can't be created (missing deps)
- Return an array to register multiple tools from one factory
- Use `{ optional: true }` in opts for non-essential tools
- Tool parameters use TypeBox schemas (`@sinclair/typebox`)

### Tool Result Format

```typescript
{
  content: [{ type: "text", text: "result string" }],
  details?: { /* metadata for logging */ },
  isError?: boolean
}
```

## Hooks

Hooks observe and intercept events throughout the agent lifecycle.

### Available Hooks

#### Agent Lifecycle

| Hook                 | Event Data                                           | Return                               |
| -------------------- | ---------------------------------------------------- | ------------------------------------ |
| `before_agent_start` | `{ prompt, messages? }`                              | `{ systemPrompt?, prependContext? }` |
| `llm_input`          | `{ runId, provider, model, systemPrompt, prompt }`   | —                                    |
| `llm_output`         | `{ runId, provider, model, assistantTexts, usage? }` | —                                    |
| `agent_end`          | `{ messages, success, error?, durationMs? }`         | —                                    |

#### Messages

| Hook               | Event Data                      | Return                  |
| ------------------ | ------------------------------- | ----------------------- |
| `message_received` | `{ from, content, timestamp? }` | —                       |
| `message_sending`  | `{ to, content }`               | `{ content?, cancel? }` |
| `message_sent`     | `{ to, content, success }`      | —                       |

#### Tools

| Hook                  | Event Data                                   | Return                              |
| --------------------- | -------------------------------------------- | ----------------------------------- |
| `before_tool_call`    | `{ toolName, params }`                       | `{ params?, block?, blockReason? }` |
| `after_tool_call`     | `{ toolName, params, result?, durationMs? }` | —                                   |
| `tool_result_persist` | `{ toolName?, message }`                     | `{ message? }`                      |

#### Session

| Hook                | Event Data                                 | Return |
| ------------------- | ------------------------------------------ | ------ |
| `session_start`     | `{ sessionId }`                            | —      |
| `session_end`       | `{ sessionId, messageCount, durationMs? }` | —      |
| `before_compaction` | `{ messageCount, tokenCount? }`            | —      |
| `after_compaction`  | `{ messageCount, compactedCount }`         | —      |
| `before_reset`      | `{ sessionFile?, reason? }`                | —      |

#### Gateway

| Hook            | Event Data    | Return |
| --------------- | ------------- | ------ |
| `gateway_start` | `{ port }`    | —      |
| `gateway_stop`  | `{ reason? }` | —      |

### Hook Example

```typescript
api.on("before_agent_start", async (event, ctx) => {
  // Inject context into every agent run
  return {
    prependContext: "Current user timezone: America/Los_Angeles",
  };
});

api.on("before_tool_call", async (event, ctx) => {
  // Block dangerous tools in certain contexts
  if (event.toolName === "exec" && ctx.messageChannel === "public") {
    return { block: true, blockReason: "exec disabled on public channels" };
  }
});

api.on("agent_end", async (event, ctx) => {
  if (!event.success) return;
  api.logger.info(`Agent completed in ${event.durationMs}ms`);
});
```

## CLI Commands

Register custom CLI subcommands:

```typescript
api.registerCli(
  ({ program, config, logger }) => {
    program
      .command("my-cmd")
      .description("Do something")
      .option("-v, --verbose", "Verbose output")
      .action(async (opts) => {
        logger.info("Running my-cmd");
        // Implementation
      });
  },
  { commands: ["my-cmd"] },
);
```

## Slash Commands

Register commands that users can invoke in chat (e.g., `/tts on`):

```typescript
api.registerCommand({
  name: "mytool",
  description: "Toggle my tool",
  acceptsArgs: true,
  handler: async (ctx) => {
    // ctx has: senderId, channel, args, config
    return { text: `Tool is now ${ctx.args}` };
  },
});
```

## HTTP Routes

Expose custom HTTP endpoints through the gateway:

```typescript
api.registerHttpRoute({
  path: "/my-webhook",
  auth: "gateway", // or "public" for no auth
  handler: async (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  },
});
```

## Background Services

Long-running processes that start with the gateway:

```typescript
api.registerService({
  id: "my-poller",
  start: async (ctx) => {
    // ctx has: config, stateDir, logger
    setInterval(() => pollSomething(), 60_000);
  },
  stop: async (ctx) => {
    // Cleanup
  },
});
```

## Runtime API

Access internal APIs via `api.runtime`:

```typescript
// Config
api.runtime.config.loadConfig();

// System events
api.runtime.system.enqueueSystemEvent({ text: "Something happened" });

// Media
const mime = api.runtime.media.detectMime(buffer);

// Memory tools
const searchTool = api.runtime.tools.createMemorySearchTool({
  config: ctx.config,
  agentSessionKey: ctx.sessionKey,
});
```

## Configuration Schema

Define config options for your extension in `penguins.plugin.json`:

```json
{
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API key for the service"
      },
      "pollInterval": {
        "type": "number",
        "minimum": 5,
        "maximum": 3600,
        "default": 60,
        "description": "Poll interval in seconds"
      }
    }
  }
}
```

Users configure your extension in `penguins.json`:

```json
{
  "extensions": {
    "my-extension": {
      "apiKey": "sk-...",
      "pollInterval": 30
    }
  }
}
```

Access config in your plugin: `api.pluginConfig?.apiKey`.

## Extension Locations

Extensions are loaded from these paths (in order):

1. **Bundled** — `<install-dir>/extensions/` (shipped with Penguins)
2. **Global** — `~/.penguins/extensions/` (user-installed)
3. **Workspace** — `<workspace>/extensions/` (project-specific)
4. **Config** — Paths listed in `penguins.json` `extensionPaths`

## Lifecycle

1. **Discovery** — Extension directories scanned for `penguins.plugin.json`
2. **Loading** — `index.ts` imported and validated
3. **Registration** — `register(api)` called; tools, hooks, commands registered
4. **Active** — Hooks fire on events, tools available to agents
5. **Shutdown** — Services stopped on gateway shutdown

## Best Practices

- Return `null` from tool factories when dependencies are unavailable
- Use `api.logger` instead of `console.log` for structured logging
- Keep hooks fast — heavy work should be async and non-blocking
- Use `api.pluginConfig` for user-configurable options
- Test with `vitest` — see existing extension tests for patterns
- Declare tool names in `registerTool` opts for discoverability
