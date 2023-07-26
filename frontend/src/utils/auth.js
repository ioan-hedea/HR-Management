import { readStorageValue } from "./storage";

export function validateCredentials(netId, password) {
  const normalizedNetId = netId.trim();
  if (!normalizedNetId) {
    return "NetID is required.";
  }

  if (normalizedNetId.length > 20) {
    return "NetID must be at most 20 characters.";
  }

  if (!password || password.trim().length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (password.length > 128) {
    return "Password must be at most 128 characters.";
  }

  return "";
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function decodeJwtPayload(token) {
  if (!token || typeof window === "undefined" || typeof window.atob !== "function") {
    return null;
  }

  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    return null;
  }

  try {
    let payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const missingPadding = payload.length % 4;
    if (missingPadding) {
      payload += "=".repeat(4 - missingPadding);
    }
    return JSON.parse(window.atob(payload));
  } catch (_error) {
    return null;
  }
}

export function getTokenExpirationMs(token) {
  const payload = decodeJwtPayload(token);
  const expiration = Number(payload?.exp);
  if (!Number.isFinite(expiration) || expiration <= 0) {
    return null;
  }

  return expiration * 1000;
}

export function isTokenExpired(token) {
  const expiration = getTokenExpirationMs(token);
  if (!expiration) {
    return false;
  }

  return Date.now() >= expiration;
}

export function flattenClaimValue(value) {
  if (Array.isArray(value)) {
    return value.map(flattenClaimValue).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(flattenClaimValue).join(" ");
  }

  return String(value || "");
}

export function extractRoleFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return "";
  }

  const roleText = flattenClaimValue(payload.role).toUpperCase();
  if (roleText.includes("ADMIN")) {
    return "ADMIN";
  }

  return "USER";
}

export function hasRequiredRole(activeRole, minimumRole) {
  const rank = { USER: 1, ADMIN: 2 };
  const current = rank[activeRole] || 0;
  const required = rank[minimumRole] || 0;
  return current >= required;
}

export function initialNetIdFromStorage(tokenStorageKey, netIdStorageKey) {
  const storedNetId = readStorageValue(netIdStorageKey);
  if (storedNetId) {
    return storedNetId;
  }

  const payload = decodeJwtPayload(readStorageValue(tokenStorageKey));
  return payload?.sub || "";
}
