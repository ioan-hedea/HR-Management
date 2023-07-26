import { apiRequest } from "../api";
import { isUuid } from "../utils/auth";

export async function resolveUserUuid(userRef, token) {
  const trimmedRef = userRef.trim();
  if (!trimmedRef) {
    return "";
  }

  if (isUuid(trimmedRef)) {
    return trimmedRef;
  }

  const response = await apiRequest(`/api/user/internal/user/getUserDto/${encodeURIComponent(trimmedRef)}`, {
    method: "GET",
    token
  });

  const resolvedUuid = response.data?.id;
  if (!resolvedUuid || !isUuid(resolvedUuid)) {
    throw new Error(`Could not resolve NetID '${trimmedRef}' to a valid user ID.`);
  }

  return resolvedUuid;
}
