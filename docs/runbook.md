# Operations Runbook

Incident response and operational procedures for Penguins gateway.

## Graceful Restart

### Systemd

```bash
sudo systemctl restart penguins-gateway
```

### Docker

```bash
docker restart penguins
```

### Manual

```bash
# Send SIGTERM (graceful shutdown)
kill -TERM $(pgrep -f "penguins gateway")

# Then restart
penguins gateway
```

The gateway handles SIGTERM gracefully:

1. Stops accepting new connections
2. Completes in-flight requests
3. Closes WebSocket connections with close frame
4. Releases all session write locks
5. Stops cron service
6. Exits cleanly

## Recover Corrupted State

### Symptoms

- Gateway won't start with parse errors
- Sessions show garbled data
- Config file is invalid JSON

### Procedure

1. **Stop the gateway**

2. **Backup current state**

   ```bash
   cp -r ~/.penguins ~/.penguins.corrupted.$(date +%s)
   ```

3. **Validate config**

   ```bash
   cat ~/.penguins/penguins.json | python3 -m json.tool
   ```

   If invalid, restore from backup or reset:

   ```bash
   penguins doctor  # Auto-repairs common issues
   ```

4. **Check session files**

   ```bash
   ls -la ~/.penguins/sessions/
   ```

   Remove corrupted session files (they'll be recreated):

   ```bash
   rm ~/.penguins/sessions/<corrupted-file>
   ```

5. **Check lock files**

   ```bash
   find ~/.penguins -name "*.lock" -type f
   ```

   Remove stale locks (check PID first):

   ```bash
   cat ~/.penguins/sessions/some-session.json.lock
   # If PID is dead:
   rm ~/.penguins/sessions/some-session.json.lock
   ```

6. **Restart gateway**

## Rotate Secrets

### Gateway Token

1. Generate new token:

   ```bash
   openssl rand -hex 32
   ```

2. Update config:

   ```bash
   penguins configure
   # Or edit ~/.penguins/penguins.json directly
   ```

3. Restart gateway

4. Update all clients with new token

### Provider API Keys

1. Rotate key at provider (OpenAI, Anthropic, etc.)
2. Update in Penguins config:
   ```bash
   penguins configure
   ```
3. Restart gateway
4. Verify: `penguins doctor`

### Device Tokens

Revoke and re-pair devices:

```bash
# Via Control UI: Devices → Revoke
# Or via WebSocket: device.token.revoke method
```

## Debug Failed Channels

### General Approach

1. **Check channel status**

   ```bash
   penguins status
   ```

2. **Check logs for the channel**

   ```bash
   penguins logs --follow
   # Look for channel-specific errors
   ```

3. **Run diagnostics**

   ```bash
   penguins doctor
   ```

4. **Verify credentials**
   - Check API tokens/keys are valid
   - Check webhook URLs are accessible
   - Check bot permissions

### Telegram

```bash
# Test bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### Discord

- Check bot is online in server member list
- Verify Gateway Intents are enabled in Developer Portal
- Check bot has MESSAGE_CONTENT intent if reading messages

### Signal

- Signal linking expires — re-link if disconnected
- Check `~/.penguins/signal/` for state files
- Delete and re-link if corrupted

## Monitor Cron Jobs

### Check Status

```bash
# Via CLI (connects to gateway)
penguins cron status
```

Or via Control UI → Cron tab.

### Failed Job Investigation

1. Check cron run history (via Control UI or `cron.runs` method)
2. Look at `lastError` and `consecutiveErrors` in job state
3. Check logs around the failure timestamp
4. Note: Jobs auto-backoff on failure (30s → 1m → 5m → 15m → 60m cap)

### Stuck Job

If a job appears stuck (`runningAtMs` is set but never clears):

1. Check if the agent process is still running
2. Default job timeout is 10 minutes
3. Restart gateway to clear stuck state

## Disk Usage

### Check State Directory Size

```bash
du -sh ~/.penguins/
du -sh ~/.penguins/sessions/
du -sh ~/.penguins/workspace/memory/
```

### Cleanup

```bash
# Compact old sessions (via Control UI or API)
# Delete unused session files
ls -lt ~/.penguins/sessions/ | tail -20

# Clean embedding cache
rm -rf ~/.penguins/workspace/memory/.cache/
```

## Emergency Procedures

### Gateway Unresponsive

```bash
# Force kill
kill -9 $(pgrep -f "penguins gateway")

# Clean up stale locks
find ~/.penguins -name "*.lock" -delete

# Restart
penguins gateway
```

### High CPU / Memory

```bash
# Check what's running
penguins status

# Kill runaway agent
# Via Control UI: Sessions → Abort
# Or restart gateway

# Check for cron job loops
penguins cron status
```

### Data Loss Prevention

Regular backups:

```bash
# Cron job for daily backup
0 3 * * * tar czf ~/penguins-backup-$(date +\%F).tar.gz ~/.penguins/
```

Critical files to back up:

- `~/.penguins/penguins.json` — configuration
- `~/.penguins/sessions/` — conversation history
- `~/.penguins/workspace/memory/` — memory files
- `~/.penguins/devices.json` — device pairings
