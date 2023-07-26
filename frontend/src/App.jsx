import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "./api";

const TOKEN_STORAGE_KEY = "hr_frontend_token";
const NETID_STORAGE_KEY = "hr_frontend_netid";
const REMEMBER_SESSION_KEY = "hr_frontend_remember";

const PORTAL_ACTIONS = [
  {
    id: "contract-hello",
    label: "Contract hello",
    service: "contract",
    path: "/hello",
    method: "GET",
    requiresToken: true,
    minRole: "USER"
  },
  {
    id: "request-hello",
    label: "Request hello",
    service: "request",
    path: "/hello",
    method: "GET",
    requiresToken: true,
    minRole: "USER"
  },
  {
    id: "list-users",
    label: "List all users",
    service: "user",
    path: "/internal/user/getAllNetIds",
    method: "GET",
    requiresToken: true,
    minRole: "ADMIN"
  },
  {
    id: "open-requests",
    label: "Open requests",
    service: "request",
    path: "/internal/request/open",
    method: "GET",
    requiresToken: true,
    minRole: "ADMIN"
  }
];

const PORTAL_ROUTES = [
  {
    id: "me",
    path: "/portal/me",
    label: "My Portal",
    group: "workspace",
    minRole: "USER",
    title: "Personal Dashboard",
    description: "See your session details and run user-safe quick actions."
  },
  {
    id: "requests",
    path: "/portal/requests",
    label: "Requests",
    group: "workspace",
    minRole: "USER",
    title: "Requests Workspace",
    description: "Use guided HR actions and forms from one workspace."
  },
  {
    id: "admin",
    path: "/portal/admin",
    label: "Admin Center",
    group: "administration",
    minRole: "ADMIN",
    title: "Administration",
    description: "Manage users and run internal admin operations."
  }
];

const SIDEBAR_GROUPS = [
  { id: "workspace", label: "Workspace" },
  { id: "administration", label: "Administration" }
];

const USER_ROLES = ["CANDIDATE", "EMPLOYEE", "HR", "ADMIN", "FIRED"];
const CONTRACT_TYPES = ["TEMPORARY", "PART_TIME", "FULL_TIME"];

function readStorageValue(key) {
  if (typeof window === "undefined") {
    return "";
  }

  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) {
    return sessionValue;
  }

  return window.localStorage.getItem(key) || "";
}

function readRememberSessionPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(REMEMBER_SESSION_KEY) === "true";
}

