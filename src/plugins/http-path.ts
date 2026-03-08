const RESERVED_PLUGIN_HTTP_PREFIXES = ["/tools", "/v1"] as const;

export function normalizePluginHttpPath(
  path?: string | null,
  fallback?: string | null,
): string | null {
  const trimmed = path?.trim();
  if (!trimmed) {
    const fallbackTrimmed = fallback?.trim();
    if (!fallbackTrimmed) {
      return null;
    }
    return fallbackTrimmed.startsWith("/") ? fallbackTrimmed : `/${fallbackTrimmed}`;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function isReservedPluginHttpPath(path: string): boolean {
  return RESERVED_PLUGIN_HTTP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
