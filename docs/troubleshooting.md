# Troubleshooting

Common issues and solutions for Penguins.

## Gateway Won't Start

### Port already in use

```
Error: listen EADDRINUSE: address already in use :::18789
```

Another process is using port 18789. Find and stop it:

```bash
lsof -i :18789
kill <PID>
```

Or use a different port:

```bash
PENGUINS_PORT=18790 penguins gateway
```

### Permission denied on state directory

```bash
chmod 700 ~/.penguins
```

### Node version too old

Penguins requires Node.js 22.12.0 or later:

```bash
node --version
# If < 22.12.0, upgrade:
nvm install 22
```

## Authentication Issues

### "Unauthorized" on HTTP endpoints

Ensure you're sending the token correctly:

```bash
# Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:18789/v1/chat/completions

# Or X-Penguins-Token header
curl -H "X-Penguins-Token: YOUR_TOKEN" http://127.0.0.1:18789/v1/chat/completions
```

**Do not** pass tokens in query parameters — this is rejected for security.

### Device pairing stuck

If a device shows as "pending" in the Control UI:

1. Open the Control UI (`penguins dashboard`)
2. Navigate to Devices
3. Approve or reject the pending device

For local connections, devices are auto-approved by default.

### Rate limited

After too many failed auth attempts (20 per 60 seconds per IP), you'll get 429 responses. Wait 60 seconds or restart the gateway.

## Connection Issues

### WebSocket disconnects frequently

Check the heartbeat interval. The gateway sends ticks every ~30 seconds. If your client doesn't receive ticks, the connection may be dropping.

Common causes:

- Reverse proxy timeout too short (set `proxy_read_timeout 86400` in nginx)
- Firewall closing idle connections
- NAT timeout

### Can't connect from another machine

By default, Penguins binds to `127.0.0.1` (loopback only). To accept remote connections:

```bash
PENGUINS_BIND=lan penguins gateway
```

**Important:** Always use authentication when binding to LAN.

### Tailscale auth not working

1. Verify Tailscale is running: `tailscale status`
2. Check allowed users in config: `penguins configure`
3. Ensure the gateway is bound to tailnet: `PENGUINS_BIND=tailnet`

## AI Provider Issues

### "upstream provider timed out" (504)

The AI provider took too long to respond. Common causes:

- Provider API is overloaded
- Model is too large for the request
- Network issues between gateway and provider

Try:

- Use a different/smaller model
- Check provider status page
- Increase timeout in config

### "context length exceeded"

The conversation history is too long for the model. Solutions:

- Start a new session: `/new`
- Use session compaction (automatic or manual via Control UI)
- Choose a model with larger context window

### Model not found

```bash
# List available models
penguins models
```

Ensure the provider API key is set and the model ID is correct.

## Channel Issues

### Telegram bot not responding

1. Check bot token: `penguins doctor`
2. Verify webhook is set (if using webhook mode)
3. Check logs: `penguins logs --follow`
4. Ensure the bot is added to the group/chat

### Discord bot offline

1. Verify bot token in config
2. Check required intents are enabled in Discord Developer Portal
3. Ensure the bot has proper permissions in the server
4. Check logs for connection errors

### Signal not linking

Signal requires linking via QR code:

1. Run `penguins configure` and follow Signal setup
2. Scan the QR code with Signal on your phone
3. If it fails, delete `~/.penguins/signal/` and retry

## Memory / Embeddings

### "Embedding backend not available"

Penguins tries to auto-detect an embedding backend:

1. **Local** — requires `node-llama-cpp` (install with `pnpm add node-llama-cpp`)
2. **OpenAI** — requires `OPENAI_API_KEY` env var

Force a specific backend:

```bash
PENGUINS_EMBEDDING_BACKEND=openai penguins gateway
```

### Memory search returns nothing

1. Verify memory files exist: `ls ~/.penguins/workspace/memory/`
2. Check embedding index: `penguins memory status`
3. Rebuild index: `penguins memory reindex`

## Performance

### High memory usage

- Compact old sessions: large session files consume memory
- Reduce concurrent connections
- Check for runaway cron jobs: `penguins cron status`

### Slow responses

1. Check provider latency (try a different model/provider)
2. Review agent configuration — too many tools slow down inference
3. Check system resources: `penguins doctor`

## Doctor Command

Run diagnostics:

```bash
penguins doctor
```

This checks:

- Config validity
- State directory permissions
- Provider connectivity
- Channel status
- Environment variable conflicts
- Legacy config migrations needed

## Logs

```bash
# Tail all logs
penguins logs --follow

# Filter by level
penguins logs --level error

# Via systemd
journalctl -u penguins-gateway -f
```

## Reset

### Reset all state (nuclear option)

```bash
# Backup first!
cp -r ~/.penguins ~/.penguins.backup

# Reset
rm -rf ~/.penguins
penguins onboard
```

### Reset single session

Use the Control UI or:

```bash
# Via WebSocket method
penguins sessions reset --key <session-key>
```