function normalizePath(path) {
  if (!path || !path.trim()) {
    return "/";
  }

  const trimmed = path.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

function formatApiError(error) {
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

function formatEnumLabel(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isAllowedContractStartDate(value) {
  if (!value) {
    return false;
  }

  const day = Number(value.split("-")[2]);
  return day === 1 || day === 15;
}

function currentApiDateTime() {
  return new Date().toISOString().slice(0, 19);
}

function validateCredentials(netId, password) {
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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function resolveUserUuid(userRef, token) {
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

function decodeJwtPayload(token) {
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

function getTokenExpirationMs(token) {
  const payload = decodeJwtPayload(token);
  const expiration = Number(payload?.exp);
  if (!Number.isFinite(expiration) || expiration <= 0) {
    return null;
  }

  return expiration * 1000;
}

function isTokenExpired(token) {
  const expiration = getTokenExpirationMs(token);
  if (!expiration) {
    return false;
  }

  return Date.now() >= expiration;
}

function flattenClaimValue(value) {
  if (Array.isArray(value)) {
    return value.map(flattenClaimValue).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(flattenClaimValue).join(" ");
  }

  return String(value || "");
}

function extractRoleFromToken(token) {
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

function hasRequiredRole(activeRole, minimumRole) {
  const rank = { USER: 1, ADMIN: 2 };
  const current = rank[activeRole] || 0;
  const required = rank[minimumRole] || 0;
  return current >= required;
}

function getDefaultPortalPath() {
  return "/portal/me";
}

function findPortalRoute(path) {
  return PORTAL_ROUTES.find((route) => route.path === path) || null;
}

function initialNetIdFromStorage() {
  const storedNetId = readStorageValue(NETID_STORAGE_KEY);
  if (storedNetId) {
    return storedNetId;
  }

  const payload = decodeJwtPayload(readStorageValue(TOKEN_STORAGE_KEY));
  return payload?.sub || "";
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [registerForm, setRegisterForm] = useState({ netId: "", password: "" });
  const [loginForm, setLoginForm] = useState({ netId: "", password: "" });
  const [rememberSession, setRememberSession] = useState(readRememberSessionPreference);
  const [token, setToken] = useState(() => readStorageValue(TOKEN_STORAGE_KEY));
  const [activeNetId, setActiveNetId] = useState(initialNetIdFromStorage);
  const [activeRole, setActiveRole] = useState(() =>
    extractRoleFromToken(readStorageValue(TOKEN_STORAGE_KEY))
  );
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === "undefined") {
      return "/login";
    }
    return normalizePath(window.location.pathname || "/login");
  });
  const [authNotice, setAuthNotice] = useState(null);
  const [adminNotice, setAdminNotice] = useState(null);
  const [requestsNotice, setRequestsNotice] = useState(null);
  const [createUserRequestForm, setCreateUserRequestForm] = useState({
    contractId: "",
    requestBody: "",
    startDate: "",
    numberOfDays: ""
  });
  const [contractUpdateRequestForm, setContractUpdateRequestForm] = useState({
    contractId: "",
    hoursPerWeek: "",
    vacationDays: "",
    salaryScalePoint: "",
    jobPosition: "",
    benefits: "",
    startDate: "",
    endDate: ""
  });
  const [documentResponseForm, setDocumentResponseForm] = useState({
    requestId: "",
    responseBody: ""
  });
  const [requestLookupForm, setRequestLookupForm] = useState({ requestId: "" });
  const [approveRequestForm, setApproveRequestForm] = useState({ requestId: "" });
  const [rejectRequestForm, setRejectRequestForm] = useState({
    requestId: "",
    reason: ""
  });
  const [documentRequestForm, setDocumentRequestForm] = useState({
    employeeRef: "",
    requestBody: ""
  });
  const [terminateContractForm, setTerminateContractForm] = useState({
    contractId: ""
  });
  const [contractLookupForm, setContractLookupForm] = useState({
    contractId: ""
  });
  const [deleteContractForm, setDeleteContractForm] = useState({
    contractId: ""
  });
  const [salaryScaleForm, setSalaryScaleForm] = useState({
    minimumPay: "2500",
    maximumPay: "4500",
    step: "0.1"
  });
  const [salaryScaleUpdateForm, setSalaryScaleUpdateForm] = useState({
    salaryScaleId: "",
    minimumPay: "",
    maximumPay: ""
  });
  const [jobPositionCatalogForm, setJobPositionCatalogForm] = useState({
    name: "Software Engineer",
    minimumPay: "2500",
    maximumPay: "4500",
    step: "0.1"
  });
  const [renameJobPositionForm, setRenameJobPositionForm] = useState({
    jobPositionId: "",
    name: ""
  });
  const [pensionSchemeForm, setPensionSchemeForm] = useState({
    name: "Default Pension"
  });
  const [renamePensionSchemeForm, setRenamePensionSchemeForm] = useState({
    pensionSchemeId: "",
    name: ""
  });
  const [deleteCatalogForm, setDeleteCatalogForm] = useState({
    entityType: "salary-scale",
    entityId: ""
  });
  const [createContractForm, setCreateContractForm] = useState({
    employeeId: "",
    employerId: "",
    contractType: "FULL_TIME",
    hoursPerWeek: "40",
    vacationDays: "25",
    startDate: "",
    endDate: "",
    salaryScalePoint: "0.2",
    jobPosition: "Software Engineer",
    minimumPay: "2500",
    maximumPay: "4500",
    salaryStep: "0.1",
    pensionScheme: "Default Pension",
    benefits: "Health insurance, Meal vouchers"
  });
  const [updateProfileForm, setUpdateProfileForm] = useState({
    netId: "",
    role: "EMPLOYEE",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    description: ""
  });
  const [actionResults, setActionResults] = useState({});
  const [activity, setActivity] = useState([]);
  const [activeActionId, setActiveActionId] = useState("");
  const [activeTaskId, setActiveTaskId] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const isAdmin = activeRole === "ADMIN";

  const visibleActions = useMemo(
    () =>
      PORTAL_ACTIONS.filter((action) => hasRequiredRole(activeRole || "USER", action.minRole)),
    [activeRole]
  );

  const userActions = useMemo(
    () => visibleActions.filter((action) => action.minRole === "USER"),
    [visibleActions]
  );

  const adminActions = useMemo(
    () => PORTAL_ACTIONS.filter((action) => action.minRole === "ADMIN"),
    []
  );

  const visibleRoutes = useMemo(
    () =>
      PORTAL_ROUTES.filter((route) =>
        hasRequiredRole(activeRole || "USER", route.minRole)
      ),
    [activeRole]
  );

  const sidebarGroups = useMemo(
    () =>
      SIDEBAR_GROUPS.map((group) => ({
        ...group,
        items: visibleRoutes.filter((route) => route.group === group.id)
      })).filter((group) => group.items.length > 0),
    [visibleRoutes]
  );

  const activeRoute = useMemo(() => findPortalRoute(currentPath), [currentPath]);
  const isMeRoute = activeRoute?.id === "me";
  const isRequestsRoute = activeRoute?.id === "requests";
  const isAdminRoute = activeRoute?.id === "admin";

  const navigate = (nextPath, replace = false) => {
    const normalizedPath = normalizePath(nextPath);
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname !== normalizedPath) {
      if (replace) {
        window.history.replaceState({}, "", normalizedPath);
      } else {
        window.history.pushState({}, "", normalizedPath);
      }
    }

    setCurrentPath(normalizedPath);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname || "/login"));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!isAdmin || !activeNetId) {
      return;
    }

    setCreateContractForm((previous) =>
      previous.employerId ? previous : { ...previous, employerId: activeNetId }
    );
  }, [activeNetId, isAdmin]);

  useEffect(() => {
    const normalizedPath = normalizePath(currentPath);
    if (normalizedPath !== currentPath) {
      setCurrentPath(normalizedPath);
      return;
    }

    if (!token) {
      if (normalizedPath !== "/login") {
        navigate("/login", true);
      }
      return;
    }

    const defaultPortalPath = getDefaultPortalPath();
    if (normalizedPath === "/login" || normalizedPath === "/portal") {
      navigate(defaultPortalPath, true);
      return;
    }

    const route = findPortalRoute(normalizedPath);
    if (!route) {
      navigate(defaultPortalPath, true);
      return;
    }

    if (!hasRequiredRole(activeRole || "USER", route.minRole)) {
      navigate(defaultPortalPath, true);
    }
  }, [activeRole, currentPath, token]);

  const pushActivity = (title, detail, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivity((previous) =>
      [
        { id: `${Date.now()}-${Math.random()}`, title, detail, timestamp, type },
        ...previous
      ].slice(0, 12)
    );
  };

  const saveSession = (nextToken, suggestedNetId = "", persistSession = rememberSession) => {
    const payload = decodeJwtPayload(nextToken);
    const resolvedNetId = suggestedNetId || payload?.sub || "";
    const resolvedRole = extractRoleFromToken(nextToken);

    setToken(nextToken);
    setActiveNetId(resolvedNetId);
    setActiveRole(resolvedRole);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMEMBER_SESSION_KEY, String(Boolean(persistSession)));
      if (nextToken) {
        const persistentStorage = persistSession ? window.localStorage : window.sessionStorage;
        const volatileStorage = persistSession ? window.sessionStorage : window.localStorage;
        persistentStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
        volatileStorage.removeItem(TOKEN_STORAGE_KEY);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }

      if (resolvedNetId) {
        const persistentStorage = persistSession ? window.localStorage : window.sessionStorage;
        const volatileStorage = persistSession ? window.sessionStorage : window.localStorage;
        persistentStorage.setItem(NETID_STORAGE_KEY, resolvedNetId);
        volatileStorage.removeItem(NETID_STORAGE_KEY);
      } else {
        window.localStorage.removeItem(NETID_STORAGE_KEY);
        window.sessionStorage.removeItem(NETID_STORAGE_KEY);
      }
    }

    return { netId: resolvedNetId, role: resolvedRole };
  };

  const clearSession = () => {
    saveSession("", "", rememberSession);
    setActionResults({});
    setRequestsNotice(null);
    setAuthNotice({
      type: "info",
      text: "You have been signed out."
    });
    pushActivity("Session closed", "User signed out.");
    navigate("/login");
  };

  useEffect(() => {
    if (!token || typeof window === "undefined") {
      return undefined;
    }

    const maybeExpireSession = () => {
      if (!isTokenExpired(token)) {
        return;
      }

      saveSession("", "", rememberSession);
      setActionResults({});
      setRequestsNotice(null);
      setAuthNotice({
        type: "info",
        text: "Session expired. Please sign in again."
      });
      pushActivity("Session expired", "JWT expiration reached. Sign in again.");
      navigate("/login", true);
    };

    maybeExpireSession();
    const intervalId = window.setInterval(maybeExpireSession, 30_000);
    return () => window.clearInterval(intervalId);
  }, [token, rememberSession]);

  const runTask = async (taskId, taskName, callback, options = {}) => {
    setActiveTaskId(taskId);
    setRequestsNotice(null);
    try {
      const response = await callback();
      const successMessage =
        typeof options.successMessage === "function"
          ? options.successMessage(response)
          : `${taskName} completed successfully (HTTP ${response.status}).`;
      const successActivity =
        typeof options.successActivity === "function"
          ? options.successActivity(response)
          : `Success (${response.status}).`;

      setRequestsNotice({
        type: "success",
        message: successMessage
      });
      pushActivity(taskName, successActivity, "success");
      if (typeof options.onSuccess === "function") {
        options.onSuccess(response);
      }
      return response;
    } catch (error) {
      const message = formatApiError(error);
      setRequestsNotice({
        type: "error",
        message: `${taskName} failed. ${message}`
      });
      pushActivity(taskName, message, "error");
      return null;
    } finally {
      setActiveTaskId("");
    }
  };

  const performRegister = async (switchToLogin) => {
    const registerPayload = {
      netId: registerForm.netId.trim(),
      password: registerForm.password
    };
    const credentialError = validateCredentials(registerPayload.netId, registerPayload.password);
    if (credentialError) {
      if (switchToLogin) {
        setAuthNotice({ type: "error", text: credentialError });
      } else {
        setAdminNotice({ type: "error", text: credentialError });
      }
      return;
    }

    setIsRegisterLoading(true);
    setAdminNotice(null);
    setAuthNotice(null);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: registerPayload
      });

      const message = `Account for ${registerPayload.netId} was created successfully.`;
      if (switchToLogin) {
        setAuthNotice({ type: "success", text: message });
        setLoginForm((previous) => ({ ...previous, netId: registerPayload.netId }));
        setAuthMode("login");
      } else {
        setAdminNotice({ type: "success", text: message });
      }

      pushActivity("Registration success", message, "success");
    } catch (error) {
      const message = formatApiError(error);
      if (switchToLogin) {
        setAuthNotice({ type: "error", text: message });
      } else {
        setAdminNotice({ type: "error", text: message });
      }
      pushActivity("Registration failed", message, "error");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const registerFromAuth = async (event) => {
    event.preventDefault();
    await performRegister(true);
  };

  const registerFromAdmin = async (event) => {
    event.preventDefault();
    await performRegister(false);
  };

  const login = async (event) => {
    event.preventDefault();
    setIsLoginLoading(true);
    setAuthNotice(null);

    try {
      const response = await apiRequest("/api/auth/authenticate", {
        method: "POST",
        body: loginForm
      });

      const nextToken = response.data?.token;
      if (!nextToken) {
        throw new Error("Authentication response did not include a token.");
      }

      const session = saveSession(nextToken, loginForm.netId, rememberSession);
      setAuthNotice({
        type: "success",
        text: `Authenticated as ${session.netId || loginForm.netId}.`
      });
      pushActivity("Login success", `Token stored for ${session.netId || loginForm.netId}.`, "success");
      navigate(getDefaultPortalPath());
    } catch (error) {
      const message = formatApiError(error);
      setAuthNotice({ type: "error", text: message });
      pushActivity("Login failed", message, "error");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const runPortalAction = async (action) => {
    if (!hasRequiredRole(activeRole || "USER", action.minRole)) {
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "error",
          message: "You do not have permission for this action."
        }
      }));
      setRequestsNotice({
        type: "error",
        message: "You do not have permission for this action."
      });
      return;
    }

    if (action.requiresToken && !token) {
      setActionResults((previous) => ({
        ...previous,
        [action.id]: { status: "error", message: "Login first to attach a Bearer token." }
      }));
      setRequestsNotice({
        type: "error",
        message: "Login first to attach a Bearer token."
      });
      return;
    }

    setActiveActionId(action.id);
    setActionResults((previous) => ({
      ...previous,
      [action.id]: { status: "loading", message: "Running..." }
    }));

    try {
      const response = await apiRequest(`/api/${action.service}${action.path}`, {
        method: action.method,
        token: action.requiresToken ? token : undefined
      });

      const statusMessage = `HTTP ${response.status}`;
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "success",
          message: statusMessage
        }
      }));
      setRequestsNotice({
        type: "success",
        message: `${action.label} completed successfully (${statusMessage}).`
      });
      pushActivity(action.label, `Success (${response.status}).`, "success");
    } catch (error) {
      const message = formatApiError(error);
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "error",
          message
        }
      }));
      setRequestsNotice({
        type: "error",
        message: `${action.label} failed. ${message}`
      });
      pushActivity(action.label, message, "error");
    } finally {
      setActiveActionId("");
    }
  };

  const approveRequest = async (event) => {
    event.preventDefault();
    const requestId = approveRequestForm.requestId.trim();
    if (!requestId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a request number."
      });
      return;
    }
    if (!isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Request number must be a valid UUID."
      });
      return;
    }

    await runTask("approve-request", "Approve employee request", () =>
      apiRequest(`/api/request/internal/request/approve/${requestId}`, {
        method: "PUT",
        token
      })
    );
  };

  const rejectRequest = async (event) => {
    event.preventDefault();
    const requestId = rejectRequestForm.requestId.trim();
    if (!requestId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a request number."
      });
      return;
    }
    if (!isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Request number must be a valid UUID."
      });
      return;
    }

    const reason = rejectRequestForm.reason.trim() || "Request rejected by HR.";
    await runTask("reject-request", "Reject employee request", () =>
      apiRequest(`/api/request/internal/request/reject/${requestId}`, {
        method: "PUT",
        body: reason,
        token
      })
    );
  };

  const requestEmployeeDocument = async (event) => {
    event.preventDefault();
    const employeeRef = documentRequestForm.employeeRef.trim();
    const requestBody = documentRequestForm.requestBody.trim();
    if (!employeeRef || !requestBody) {
      setRequestsNotice({
        type: "error",
        message: "Please provide employee reference and document details."
      });
      return;
    }

    let employeeId = "";
    try {
      employeeId = await resolveUserUuid(employeeRef, token);
    } catch (error) {
      setRequestsNotice({
        type: "error",
        message: formatApiError(error)
      });
      return;
    }

    await runTask(
      "request-document",
      "Request employee document",
      () =>
        apiRequest(`/api/request/internal/request/document/${employeeId}`, {
          method: "POST",
          body: requestBody,
          token
        }),
      {
        successMessage: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Document request sent. Tracking number: ${requestId}.`;
          }
          return `Document request sent successfully (HTTP ${response.status}).`;
        },
        onSuccess: () => {
          setDocumentRequestForm({ employeeRef: "", requestBody: "" });
        }
      }
    );
  };

  const terminateContract = async (event) => {
    event.preventDefault();
    const contractId = terminateContractForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a contract ID."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    await runTask("terminate-contract", "Terminate contract", () =>
      apiRequest(`/api/contract/internal/contract/terminate/${contractId}`, {
        method: "DELETE",
        token
      })
    );
  };

  const createSalaryScale = async (event) => {
    event.preventDefault();

    const minimumPay = toFiniteNumber(salaryScaleForm.minimumPay, 0);
    const maximumPay = toFiniteNumber(salaryScaleForm.maximumPay, 0);
    const step = toFiniteNumber(salaryScaleForm.step, 0);

    if (maximumPay < minimumPay) {
      setRequestsNotice({
        type: "error",
        message: "Maximum pay must be greater than or equal to minimum pay."
      });
      return;
    }

    await runTask(
      "create-salary-scale",
      "Create salary scale",
      () =>
        apiRequest("/api/contract/internal/salary-scale", {
          method: "POST",
          body: {
            minimumPay,
            maximumPay,
            step
          },
          token
        }),
      {
        successMessage: (response) => {
          const scaleId = response.data?.id;
          if (scaleId) {
            return `Salary scale created successfully. ID: ${scaleId}.`;
          }
          return `Salary scale created successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const createJobPositionCatalog = async (event) => {
    event.preventDefault();
    const name = jobPositionCatalogForm.name.trim();
    if (!name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a job position name."
      });
      return;
    }

    const minimumPay = toFiniteNumber(jobPositionCatalogForm.minimumPay, 0);
    const maximumPay = toFiniteNumber(jobPositionCatalogForm.maximumPay, 0);
    const step = toFiniteNumber(jobPositionCatalogForm.step, 0);
    if (maximumPay < minimumPay) {
      setRequestsNotice({
        type: "error",
        message: "Maximum pay must be greater than or equal to minimum pay."
      });
      return;
    }

    await runTask(
      "create-job-position",
      "Create job position",
      () =>
        apiRequest("/api/contract/internal/job-position", {
          method: "POST",
          body: {
            name,
            salaryScale: {
              minimumPay,
              maximumPay,
              step
            }
          },
          token
        }),
      {
        successMessage: (response) => {
          const positionId = response.data?.id;
          if (positionId) {
            return `Job position created successfully. ID: ${positionId}.`;
          }
          return `Job position created successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const createPensionScheme = async (event) => {
    event.preventDefault();
    const name = pensionSchemeForm.name.trim();
    if (!name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a pension scheme name."
      });
      return;
    }

    await runTask(
      "create-pension-scheme",
      "Create pension scheme",
      () =>
        apiRequest("/api/contract/internal/pension-scheme", {
          method: "POST",
          body: { name },
          token
        }),
      {
        successMessage: (response) => {
          const schemeId = response.data?.id;
          if (schemeId) {
            return `Pension scheme created successfully. ID: ${schemeId}.`;
          }
          return `Pension scheme created successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const lookupContract = async (event) => {
    event.preventDefault();
    const contractId = contractLookupForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a contract ID."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    await runTask(
      "lookup-contract",
      "Lookup contract",
      () =>
        apiRequest(`/api/contract/internal/contract/${contractId}`, {
          method: "GET",
          token
        }),
      {
        successMessage: (response) => {
          const contractType = response.data?.contractInfo?.type;
          const contractStatus = response.data?.contractInfo?.status;
          if (contractType || contractStatus) {
            return `Contract found: ${formatEnumLabel(contractType || "UNKNOWN")} (${formatEnumLabel(contractStatus || "UNKNOWN")}).`;
          }
          return `Contract found successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const deleteContract = async (event) => {
    event.preventDefault();
    const contractId = deleteContractForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a contract ID."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    await runTask("delete-contract", "Delete contract", () =>
      apiRequest(`/api/contract/internal/contract/${contractId}`, {
        method: "DELETE",
        token
      })
    );
  };

  const updateSalaryScaleRange = async (event) => {
    event.preventDefault();
    const scaleId = salaryScaleUpdateForm.salaryScaleId.trim();
    if (!scaleId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a salary scale ID."
      });
      return;
    }
    if (!isUuid(scaleId)) {
      setRequestsNotice({
        type: "error",
        message: "Salary scale ID must be a valid UUID."
      });
      return;
    }

    const hasMinimumUpdate = salaryScaleUpdateForm.minimumPay !== "";
    const hasMaximumUpdate = salaryScaleUpdateForm.maximumPay !== "";
    if (!hasMinimumUpdate && !hasMaximumUpdate) {
      setRequestsNotice({
        type: "error",
        message: "Provide at least one pay update (minimum or maximum)."
      });
      return;
    }

    await runTask(
      "update-salary-scale",
      "Update salary scale",
      async () => {
        let response = null;
        if (hasMinimumUpdate) {
          response = await apiRequest(`/api/contract/internal/salary-scale/${scaleId}/edit-minimum-pay`, {
            method: "PUT",
            body: { data: salaryScaleUpdateForm.minimumPay },
            token
          });
        }
        if (hasMaximumUpdate) {
          response = await apiRequest(`/api/contract/internal/salary-scale/${scaleId}/edit-maximum-pay`, {
            method: "PUT",
            body: { data: salaryScaleUpdateForm.maximumPay },
            token
          });
        }
        return response;
      },
      {
        successMessage: () => "Salary scale updated successfully.",
        onSuccess: () => {
          setSalaryScaleUpdateForm((previous) => ({
            ...previous,
            minimumPay: "",
            maximumPay: ""
          }));
        }
      }
    );
  };

  const renameJobPosition = async (event) => {
    event.preventDefault();
    const jobPositionId = renameJobPositionForm.jobPositionId.trim();
    const name = renameJobPositionForm.name.trim();
    if (!jobPositionId || !name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide job position ID and the new name."
      });
      return;
    }
    if (!isUuid(jobPositionId)) {
      setRequestsNotice({
        type: "error",
        message: "Job position ID must be a valid UUID."
      });
      return;
    }

    await runTask("rename-job-position", "Rename job position", () =>
      apiRequest(`/api/contract/internal/job-position/${jobPositionId}/edit-name`, {
        method: "PUT",
        body: { data: name },
        token
      })
    );
  };

  const renamePensionScheme = async (event) => {
    event.preventDefault();
    const pensionSchemeId = renamePensionSchemeForm.pensionSchemeId.trim();
    const name = renamePensionSchemeForm.name.trim();
    if (!pensionSchemeId || !name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide pension scheme ID and the new name."
      });
      return;
    }
    if (!isUuid(pensionSchemeId)) {
      setRequestsNotice({
        type: "error",
        message: "Pension scheme ID must be a valid UUID."
      });
      return;
    }

    await runTask("rename-pension-scheme", "Rename pension scheme", () =>
      apiRequest(`/api/contract/internal/pension-scheme/${pensionSchemeId}/edit-name`, {
        method: "PUT",
        body: { data: name },
        token
      })
    );
  };

  const deleteCatalogEntity = async (event) => {
    event.preventDefault();
    const entityId = deleteCatalogForm.entityId.trim();
    if (!entityId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide an entity ID."
      });
      return;
    }
    if (!isUuid(entityId)) {
      setRequestsNotice({
        type: "error",
        message: "Entity ID must be a valid UUID."
      });
      return;
    }

    const entityConfig = {
      "salary-scale": {
        label: "salary scale",
        path: `/api/contract/internal/salary-scale/${entityId}`
      },
      "job-position": {
        label: "job position",
        path: `/api/contract/internal/job-position/${entityId}`
      },
      "pension-scheme": {
        label: "pension scheme",
        path: `/api/contract/internal/pension-scheme/${entityId}`
      }
    };

    const selectedEntity = entityConfig[deleteCatalogForm.entityType];
    await runTask(
      "delete-catalog-entity",
      `Delete ${selectedEntity.label}`,
      () =>
        apiRequest(selectedEntity.path, {
          method: "DELETE",
          token
        })
    );
  };

  const createContract = async (event) => {
    event.preventDefault();
    const employeeRef = createContractForm.employeeId.trim();
    const employerRef = createContractForm.employerId.trim();
    const positionName = createContractForm.jobPosition.trim();
    const pensionName = createContractForm.pensionScheme.trim();

    if (!employeeRef || !employerRef || !positionName || !pensionName) {
      setRequestsNotice({
        type: "error",
        message: "Please complete employee, employer, job position and pension scheme fields."
      });
      return;
    }

    let employeeId = "";
    let employerId = "";

    try {
      employeeId = await resolveUserUuid(employeeRef, token);
      employerId = await resolveUserUuid(employerRef, token);
    } catch (error) {
      const message = formatApiError(error);
      setRequestsNotice({
        type: "error",
        message
      });
      return;
    }

    if (!isAllowedContractStartDate(createContractForm.startDate)) {
      setRequestsNotice({
        type: "error",
        message: "Start date must be on day 1 or day 15 of the month."
      });
      return;
    }

    const minimumPay = toFiniteNumber(createContractForm.minimumPay);
    const maximumPay = toFiniteNumber(createContractForm.maximumPay);
    if (maximumPay < minimumPay) {
      setRequestsNotice({
        type: "error",
        message: "Maximum pay must be greater than or equal to minimum pay."
      });
      return;
    }

    const benefits = createContractForm.benefits
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const payload = {
      contractParties: {
        employeeId,
        employerId
      },
      contractInfo: {
        type: createContractForm.contractType,
        status: "DRAFT"
      },
      contractTerms: {
        hoursPerWeek: toFiniteNumber(createContractForm.hoursPerWeek, 40),
        vacationDays: toFiniteNumber(createContractForm.vacationDays, 25),
        startDate: createContractForm.startDate || null,
        endDate: createContractForm.endDate || null,
        terminationDate: null,
        salaryScalePoint: toFiniteNumber(createContractForm.salaryScalePoint, 0.2),
        lastSalaryIncreaseDate: null
      },
      jobPosition: {
        name: positionName,
        salaryScale: {
          minimumPay,
          maximumPay,
          step: toFiniteNumber(createContractForm.salaryStep, 0.1)
        }
      },
      pensionScheme: {
        name: pensionName
      },
      benefits
    };

    await runTask("create-contract", "Create employment contract", () =>
      apiRequest("/api/contract/internal/contract", {
        method: "POST",
        body: payload,
        token
      })
    );
  };

  const updateUserProfile = async (event) => {
    event.preventDefault();
    const netId = updateProfileForm.netId.trim();
    if (!netId) {
      setRequestsNotice({
        type: "error",
        message: "Please enter the user NetID you want to update."
      });
      return;
    }

    const payload = {
      netId,
      role: updateProfileForm.role,
      firstName: updateProfileForm.firstName.trim(),
      lastName: updateProfileForm.lastName.trim(),
      email: updateProfileForm.email.trim(),
      phoneNumber: updateProfileForm.phoneNumber.trim(),
      address: updateProfileForm.address.trim(),
      description: updateProfileForm.description.trim()
    };

    await runTask("update-profile", "Update employee profile", () =>
      apiRequest("/api/user/internal/user/updateUser", {
        method: "POST",
        body: payload,
        token
      })
    );
  };

  const submitUserRequest = async (event) => {
    event.preventDefault();
    const requestBody = createUserRequestForm.requestBody.trim();
    if (!requestBody) {
      setRequestsNotice({
        type: "error",
        message: "Please add the request details before submitting."
      });
      return;
    }

    const contractId = createUserRequestForm.contractId.trim();
    if (contractId && !isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }
    const numberOfDays = toOptionalNumber(createUserRequestForm.numberOfDays) ?? 0;
    const startDate = createUserRequestForm.startDate
      ? `${createUserRequestForm.startDate}T09:00:00`
      : null;

    await runTask(
      "submit-user-request",
      "Submit employee request",
      () =>
        apiRequest("/api/request/internal/request", {
          method: "POST",
          body: {
            contractId: contractId || null,
            requestBody,
            requestDate: currentApiDateTime(),
            requestStatus: "OPEN",
            startDate,
            numberOfDays
          },
          token
        }),
      {
        successMessage: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Request submitted successfully. Tracking number: ${requestId}.`;
          }
          return `Request submitted successfully (HTTP ${response.status}).`;
        },
        successActivity: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Created request ${requestId}.`;
          }
          return `Success (${response.status}).`;
        },
        onSuccess: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            setRequestLookupForm({ requestId });
            setDocumentResponseForm((previous) => ({ ...previous, requestId }));
          }
          setCreateUserRequestForm((previous) => ({
            ...previous,
            requestBody: "",
            startDate: "",
            numberOfDays: ""
          }));
        }
      }
    );
  };

  const requestContractUpdate = async (event) => {
    event.preventDefault();
    const contractId = contractUpdateRequestForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide the contract ID for this update request."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    if (
      contractUpdateRequestForm.startDate
      && !isAllowedContractStartDate(contractUpdateRequestForm.startDate)
    ) {
      setRequestsNotice({
        type: "error",
        message: "Contract start date can only be day 1 or day 15."
      });
      return;
    }

    const benefits = contractUpdateRequestForm.benefits
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const payload = {
      hoursPerWeek: toOptionalNumber(contractUpdateRequestForm.hoursPerWeek),
      vacationDays: toOptionalNumber(contractUpdateRequestForm.vacationDays),
      salaryScalePoint: toOptionalNumber(contractUpdateRequestForm.salaryScalePoint),
      jobPosition: contractUpdateRequestForm.jobPosition.trim() || null,
      benefits: benefits.length > 0 ? benefits : null,
      startDate: contractUpdateRequestForm.startDate || null,
      endDate: contractUpdateRequestForm.endDate || null
    };

    const hasAnyChange = Object.values(payload).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null;
    });

    if (!hasAnyChange) {
      setRequestsNotice({
        type: "error",
        message: "Please provide at least one change for the contract update request."
      });
      return;
    }

    await runTask(
      "contract-update-request",
      "Request contract update",
      () =>
        apiRequest(`/api/request/internal/request/contract/${contractId}`, {
          method: "POST",
          body: payload,
          token
        }),
      {
        successMessage: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Contract update request submitted. Tracking number: ${requestId}.`;
          }
          return `Contract update request submitted (HTTP ${response.status}).`;
        },
        onSuccess: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            setRequestLookupForm({ requestId });
            setDocumentResponseForm((previous) => ({ ...previous, requestId }));
          }
        }
      }
    );
  };

  const respondToDocumentRequest = async (event) => {
    event.preventDefault();
    const requestId = documentResponseForm.requestId.trim();
    const responseBody = documentResponseForm.responseBody.trim();
    if (!requestId || !responseBody) {
      setRequestsNotice({
        type: "error",
        message: "Please provide request number and your response."
      });
      return;
    }
    if (!isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Request number must be a valid UUID."
      });
      return;
    }

    await runTask("document-response", "Submit document response", () =>
      apiRequest(`/api/request/internal/request/document/respond/${requestId}`, {
        method: "PUT",
        body: responseBody,
        token
      })
    );
  };

  const checkRequestStatus = async (event) => {
    event.preventDefault();
    const requestId = requestLookupForm.requestId.trim();
    if (!requestId) {
      setRequestsNotice({
        type: "error",
        message: "Please enter a request number to check."
      });
      return;
    }
    if (!isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Request number must be a valid UUID."
      });
      return;
    }

    await runTask(
      "request-status",
      "Check request status",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}`, {
          method: "GET",
          token
        }),
      {
        successMessage: (response) => {
          const status = response.data?.requestStatus;
          if (status) {
            return `Request status: ${formatEnumLabel(status)}.`;
          }
          return `Request found successfully (HTTP ${response.status}).`;
        },
        successActivity: (response) => {
          const status = response.data?.requestStatus;
          if (status) {
            return `Status is ${formatEnumLabel(status)}.`;
          }
          return `Success (${response.status}).`;
        }
      }
    );
  };

  if (!token) {
    return (
      <main className="auth-layout">
        <section className="auth-hero">
          <p className="brand-kicker">HR MANAGEMENT SUITE</p>
          <h1>Sign in first, then continue to your portal</h1>
          <p>
            This app now has dedicated portal routes for users and admins, with a role-aware sidebar navigation.
          </p>
          <ul className="auth-points">
            <li>Route flow: /login to /portal/me</li>
            <li>Role-based sections and action visibility</li>
            <li>Dedicated admin center for HR operations</li>
          </ul>
          <p className="auth-note">
            Bootstrap admin: <code>ADMIN</code> with password from
            <code> BOOTSTRAP_ADMIN_PASSWORD</code>.
          </p>
        </section>

        <section className="auth-card">
          <div className="auth-switch">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>

          {authMode === "login" ? (
            <form className="stack" onSubmit={login}>
              <label>
                NetID
                <input
                  value={loginForm.netId}
                  onChange={(event) =>
                    setLoginForm((previous) => ({ ...previous, netId: event.target.value }))
                  }
                  placeholder="e.g. ADMIN"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((previous) => ({ ...previous, password: event.target.value }))
                  }
                  placeholder="your password"
                  required
                />
              </label>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                />
                Keep me signed in on this device
              </label>

              <button type="submit" disabled={isLoginLoading}>
                {isLoginLoading ? "Signing in..." : "Enter portal"}
              </button>
            </form>
          ) : (
            <form className="stack" onSubmit={registerFromAuth}>
              <label>
                NetID
                <input
                  value={registerForm.netId}
                  onChange={(event) =>
                    setRegisterForm((previous) => ({ ...previous, netId: event.target.value }))
                  }
                  placeholder="e.g. jane"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((previous) => ({ ...previous, password: event.target.value }))
                  }
                  placeholder="create password"
                  required
                />
              </label>

              <button type="submit" disabled={isRegisterLoading}>
                {isRegisterLoading ? "Creating..." : "Create account"}
              </button>
            </form>
          )}

          {authNotice && <p className={`notice ${authNotice.type}`}>{authNotice.text}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="portal-layout">
      <aside className="portal-sidebar">
        <div>
          <p className="brand-kicker">HR MANAGEMENT SUITE</p>
          <h2 className="brand-title">User Portal</h2>
        </div>

        <div className="sidebar-session">
          <p className="session-name">{activeNetId || "Unknown user"}</p>
          <p className={`role-badge ${isAdmin ? "admin" : "user"}`}>
            {isAdmin ? "ADMIN" : "USER"}
          </p>
        </div>

        <nav className="nav-stack">
          {sidebarGroups.map((group) => (
            <div key={group.id} className="nav-group">
              <p className="nav-group-title">{group.label}</p>
              {group.items.map((route) => (
                <button
                  key={route.path}
                  type="button"
                  className={currentPath === route.path ? "nav-button active" : "nav-button"}
                  onClick={() => navigate(route.path)}
                >
                  {route.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <button type="button" className="ghost signout" onClick={clearSession}>
          Sign out
        </button>
      </aside>

      <section className="portal-main">
        <header className="portal-header">
          <p className="route-kicker">{activeRoute?.path || "/portal/me"}</p>
          <h1>{activeRoute?.title || "Portal"}</h1>
          <p>{activeRoute?.description || "Role-aware workspace for HR operations."}</p>
        </header>

        {isMeRoute && (
          <section className="portal-grid single-panel">
            <article className="panel">
              <h2>Quick actions</h2>
              <p className="helper-text">
                Fast checks for regular user flows.
              </p>
              <div className="action-grid">
                {userActions.map((action) => {
                  const result = actionResults[action.id];
                  return (
                    <div key={action.id} className="action-item">
                      <button
                        type="button"
                        onClick={() => runPortalAction(action)}
                        disabled={activeActionId === action.id}
                      >
                        {activeActionId === action.id ? "Running..." : action.label}
                      </button>
                      {result && (
                        <>
                          <p className={`mini-status ${result.status || "info"}`}>
                            {result.message}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {isRequestsRoute && (
          <section className="panel workspace">
            <h2>{isAdmin ? "Admin Requests Console" : "Requests Console"}</h2>
            <p className="helper-text">
              {isAdmin
                ? "Run operational HR actions directly from buttons and forms."
                : "Use these guided actions to interact with the HR backend."}
            </p>

            <div className="workflow-grid">
              <article className="workflow-card">
                <h3>My checks</h3>
                <p className="helper-text">
                  Quick actions for your own employee flow.
                </p>
                <div className="stack">
                  <button
                    type="button"
                    onClick={() => runPortalAction(PORTAL_ACTIONS[0])}
                    disabled={activeActionId === PORTAL_ACTIONS[0].id}
                  >
                    {activeActionId === PORTAL_ACTIONS[0].id
                      ? "Checking..."
                      : "Check contract service"}
                  </button>
                  <button
                    type="button"
                    onClick={() => runPortalAction(PORTAL_ACTIONS[1])}
                    disabled={activeActionId === PORTAL_ACTIONS[1].id}
                  >
                    {activeActionId === PORTAL_ACTIONS[1].id
                      ? "Checking..."
                      : "Check request service"}
                  </button>
                </div>
              </article>

              {isAdmin && (
                <article className="workflow-card">
                  <h3>HR admin checks</h3>
                  <p className="helper-text">
                    Internal actions available only to administrators.
                  </p>
                  <div className="stack">
                    <button
                      type="button"
                      onClick={() => runPortalAction(PORTAL_ACTIONS[2])}
                      disabled={activeActionId === PORTAL_ACTIONS[2].id}
                    >
                      {activeActionId === PORTAL_ACTIONS[2].id
                        ? "Loading..."
                        : "List all user NetIDs"}
                    </button>
                    <button
                      type="button"
                      onClick={() => runPortalAction(PORTAL_ACTIONS[3])}
                      disabled={activeActionId === PORTAL_ACTIONS[3].id}
                    >
                      {activeActionId === PORTAL_ACTIONS[3].id
                        ? "Loading..."
                        : "View open requests"}
                    </button>
                  </div>
                </article>
              )}
            </div>

            <section className="task-modules">
              <h3>Employee task modules</h3>
              <p className="helper-text">
                Submit, update, and track your own requests using guided forms.
              </p>

              <div className="task-grid">
                <article className="task-card">
                  <h4>Submit HR request</h4>
                  <form className="stack" onSubmit={submitUserRequest}>
                    <label>
                      Contract ID (optional)
                      <input
                        value={createUserRequestForm.contractId}
                        onChange={(event) =>
                          setCreateUserRequestForm((previous) => ({
                            ...previous,
                            contractId: event.target.value
                          }))
                        }
                        placeholder="UUID if this request is contract-related"
                      />
                    </label>
                    <label>
                      Request details
                      <textarea
                        className="compact-textarea"
                        rows={4}
                        value={createUserRequestForm.requestBody}
                        onChange={(event) =>
                          setCreateUserRequestForm((previous) => ({
                            ...previous,
                            requestBody: event.target.value
                          }))
                        }
                        placeholder="Describe what you need from HR"
                        required
                      />
                    </label>
                    <div className="form-two-col">
                      <label>
                        Requested start date (optional)
                        <input
                          type="date"
                          value={createUserRequestForm.startDate}
                          onChange={(event) =>
                            setCreateUserRequestForm((previous) => ({
                              ...previous,
                              startDate: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label>
                        Number of days (optional)
                        <input
                          type="number"
                          min="1"
                          value={createUserRequestForm.numberOfDays}
                          onChange={(event) =>
                            setCreateUserRequestForm((previous) => ({
                              ...previous,
                              numberOfDays: event.target.value
                            }))
                          }
                        />
                      </label>
                    </div>
                    <button type="submit" disabled={activeTaskId === "submit-user-request"}>
                      {activeTaskId === "submit-user-request"
                        ? "Submitting..."
                        : "Submit HR request"}
                    </button>
                  </form>
                </article>

                <article className="task-card">
                  <h4>Request contract update</h4>
                  <form className="stack" onSubmit={requestContractUpdate}>
                    <label>
                      Contract ID
                      <input
                        value={contractUpdateRequestForm.contractId}
                        onChange={(event) =>
                          setContractUpdateRequestForm((previous) => ({
                            ...previous,
                            contractId: event.target.value
                          }))
                        }
                        placeholder="Contract UUID"
                        required
                      />
                    </label>
                    <div className="form-two-col">
                      <label>
                        Hours/week (optional)
                        <input
                          type="number"
                          min="8"
                          max="40"
                          value={contractUpdateRequestForm.hoursPerWeek}
                          onChange={(event) =>
                            setContractUpdateRequestForm((previous) => ({
                              ...previous,
                              hoursPerWeek: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label>
                        Vacation days (optional)
                        <input
                          type="number"
                          min="15"
                          max="30"
                          value={contractUpdateRequestForm.vacationDays}
                          onChange={(event) =>
                            setContractUpdateRequestForm((previous) => ({
                              ...previous,
                              vacationDays: event.target.value
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="form-two-col">
                      <label>
                        Salary scale point (optional)
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={contractUpdateRequestForm.salaryScalePoint}
                          onChange={(event) =>
                            setContractUpdateRequestForm((previous) => ({
                              ...previous,
                              salaryScalePoint: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label>
                        Job position (optional)
                        <input
                          value={contractUpdateRequestForm.jobPosition}
                          onChange={(event) =>
                            setContractUpdateRequestForm((previous) => ({
                              ...previous,
                              jobPosition: event.target.value
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="form-two-col">
                      <label>
                        New start date (optional)
                        <input
                          type="date"
                          value={contractUpdateRequestForm.startDate}
                          onChange={(event) =>
                            setContractUpdateRequestForm((previous) => ({
                              ...previous,
                              startDate: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label>
                        New end date (optional)
                        <input
                          type="date"
                          value={contractUpdateRequestForm.endDate}
                          onChange={(event) =>
                            setContractUpdateRequestForm((previous) => ({
                              ...previous,
                              endDate: event.target.value
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Benefits update (optional, comma separated)
                      <input
                        value={contractUpdateRequestForm.benefits}
                        onChange={(event) =>
                          setContractUpdateRequestForm((previous) => ({
                            ...previous,
                            benefits: event.target.value
                          }))
                        }
                        placeholder="Meal vouchers, Transport"
                      />
                    </label>
                    <button type="submit" disabled={activeTaskId === "contract-update-request"}>
                      {activeTaskId === "contract-update-request"
                        ? "Submitting..."
                        : "Request contract update"}
                    </button>
                  </form>
                </article>

                <article className="task-card">
                  <h4>Track request status</h4>
                  <form className="stack" onSubmit={checkRequestStatus}>
                    <label>
                      Request number
                      <input
                        value={requestLookupForm.requestId}
                        onChange={(event) =>
                          setRequestLookupForm({ requestId: event.target.value })
                        }
                        placeholder="Paste your request UUID"
                        required
                      />
                    </label>
                    <button type="submit" disabled={activeTaskId === "request-status"}>
                      {activeTaskId === "request-status"
                        ? "Checking..."
                        : "Check request status"}
                    </button>
                  </form>
                </article>

                <article className="task-card">
                  <h4>Submit requested document</h4>
                  <form className="stack" onSubmit={respondToDocumentRequest}>
                    <label>
                      Request number
                      <input
                        value={documentResponseForm.requestId}
                        onChange={(event) =>
                          setDocumentResponseForm((previous) => ({
                            ...previous,
                            requestId: event.target.value
                          }))
                        }
                        placeholder="UUID from HR request"
                        required
                      />
                    </label>
                    <label>
                      Your response
                      <textarea
                        className="compact-textarea"
                        rows={4}
                        value={documentResponseForm.responseBody}
                        onChange={(event) =>
                          setDocumentResponseForm((previous) => ({
                            ...previous,
                            responseBody: event.target.value
                          }))
                        }
                        placeholder="Add document details or upload reference"
                        required
                      />
                    </label>
                    <button type="submit" disabled={activeTaskId === "document-response"}>
                      {activeTaskId === "document-response"
                        ? "Sending..."
                        : "Send document response"}
                    </button>
                  </form>
                </article>
              </div>
            </section>

            <div className="response-area friendly">
              <h3>Action status</h3>
              {!requestsNotice && (
                <p className="helper-text">Choose an action to run.</p>
              )}
              {requestsNotice && (
                <p
                  className={`mini-status ${
                    requestsNotice.type === "success" ? "success" : "error"
                  }`}
                >
                  {requestsNotice.message}
                </p>
              )}
            </div>

            {isAdmin && (
              <section className="task-modules">
                <h3>HR task modules</h3>
                <p className="helper-text">
                  Complete business forms instead of calling raw technical endpoints.
                </p>

                <div className="task-grid">
                  <article className="task-card">
                    <h4>Approve employee request</h4>
                    <form className="stack" onSubmit={approveRequest}>
                      <label>
                        Request number
                        <input
                          value={approveRequestForm.requestId}
                          onChange={(event) =>
                            setApproveRequestForm({ requestId: event.target.value })
                          }
                          placeholder="Paste the request UUID"
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "approve-request"}>
                        {activeTaskId === "approve-request"
                          ? "Approving..."
                          : "Approve employee request"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Create employment contract</h4>
                    <form className="stack" onSubmit={createContract}>
                      <label>
                        Employee (NetID or UUID)
                        <input
                          value={createContractForm.employeeId}
                          onChange={(event) =>
                            setCreateContractForm((prev) => ({
                              ...prev,
                              employeeId: event.target.value
                            }))
                          }
                          placeholder="e.g. ioan or user UUID"
                          required
                        />
                      </label>
                      <label>
                        Employer (NetID or UUID)
                        <input
                          value={createContractForm.employerId}
                          onChange={(event) =>
                            setCreateContractForm((prev) => ({
                              ...prev,
                              employerId: event.target.value
                            }))
                          }
                          placeholder="e.g. ADMIN or employer UUID"
                          required
                        />
                      </label>
                      <div className="form-two-col">
                        <label>
                          Contract type
                          <select
                            value={createContractForm.contractType}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                contractType: event.target.value
                              }))
                            }
                          >
                            {CONTRACT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {formatEnumLabel(type)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Hours/week
                          <input
                            type="number"
                            min="8"
                            max="40"
                            value={createContractForm.hoursPerWeek}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                hoursPerWeek: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                      </div>
                      <div className="form-two-col">
                        <label>
                          Vacation days
                          <input
                            type="number"
                            min="15"
                            max="30"
                            value={createContractForm.vacationDays}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                vacationDays: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Salary scale point
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={createContractForm.salaryScalePoint}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                salaryScalePoint: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                      </div>
                      <div className="form-two-col">
                        <label>
                          Start date
                          <input
                            type="date"
                            value={createContractForm.startDate}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                startDate: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          End date (optional)
                          <input
                            type="date"
                            value={createContractForm.endDate}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                endDate: event.target.value
                              }))
                            }
                          />
                        </label>
                      </div>
                      <label>
                        Job position
                        <input
                          value={createContractForm.jobPosition}
                          onChange={(event) =>
                            setCreateContractForm((prev) => ({
                              ...prev,
                              jobPosition: event.target.value
                            }))
                          }
                          required
                        />
                      </label>
                      <div className="form-three-col">
                        <label>
                          Min pay
                          <input
                            type="number"
                            min="0"
                            value={createContractForm.minimumPay}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                minimumPay: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Max pay
                          <input
                            type="number"
                            min="0"
                            value={createContractForm.maximumPay}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                maximumPay: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Scale step
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={createContractForm.salaryStep}
                            onChange={(event) =>
                              setCreateContractForm((prev) => ({
                                ...prev,
                                salaryStep: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                      </div>
                      <label>
                        Pension scheme
                        <input
                          value={createContractForm.pensionScheme}
                          onChange={(event) =>
                            setCreateContractForm((prev) => ({
                              ...prev,
                              pensionScheme: event.target.value
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Benefits (comma separated)
                        <input
                          value={createContractForm.benefits}
                          onChange={(event) =>
                            setCreateContractForm((prev) => ({
                              ...prev,
                              benefits: event.target.value
                            }))
                          }
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "create-contract"}>
                        {activeTaskId === "create-contract"
                          ? "Creating..."
                          : "Create employment contract"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Update employee profile</h4>
                    <form className="stack" onSubmit={updateUserProfile}>
                      <label>
                        Employee NetID
                        <input
                          value={updateProfileForm.netId}
                          onChange={(event) =>
                            setUpdateProfileForm((prev) => ({
                              ...prev,
                              netId: event.target.value
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Role
                        <select
                          value={updateProfileForm.role}
                          onChange={(event) =>
                            setUpdateProfileForm((prev) => ({
                              ...prev,
                              role: event.target.value
                            }))
                          }
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {formatEnumLabel(role)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="form-two-col">
                        <label>
                          First name
                          <input
                            value={updateProfileForm.firstName}
                            onChange={(event) =>
                              setUpdateProfileForm((prev) => ({
                                ...prev,
                                firstName: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          Last name
                          <input
                            value={updateProfileForm.lastName}
                            onChange={(event) =>
                              setUpdateProfileForm((prev) => ({
                                ...prev,
                                lastName: event.target.value
                              }))
                            }
                          />
                        </label>
                      </div>
                      <div className="form-two-col">
                        <label>
                          Email
                          <input
                            type="email"
                            value={updateProfileForm.email}
                            onChange={(event) =>
                              setUpdateProfileForm((prev) => ({
                                ...prev,
                                email: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          Phone number
                          <input
                            value={updateProfileForm.phoneNumber}
                            onChange={(event) =>
                              setUpdateProfileForm((prev) => ({
                                ...prev,
                                phoneNumber: event.target.value
                              }))
                            }
                          />
                        </label>
                      </div>
                      <label>
                        Address
                        <input
                          value={updateProfileForm.address}
                          onChange={(event) =>
                            setUpdateProfileForm((prev) => ({
                              ...prev,
                              address: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label>
                        Description
                        <input
                          value={updateProfileForm.description}
                          onChange={(event) =>
                            setUpdateProfileForm((prev) => ({
                              ...prev,
                              description: event.target.value
                            }))
                          }
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "update-profile"}>
                        {activeTaskId === "update-profile"
                          ? "Updating..."
                          : "Update employee profile"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Reject employee request</h4>
                    <form className="stack" onSubmit={rejectRequest}>
                      <label>
                        Request number
                        <input
                          value={rejectRequestForm.requestId}
                          onChange={(event) =>
                            setRejectRequestForm((previous) => ({
                              ...previous,
                              requestId: event.target.value
                            }))
                          }
                          placeholder="Request UUID"
                          required
                        />
                      </label>
                      <label>
                        Rejection reason
                        <textarea
                          className="compact-textarea"
                          rows={3}
                          value={rejectRequestForm.reason}
                          onChange={(event) =>
                            setRejectRequestForm((previous) => ({
                              ...previous,
                              reason: event.target.value
                            }))
                          }
                          placeholder="Explain why the request is rejected"
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "reject-request"}>
                        {activeTaskId === "reject-request"
                          ? "Rejecting..."
                          : "Reject employee request"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Request employee document</h4>
                    <form className="stack" onSubmit={requestEmployeeDocument}>
                      <label>
                        Employee (NetID or UUID)
                        <input
                          value={documentRequestForm.employeeRef}
                          onChange={(event) =>
                            setDocumentRequestForm((previous) => ({
                              ...previous,
                              employeeRef: event.target.value
                            }))
                          }
                          placeholder="e.g. ioan or employee UUID"
                          required
                        />
                      </label>
                      <label>
                        Document details
                        <textarea
                          className="compact-textarea"
                          rows={3}
                          value={documentRequestForm.requestBody}
                          onChange={(event) =>
                            setDocumentRequestForm((previous) => ({
                              ...previous,
                              requestBody: event.target.value
                            }))
                          }
                          placeholder="What document should the employee provide?"
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "request-document"}>
                        {activeTaskId === "request-document"
                          ? "Sending..."
                          : "Request employee document"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Terminate contract</h4>
                    <form className="stack" onSubmit={terminateContract}>
                      <label>
                        Contract ID
                        <input
                          value={terminateContractForm.contractId}
                          onChange={(event) =>
                            setTerminateContractForm({ contractId: event.target.value })
                          }
                          placeholder="Contract UUID"
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "terminate-contract"}>
                        {activeTaskId === "terminate-contract"
                          ? "Terminating..."
                          : "Terminate contract"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Create salary scale</h4>
                    <form className="stack" onSubmit={createSalaryScale}>
                      <div className="form-three-col">
                        <label>
                          Min pay
                          <input
                            type="number"
                            min="0"
                            value={salaryScaleForm.minimumPay}
                            onChange={(event) =>
                              setSalaryScaleForm((previous) => ({
                                ...previous,
                                minimumPay: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Max pay
                          <input
                            type="number"
                            min="0"
                            value={salaryScaleForm.maximumPay}
                            onChange={(event) =>
                              setSalaryScaleForm((previous) => ({
                                ...previous,
                                maximumPay: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Step
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={salaryScaleForm.step}
                            onChange={(event) =>
                              setSalaryScaleForm((previous) => ({
                                ...previous,
                                step: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                      </div>
                      <button type="submit" disabled={activeTaskId === "create-salary-scale"}>
                        {activeTaskId === "create-salary-scale"
                          ? "Creating..."
                          : "Create salary scale"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Create job position</h4>
                    <form className="stack" onSubmit={createJobPositionCatalog}>
                      <label>
                        Position name
                        <input
                          value={jobPositionCatalogForm.name}
                          onChange={(event) =>
                            setJobPositionCatalogForm((previous) => ({
                              ...previous,
                              name: event.target.value
                            }))
                          }
                          required
                        />
                      </label>
                      <div className="form-three-col">
                        <label>
                          Min pay
                          <input
                            type="number"
                            min="0"
                            value={jobPositionCatalogForm.minimumPay}
                            onChange={(event) =>
                              setJobPositionCatalogForm((previous) => ({
                                ...previous,
                                minimumPay: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Max pay
                          <input
                            type="number"
                            min="0"
                            value={jobPositionCatalogForm.maximumPay}
                            onChange={(event) =>
                              setJobPositionCatalogForm((previous) => ({
                                ...previous,
                                maximumPay: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Step
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={jobPositionCatalogForm.step}
                            onChange={(event) =>
                              setJobPositionCatalogForm((previous) => ({
                                ...previous,
                                step: event.target.value
                              }))
                            }
                            required
                          />
                        </label>
                      </div>
                      <button type="submit" disabled={activeTaskId === "create-job-position"}>
                        {activeTaskId === "create-job-position"
                          ? "Creating..."
                          : "Create job position"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Create pension scheme</h4>
                    <form className="stack" onSubmit={createPensionScheme}>
                      <label>
                        Scheme name
                        <input
                          value={pensionSchemeForm.name}
                          onChange={(event) =>
                            setPensionSchemeForm({ name: event.target.value })
                          }
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "create-pension-scheme"}>
                        {activeTaskId === "create-pension-scheme"
                          ? "Creating..."
                          : "Create pension scheme"}
                      </button>
                    </form>
                  </article>
                </div>
              </section>
            )}
          </section>
        )}

        {isAdminRoute && (
          <>
            {!isAdmin ? (
              <section className="panel restricted">
                <h2>Admin area</h2>
                <p className="helper-text">
                  This section is available only with an ADMIN token.
                </p>
              </section>
            ) : (
              <>
              <section className="portal-grid">
                <article className="panel">
                  <h2>Create user account</h2>
                  <p className="helper-text">
                    Register a new employee account directly from the admin portal.
                  </p>
                  <form onSubmit={registerFromAdmin} className="stack">
                    <label>
                      NetID
                      <input
                        value={registerForm.netId}
                        onChange={(event) =>
                          setRegisterForm((previous) => ({
                            ...previous,
                            netId: event.target.value
                          }))
                        }
                        placeholder="e.g. employee1"
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={registerForm.password}
                        onChange={(event) =>
                          setRegisterForm((previous) => ({
                            ...previous,
                            password: event.target.value
                          }))
                        }
                        placeholder="create password"
                        required
                      />
                    </label>
                    <button type="submit" disabled={isRegisterLoading}>
                      {isRegisterLoading ? "Creating..." : "Create user"}
                    </button>
                  </form>
                  {adminNotice && (
                    <p className={`notice ${adminNotice.type}`}>{adminNotice.text}</p>
                  )}
                </article>

                <article className="panel">
                  <h2>Admin operations</h2>
                  <p className="helper-text">
                    Trigger internal checks and inspect backend behavior.
                  </p>
                  <div className="action-grid">
                    {adminActions.map((action) => {
                      const result = actionResults[action.id];
                      return (
                        <div key={action.id} className="action-item">
                          <button
                            type="button"
                            onClick={() => runPortalAction(action)}
                            disabled={activeActionId === action.id}
                          >
                            {activeActionId === action.id ? "Running..." : action.label}
                          </button>
                          {result && (
                            <>
                              <p className={`mini-status ${result.status || "info"}`}>
                                {result.message}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              </section>

              <section className="panel task-modules">
                <h2>Contract and Catalog Management</h2>
                <p className="helper-text">
                  Manage contract records and HR catalogs without manually crafting API payloads.
                </p>
                <div className="task-grid">
                  <article className="task-card">
                    <h4>Lookup contract</h4>
                    <form className="stack" onSubmit={lookupContract}>
                      <label>
                        Contract ID
                        <input
                          value={contractLookupForm.contractId}
                          onChange={(event) =>
                            setContractLookupForm({ contractId: event.target.value })
                          }
                          placeholder="Contract UUID"
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "lookup-contract"}>
                        {activeTaskId === "lookup-contract" ? "Checking..." : "Lookup contract"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Delete contract</h4>
                    <form className="stack" onSubmit={deleteContract}>
                      <label>
                        Contract ID
                        <input
                          value={deleteContractForm.contractId}
                          onChange={(event) =>
                            setDeleteContractForm({ contractId: event.target.value })
                          }
                          placeholder="Contract UUID"
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "delete-contract"}>
                        {activeTaskId === "delete-contract" ? "Deleting..." : "Delete contract"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Update salary scale pay range</h4>
                    <form className="stack" onSubmit={updateSalaryScaleRange}>
                      <label>
                        Salary scale ID
                        <input
                          value={salaryScaleUpdateForm.salaryScaleId}
                          onChange={(event) =>
                            setSalaryScaleUpdateForm((previous) => ({
                              ...previous,
                              salaryScaleId: event.target.value
                            }))
                          }
                          placeholder="Salary scale UUID"
                          required
                        />
                      </label>
                      <div className="form-two-col">
                        <label>
                          New minimum pay (optional)
                          <input
                            type="number"
                            min="0"
                            value={salaryScaleUpdateForm.minimumPay}
                            onChange={(event) =>
                              setSalaryScaleUpdateForm((previous) => ({
                                ...previous,
                                minimumPay: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label>
                          New maximum pay (optional)
                          <input
                            type="number"
                            min="0"
                            value={salaryScaleUpdateForm.maximumPay}
                            onChange={(event) =>
                              setSalaryScaleUpdateForm((previous) => ({
                                ...previous,
                                maximumPay: event.target.value
                              }))
                            }
                          />
                        </label>
                      </div>
                      <button type="submit" disabled={activeTaskId === "update-salary-scale"}>
                        {activeTaskId === "update-salary-scale"
                          ? "Updating..."
                          : "Update salary scale"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Rename job position</h4>
                    <form className="stack" onSubmit={renameJobPosition}>
                      <label>
                        Job position ID
                        <input
                          value={renameJobPositionForm.jobPositionId}
                          onChange={(event) =>
                            setRenameJobPositionForm((previous) => ({
                              ...previous,
                              jobPositionId: event.target.value
                            }))
                          }
                          placeholder="Job position UUID"
                          required
                        />
                      </label>
                      <label>
                        New name
                        <input
                          value={renameJobPositionForm.name}
                          onChange={(event) =>
                            setRenameJobPositionForm((previous) => ({
                              ...previous,
                              name: event.target.value
                            }))
                          }
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "rename-job-position"}>
                        {activeTaskId === "rename-job-position"
                          ? "Renaming..."
                          : "Rename job position"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Rename pension scheme</h4>
                    <form className="stack" onSubmit={renamePensionScheme}>
                      <label>
                        Pension scheme ID
                        <input
                          value={renamePensionSchemeForm.pensionSchemeId}
                          onChange={(event) =>
                            setRenamePensionSchemeForm((previous) => ({
                              ...previous,
                              pensionSchemeId: event.target.value
                            }))
                          }
                          placeholder="Pension scheme UUID"
                          required
                        />
                      </label>
                      <label>
                        New name
                        <input
                          value={renamePensionSchemeForm.name}
                          onChange={(event) =>
                            setRenamePensionSchemeForm((previous) => ({
                              ...previous,
                              name: event.target.value
                            }))
                          }
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "rename-pension-scheme"}>
                        {activeTaskId === "rename-pension-scheme"
                          ? "Renaming..."
                          : "Rename pension scheme"}
                      </button>
                    </form>
                  </article>

                  <article className="task-card">
                    <h4>Delete salary/job/pension catalog entry</h4>
                    <form className="stack" onSubmit={deleteCatalogEntity}>
                      <label>
                        Entity type
                        <select
                          value={deleteCatalogForm.entityType}
                          onChange={(event) =>
                            setDeleteCatalogForm((previous) => ({
                              ...previous,
                              entityType: event.target.value
                            }))
                          }
                        >
                          <option value="salary-scale">Salary scale</option>
                          <option value="job-position">Job position</option>
                          <option value="pension-scheme">Pension scheme</option>
                        </select>
                      </label>
                      <label>
                        Entity ID
                        <input
                          value={deleteCatalogForm.entityId}
                          onChange={(event) =>
                            setDeleteCatalogForm((previous) => ({
                              ...previous,
                              entityId: event.target.value
                            }))
                          }
                          placeholder="UUID"
                          required
                        />
                      </label>
                      <button type="submit" disabled={activeTaskId === "delete-catalog-entity"}>
                        {activeTaskId === "delete-catalog-entity"
                          ? "Deleting..."
                          : "Delete selected entity"}
                      </button>
                    </form>
                  </article>
                </div>
              </section>
              </>
            )}
          </>
        )}

        <section className="panel activity-panel">
          <h2>Recent activity</h2>
          <div className="activity-feed">
            {activity.length === 0 && <p className="helper-text">No actions yet.</p>}
            {activity.map((entry) => (
              <div key={entry.id} className={`activity-item ${entry.type}`}>
                <p className="activity-title">{entry.title}</p>
                <p className="activity-detail">{entry.detail}</p>
                <p className="activity-time">{entry.timestamp}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
