import { ApiError } from "../api";

export function formatApiError(error) {
  if (error instanceof ApiError) {
    const payload = error.payload;
    if (payload && typeof payload === "object") {
      const description = payload.description;
      if (typeof description === "string" && description.trim()) {
        return description.trim();
      }

      const firstError = Array.isArray(payload.errors) ? payload.errors[0] : "";
      if (typeof firstError === "string" && firstError.trim()) {
        return firstError.trim();
      }
    }
    return `Request failed (HTTP ${error.status}).`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

export function formatEnumLabel(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getRequestGuidance(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPEN") {
    return "Waiting for HR review.";
  }
  if (normalized === "APPROVED") {
    return "Approved. Follow HR instructions and contract updates.";
  }
  if (normalized === "REJECTED") {
    return "Rejected. Review details and submit an updated request if needed.";
  }
  return "Track this request for further updates.";
}

export function toLocaleDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function sanitizeFileNameForDownload(value, fallback = "document.pdf") {
  const candidate = String(value || "").trim();
  if (!candidate) {
    return fallback;
  }

  const normalized = candidate.replace(/[/\\]/g, "_");
  return normalized || fallback;
}

export function buildRequestStats(requests) {
  const summary = {
    total: requests.length,
    open: 0,
    approved: 0,
    rejected: 0,
    latest: requests[0] || null
  };

  requests.forEach((requestItem) => {
    const status = String(requestItem.requestStatus || "").toUpperCase();
    if (status === "OPEN") {
      summary.open += 1;
    } else if (status === "APPROVED") {
      summary.approved += 1;
    } else if (status === "REJECTED") {
      summary.rejected += 1;
    }
  });

  return summary;
}

export function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isAllowedContractStartDate(value) {
  if (!value) {
    return false;
  }

  const day = Number(value.split("-")[2]);
  return day === 1 || day === 15;
}

export function currentApiDateTime() {
  return new Date().toISOString().slice(0, 19);
}

export function normalizeDateForInput(value) {
  if (!value) {
    return "";
  }

  const text = String(value);
  if (text.includes("T")) {
    return text.split("T")[0];
  }
  return text;
}

function truncateText(value, maxLength = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "-";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function normalizeSummaryValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return null;
  }
  return String(value).trim();
}

function humanizeKey(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function summarizeObjectPayload(payload, maxFields = 5) {
  const details = Object.entries(payload || {})
    .map(([key, value]) => {
      const normalizedValue = normalizeSummaryValue(value);
      if (!normalizedValue) {
        return null;
      }
      return `${humanizeKey(key)}: ${normalizedValue}`;
    })
    .filter(Boolean);

  if (details.length === 0) {
    return "";
  }

  return details.slice(0, maxFields).join(" | ");
}

function parseJsonSnippetFromText(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return { prefix: "", payload: null };
  }

  const parse = (candidate) => {
    try {
      return JSON.parse(candidate);
    } catch (_error) {
      return null;
    }
  };

  if (text.startsWith("{") || text.startsWith("[")) {
    return { prefix: "", payload: parse(text) };
  }

  const firstBrace = text.search(/[{\[]/);
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (firstBrace <= 0 || lastBrace <= firstBrace) {
    return { prefix: "", payload: null };
  }

  const candidate = text.slice(firstBrace, lastBrace + 1);
  const payload = parse(candidate);
  if (!payload) {
    return { prefix: "", payload: null };
  }

  const prefix = text
    .slice(0, firstBrace)
    .replace(/[,:;\s-]+$/, "")
    .trim();

  return { prefix, payload };
}

export function formatRequestBodySummary(value, { maxLength = 180 } = {}) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    const summary = summarizeObjectPayload(value);
    return truncateText(summary || JSON.stringify(value), maxLength);
  }

  const rawText = String(value).trim();
  if (!rawText) {
    return "-";
  }

  const { prefix, payload } = parseJsonSnippetFromText(rawText);
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const summary = summarizeObjectPayload(payload);
    const reference = prefix ? `Ref: ${prefix}` : "";
    const combined = [reference, summary].filter(Boolean).join(" | ");
    return truncateText(combined || rawText, maxLength);
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return "No items.";
    }
    const summarized = payload
      .slice(0, 3)
      .map((item) => truncateText(normalizeSummaryValue(item) || JSON.stringify(item), 60))
      .join(" | ");
    return truncateText(summarized, maxLength);
  }

  return truncateText(rawText, maxLength);
}

function describeOpenRequest(requestItem) {
  const requestId = String(requestItem?.id || "").trim();
  const status = formatEnumLabel(String(requestItem?.requestStatus || "OPEN"));
  const bodySummary = formatRequestBodySummary(requestItem?.requestBody, { maxLength: 90 });
  const contractId = String(requestItem?.contractId || "").trim();

  const parts = [requestId || "-", status];
  if (contractId) {
    parts.push(`Contract: ${contractId}`);
  }
  if (bodySummary && bodySummary !== "-") {
    parts.push(bodySummary);
  }
  return parts.join(" | ");
}

export function buildPortalActionFeedback(action, response) {
  const statusText = `HTTP ${response?.status ?? "?"}`;
  const payload = response?.data;
  const label = action?.label || "Action";

  if (action?.id === "list-users") {
    const users = Array.isArray(payload)
      ? payload.map((value) => String(value).trim()).filter(Boolean)
      : [];
    return {
      resultMessage: `${users.length} user${users.length === 1 ? "" : "s"}`,
      noticeMessage:
        users.length === 0
          ? "No users found."
          : `Loaded ${users.length} user NetID${users.length === 1 ? "" : "s"}.`,
      details: users.slice(0, 12),
      activityDetail: users.length === 0 ? "No users found." : `Loaded ${users.length} users.`
    };
  }

  if (action?.id === "open-requests") {
    const requests = Array.isArray(payload) ? payload : [];
    const details = requests.slice(0, 8).map(describeOpenRequest);
    if (requests.length > 8) {
      details.push(`...and ${requests.length - 8} more.`);
    }
    return {
      resultMessage: `${requests.length} open`,
      noticeMessage:
        requests.length === 0
          ? "No open requests right now."
          : `Found ${requests.length} open request${requests.length === 1 ? "" : "s"}.`,
      details,
      activityDetail:
        requests.length === 0 ? "No open requests." : `${requests.length} open request(s).`
    };
  }

  if (typeof payload === "string" && payload.trim()) {
    const summary = truncateText(payload.trim(), 180);
    return {
      resultMessage: statusText,
      noticeMessage: `${label}: ${summary}`,
      details: [],
      activityDetail: summary
    };
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const summary = truncateText(summarizeObjectPayload(payload) || JSON.stringify(payload), 180);
    return {
      resultMessage: statusText,
      noticeMessage: `${label}: ${summary}`,
      details: [],
      activityDetail: summary
    };
  }

  if (Array.isArray(payload)) {
    return {
      resultMessage: `${payload.length} item${payload.length === 1 ? "" : "s"}`,
      noticeMessage: `${label} returned ${payload.length} item${payload.length === 1 ? "" : "s"}.`,
      details: payload
        .slice(0, 8)
        .map((item) => formatRequestBodySummary(item, { maxLength: 120 })),
      activityDetail: `${payload.length} item(s) returned.`
    };
  }

  return {
    resultMessage: statusText,
    noticeMessage: `${label} completed successfully (${statusText}).`,
    details: [],
    activityDetail: `Success (${statusText}).`
  };
}
