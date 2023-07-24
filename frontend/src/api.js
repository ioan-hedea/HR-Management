export class ApiError extends Error {
  constructor(status, payload) {
    super(`HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest(
  url,
  { method = "GET", body, token, headers = {} } = {}
) {
  const requestHeaders = {
    Accept: "application/json",
    ...headers
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const hasBody = body !== undefined && body !== null;
  if (hasBody) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: hasBody ? JSON.stringify(body) : undefined
  });

  const rawText = await response.text();
  let parsedPayload = null;

  if (rawText) {
    try {
      parsedPayload = JSON.parse(rawText);
    } catch (_error) {
      parsedPayload = rawText;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, parsedPayload ?? response.statusText);
  }

  return {
    status: response.status,
    data: parsedPayload
  };
}
