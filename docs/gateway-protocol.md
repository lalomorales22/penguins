# Penguins Gateway WebSocket Protocol

**Protocol Version:** 3

The Penguins gateway exposes a WebSocket endpoint for real-time bidirectional communication. This is the primary control plane for CLI clients, mobile apps, the Control UI, and node devices.

## Connection

Connect to the gateway WebSocket at:

```
ws://127.0.0.1:18789/__penguins__/ws
```

## Frame Types

All communication uses JSON text frames with a discriminated `type` field.

### Request Frame

```json
{
  "type": "req",
  "id": "unique-request-id",
  "method": "method.name",
  "params": {}
}
```

### Response Frame

```json
{
  "type": "res",
  "id": "matching-request-id",
  "ok": true,
  "payload": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "retryable": false,
    "retryAfterMs": 5000
  }
}
```

### Event Frame

```json
{
  "type": "event",
  "event": "event.name",
  "payload": {},
  "seq": 42,
  "stateVersion": {
    "health": 5,
    "presence": 3
  }
}
```

## Authentication Handshake

### Step 1: Server Challenge

After WebSocket connection, the server sends a challenge:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": {
    "nonce": "server-generated-nonce",
    "ts": 1737264000000
  }
}
```

### Step 2: Client Connect

The client **must** send a `connect` request as its first message:

```json
{
  "type": "req",
  "id": "conn-1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.0.0",
      "platform": "macos",
      "mode": "cli"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "auth": {
      "token": "your-gateway-token"
    },
    "device": {
      "id": "device-fingerprint",
      "publicKey": "base64url-encoded-public-key",
      "signature": "base64url-encoded-signature",
      "signedAt": 1737264000000,
      "nonce": "server-nonce-from-challenge"
    }
  }
}
```

**Authentication methods** (in priority order):

1. Device token (returning device with issued token)
2. Shared secret (`auth.token` or `auth.password`)
3. Tailscale identity (if enabled)
4. Local client (loopback connections)

### Step 3: Server Hello

On success, the server responds with available methods and a state snapshot:

```json
{
  "type": "res",
  "id": "conn-1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": {
      "version": "2026.2.15",
      "connId": "conn-abc123"
    },
    "features": {
      "methods": ["chat.send", "sessions.list", "..."],
      "events": ["chat.delta", "presence.changed", "..."]
    },
    "auth": {
      "deviceToken": "issued-device-token",
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 10485760,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

## Roles and Scopes

### Roles

| Role       | Description                                |
| ---------- | ------------------------------------------ |
| `operator` | Control plane client (CLI, UI, automation) |
| `node`     | Capability host (camera, screen, canvas)   |

### Operator Scopes

| Scope                | Description                                    |
| -------------------- | ---------------------------------------------- |
| `operator.read`      | Read operations (status, sessions, config)     |
| `operator.write`     | Write/mutation operations (chat, send, wake)   |
| `operator.admin`     | Full admin access (config changes, agent CRUD) |
| `operator.approvals` | Approval resolution                            |
| `operator.pairing`   | Device and node pairing                        |

## Available Methods

### Chat & Messaging

| Method         | Scope | Description                        |
| -------------- | ----- | ---------------------------------- |
| `chat.send`    | write | Send a message to the agent        |
| `chat.abort`   | write | Abort current agent run            |
| `chat.history` | read  | Get conversation history           |
| `chat.inject`  | write | Inject a message into conversation |
| `send`         | write | Send message to a channel          |
| `wake`         | write | Wake the agent                     |

### Sessions

| Method             | Scope | Description              |
| ------------------ | ----- | ------------------------ |
| `sessions.list`    | read  | List all sessions        |
| `sessions.preview` | read  | Preview session contents |
| `sessions.resolve` | read  | Resolve session by key   |
| `sessions.patch`   | admin | Update session metadata  |
| `sessions.reset`   | admin | Reset session state      |
| `sessions.delete`  | admin | Delete a session         |
| `sessions.compact` | admin | Compact session history  |
| `sessions.usage`   | read  | Get session usage stats  |

### Agents

| Method               | Scope | Description            |
| -------------------- | ----- | ---------------------- |
| `agent`              | write | Run an agent task      |
| `agent.wait`         | write | Wait for agent result  |
| `agent.identity.get` | read  | Get agent identity     |
| `agents.list`        | read  | List all agents        |
| `agents.create`      | admin | Create new agent       |
| `agents.update`      | admin | Update agent config    |
| `agents.delete`      | admin | Delete an agent        |
| `agents.files.list`  | read  | List agent files       |
| `agents.files.get`   | read  | Get agent file content |
| `agents.files.set`   | admin | Set agent file content |

### Configuration

| Method          | Scope | Description               |
| --------------- | ----- | ------------------------- |
| `config.get`    | read  | Get current configuration |
| `config.set`    | admin | Replace configuration     |
| `config.patch`  | admin | Patch configuration       |
| `config.apply`  | admin | Apply config changes      |
| `config.schema` | read  | Get config JSON schema    |

### Cron Jobs

| Method        | Scope | Description             |
| ------------- | ----- | ----------------------- |
| `cron.list`   | read  | List cron jobs          |
| `cron.status` | read  | Get cron service status |
| `cron.runs`   | read  | Get cron run history    |
| `cron.add`    | admin | Add a cron job          |
| `cron.update` | admin | Update a cron job       |
| `cron.remove` | admin | Remove a cron job       |
| `cron.run`    | admin | Manually trigger a job  |

### System

| Method            | Scope | Description              |
| ----------------- | ----- | ------------------------ |
| `health`          | read  | Gateway health snapshot  |
| `status`          | read  | Gateway status summary   |
| `system-presence` | read  | Active clients/devices   |
| `last-heartbeat`  | read  | Last heartbeat timestamp |
| `models.list`     | read  | Available AI models      |
| `usage.status`    | read  | Usage statistics         |
| `usage.cost`      | read  | Cost tracking            |
| `logs.tail`       | read  | Tail gateway logs        |

### Devices & Nodes

| Method                | Scope   | Description                |
| --------------------- | ------- | -------------------------- |
| `device.pair.list`    | pairing | List device pairings       |
| `device.pair.approve` | pairing | Approve a device           |
| `device.pair.reject`  | pairing | Reject a device            |
| `device.token.rotate` | pairing | Rotate device token        |
| `device.token.revoke` | pairing | Revoke device token        |
| `node.list`           | read    | List connected nodes       |
| `node.describe`       | read    | Describe node capabilities |
| `node.invoke`         | write   | Invoke command on node     |

### Exec Approvals

| Method                       | Scope     | Description                |
| ---------------------------- | --------- | -------------------------- |
| `exec.approval.request`      | write     | Request exec approval      |
| `exec.approval.waitDecision` | write     | Wait for approval decision |
| `exec.approval.resolve`      | approvals | Resolve an approval        |
| `exec.approvals.get`         | admin     | Get approval policies      |
| `exec.approvals.set`         | admin     | Set approval policies      |

### TTS & Voice

| Method          | Scope | Description             |
| --------------- | ----- | ----------------------- |
| `tts.status`    | read  | TTS status              |
| `tts.providers` | read  | Available TTS providers |
| `tts.enable`    | write | Enable TTS              |
| `tts.disable`   | write | Disable TTS             |
| `tts.convert`   | write | Convert text to speech  |
| `talk.mode`     | write | Set talk mode           |
| `talk.config`   | read  | Get talk configuration  |

## Error Codes

| Code              | Description               |
| ----------------- | ------------------------- |
| `NOT_LINKED`      | Device pairing required   |
| `NOT_PAIRED`      | Device not yet paired     |
| `AGENT_TIMEOUT`   | Agent execution timed out |
| `INVALID_REQUEST` | Malformed request         |
| `UNAVAILABLE`     | Service unavailable       |

## Heartbeat

The server sends periodic tick events (every ~30 seconds):

```json
{
  "type": "event",
  "event": "tick",
  "payload": { "ts": 1737264030000 }
}
```

Clients should treat missed ticks as potential disconnection.
