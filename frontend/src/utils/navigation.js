export function normalizePath(path) {
  if (!path || !path.trim()) {
    return "/";
  }

  const trimmed = path.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

export function getDefaultPortalPath() {
  return "/portal/me";
}

export function findPortalRoute(path, routes) {
  return routes.find((route) => route.path === path) || null;
}
