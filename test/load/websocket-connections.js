/**
 * k6 Load Test — WebSocket Connections
 *
 * Stress-tests the gateway's WebSocket subsystem with concurrent connections,
 * auth handshakes, and message throughput.
 *
 * Run:
 *   PENGUINS_TOKEN=your-token k6 run test/load/websocket-connections.js
 */

import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";
import ws from "k6/ws";

const BASE_URL = (__ENV.PENGUINS_URL || "http://127.0.0.1:18789").replace(/^http/, "ws");
const TOKEN = __ENV.PENGUINS_TOKEN || "test-token";

const wsErrors = new Rate("ws_errors");
const wsMessages = new Counter("ws_messages_received");

export const options = {
  scenarios: {
    connection_storm: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 50 },
        { duration: "20s", target: 100 },
        { duration: "10s", target: 100 },
        { duration: "10s", target: 0 },
      ],
    },
  },
  thresholds: {
    ws_errors: ["rate<0.1"],
  },
};

export default function () {
  const url = `${BASE_URL}/`;

  const res = ws.connect(url, {}, function (socket) {
    let _authenticated = false;
    let reqId = 0;

    socket.on("open", () => {
      // Wait for the challenge frame from the server.
    });

    socket.on("message", (msg) => {
      wsMessages.add(1);
      try {
        const frame = JSON.parse(msg);

        // Server sends a challenge → we respond with connect.
        if (frame.type === "event" && frame.method === "challenge") {
          reqId++;
          socket.send(
            JSON.stringify({
              type: "req",
              id: String(reqId),
              method: "connect",
              params: {
                clientName: "k6-load-test",
                clientVersion: "1.0.0",
                token: TOKEN,
                minProtocol: 3,
                maxProtocol: 3,
              },
            }),
          );
        }

        // Server confirms auth.
        if (frame.type === "res" && frame.id === String(reqId)) {
          if (frame.result && !frame.error) {
            _authenticated = true;
          }
        }

        // Server sends hello-ok → we're fully connected.
        if (frame.type === "event" && frame.method === "hello-ok") {
          _authenticated = true;
          // Send a lightweight status request.
          reqId++;
          socket.send(
            JSON.stringify({
              type: "req",
              id: String(reqId),
              method: "status",
              params: {},
            }),
          );
        }

        // Handle tick (heartbeat).
        if (frame.type === "event" && frame.method === "tick") {
          // Still alive — good.
        }
      } catch {
        // Ignore parse errors.
      }
    });

    socket.on("error", (_e) => {
      wsErrors.add(true);
    });

    // Keep the connection open for a while to simulate real usage.
    socket.setTimeout(function () {
      socket.close();
    }, 15000);
  });

  const ok = check(res, {
    "ws connected": (r) => r && r.status === 101,
  });
  wsErrors.add(!ok);
  sleep(1);
}
