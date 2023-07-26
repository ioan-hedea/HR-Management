import { decodeJwtPayload, extractRoleFromToken } from "../utils/auth";

export function resolveSessionIdentity(nextToken, suggestedNetId = "") {
  const payload = decodeJwtPayload(nextToken);
  const resolvedNetId = suggestedNetId || payload?.sub || "";
  const resolvedRole = extractRoleFromToken(nextToken);
  return { resolvedNetId, resolvedRole };
}

export function persistSessionState({
  nextToken,
  resolvedNetId,
  persistSession,
  tokenStorageKey,
  netIdStorageKey,
  rememberSessionKey
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(rememberSessionKey, String(Boolean(persistSession)));

  if (nextToken) {
    const persistentStorage = persistSession ? window.localStorage : window.sessionStorage;
    const volatileStorage = persistSession ? window.sessionStorage : window.localStorage;
    persistentStorage.setItem(tokenStorageKey, nextToken);
    volatileStorage.removeItem(tokenStorageKey);
  } else {
    window.localStorage.removeItem(tokenStorageKey);
    window.sessionStorage.removeItem(tokenStorageKey);
  }

  if (resolvedNetId) {
    const persistentStorage = persistSession ? window.localStorage : window.sessionStorage;
    const volatileStorage = persistSession ? window.sessionStorage : window.localStorage;
    persistentStorage.setItem(netIdStorageKey, resolvedNetId);
    volatileStorage.removeItem(netIdStorageKey);
  } else {
    window.localStorage.removeItem(netIdStorageKey);
    window.sessionStorage.removeItem(netIdStorageKey);
  }
}
