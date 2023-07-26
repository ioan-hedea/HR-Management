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
  {
    method = "GET",
    body,
    rawBody,
    token,
    headers = {},
    responseType = "json"
  } = {}
) {
  const requestHeaders = {
    Accept: "application/json",
    ...headers
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const hasRawBody = rawBody !== undefined && rawBody !== null;
  const hasJsonBody = body !== undefined && body !== null;
  if (hasJsonBody) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: hasRawBody ? rawBody : (hasJsonBody ? JSON.stringify(body) : undefined)
  });

  if (response.ok && responseType === "blob") {
    return {
      status: response.status,
      data: await response.blob(),
      headers: response.headers
    };
  }

  const rawText = await response.text();
  let parsedPayload = null;

  if (rawText) {
    if (responseType === "text") {
      parsedPayload = rawText;
    } else {
      try {
        parsedPayload = JSON.parse(rawText);
      } catch (_error) {
        parsedPayload = rawText;
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, parsedPayload ?? response.statusText);
  }

  return {
    status: response.status,
    data: parsedPayload,
    headers: response.headers
  };
}
