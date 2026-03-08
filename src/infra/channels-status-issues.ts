import type { ChannelAccountSnapshot, ChannelStatusIssue } from "../channels/plugins/types.js";
import { listChannelPlugins } from "../channels/plugins/index.js";

function collectIssuesByChannel(
  accountsByChannel: Partial<Record<string, ChannelAccountSnapshot[]>>,
): ChannelStatusIssue[] {
  const issues: ChannelStatusIssue[] = [];
  for (const plugin of listChannelPlugins()) {
    const collect = plugin.status?.collectStatusIssues;
    if (!collect) {
      continue;
    }
    const accounts = accountsByChannel[plugin.id];
    if (!Array.isArray(accounts) || accounts.length === 0) {
      continue;
    }
    issues.push(...collect(accounts));
  }
  return issues;
}

export function collectChannelStatusIssues(payload: Record<string, unknown>): ChannelStatusIssue[] {
  const accountsByChannel = payload.channelAccounts as Record<string, unknown> | undefined;
  const normalized: Partial<Record<string, ChannelAccountSnapshot[]>> = {};
  for (const plugin of listChannelPlugins()) {
    const raw = accountsByChannel?.[plugin.id];
    if (Array.isArray(raw)) {
      normalized[plugin.id] = raw as ChannelAccountSnapshot[];
    }
  }
  return collectIssuesByChannel(normalized);
}

export function collectHealthChannelIssues(payload: {
  channels?: Record<string, unknown>;
  channelAccounts?: Record<string, unknown>;
}): ChannelStatusIssue[] {
  if (payload.channelAccounts) {
    return collectChannelStatusIssues({ channelAccounts: payload.channelAccounts });
  }
  const channels = payload.channels;
  const normalized: Partial<Record<string, ChannelAccountSnapshot[]>> = {};
  for (const plugin of listChannelPlugins()) {
    const channel = channels?.[plugin.id];
    if (!channel || typeof channel !== "object") {
      continue;
    }
    const accounts = (channel as { accounts?: unknown }).accounts;
    if (!accounts || typeof accounts !== "object") {
      continue;
    }
    normalized[plugin.id] = Object.values(accounts as Record<string, ChannelAccountSnapshot>);
  }
  return collectIssuesByChannel(normalized);
}
