import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import {
  ATTACHMENTS_REQUEST_STORAGE_KEY,
  NETID_STORAGE_KEY,
  REMEMBER_SESSION_KEY,
  TOKEN_STORAGE_KEY
} from "./constants/app";
import {
  CONTRACT_TYPES,
  PORTAL_ACTIONS,
  PORTAL_ROUTES,
  SIDEBAR_GROUPS,
  USER_ROLES
} from "./constants/portal";
import AuthScreen from "./components/AuthScreen";
import PageTopbar from "./components/PageTopbar";
import PortalSidebar from "./components/PortalSidebar";
import AdminPage from "./pages/AdminPage";
import MePage from "./pages/MePage";
import RequestsPage from "./pages/RequestsPage";
import { persistSessionState, resolveSessionIdentity } from "./services/securityService";
import {
  createMultipartFilePayload,
  triggerFileDownload,
  validatePdfUpload
} from "./services/uploadService";
import { resolveUserUuid } from "./services/userService";
import {
  extractRoleFromToken,
  hasRequiredRole,
  initialNetIdFromStorage,
  isUuid,
  isTokenExpired,
  validateCredentials
} from "./utils/auth";
import {
  buildPortalActionFeedback,
  buildRequestStats,
  currentApiDateTime,
  formatApiError,
  formatEnumLabel,
  formatFileSize,
  getRequestGuidance,
  isAllowedContractStartDate,
  normalizeDateForInput,
  sanitizeFileNameForDownload,
  toFiniteNumber,
  toLocaleDateTime,
  toOptionalNumber
} from "./utils/formatters";
import { findPortalRoute, getDefaultPortalPath, normalizePath } from "./utils/navigation";
import { buildTopbarSectionLinks } from "./utils/portalView";
import { readRememberSessionPreference, readStorageValue } from "./utils/storage";

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [registerForm, setRegisterForm] = useState({ netId: "", password: "" });
  const [loginForm, setLoginForm] = useState({ netId: "", password: "" });
  const [rememberSession, setRememberSession] = useState(readRememberSessionPreference);
  const [token, setToken] = useState(() => readStorageValue(TOKEN_STORAGE_KEY));
  const [activeNetId, setActiveNetId] = useState(() =>
    initialNetIdFromStorage(TOKEN_STORAGE_KEY, NETID_STORAGE_KEY)
  );
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
  const [activeSectionId, setActiveSectionId] = useState("");
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
  const [documentUploadForm, setDocumentUploadForm] = useState({
    requestId: "",
    file: null
  });
  const [requestAttachmentList, setRequestAttachmentList] = useState([]);
  const [attachmentsRequestId, setAttachmentsRequestId] = useState(() =>
    readStorageValue(ATTACHMENTS_REQUEST_STORAGE_KEY)
  );
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  const [activeAttachmentId, setActiveAttachmentId] = useState("");
  const [myRequestFilter, setMyRequestFilter] = useState("ALL");
  const [myRequestSearch, setMyRequestSearch] = useState("");
  const [requestLookupForm, setRequestLookupForm] = useState(() => ({
    requestId: readStorageValue(ATTACHMENTS_REQUEST_STORAGE_KEY)
  }));
  const [requestEditForm, setRequestEditForm] = useState({
    requestId: "",
    contractId: "",
    requestBody: "",
    startDate: "",
    numberOfDays: ""
  });
  const [myRequests, setMyRequests] = useState([]);
  const [isMyRequestsLoading, setIsMyRequestsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [currentContractData, setCurrentContractData] = useState(null);
  const [requestStats, setRequestStats] = useState({
    total: 0,
    open: 0,
    approved: 0,
    rejected: 0,
    latest: null
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
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

  const activeRoute = useMemo(() => findPortalRoute(currentPath, PORTAL_ROUTES), [currentPath]);
  const isMeRoute = activeRoute?.id === "me";
  const isRequestsRoute = activeRoute?.id === "requests";
  const isAdminRoute = activeRoute?.id === "admin";
  const topbarSectionLinks = useMemo(
    () => buildTopbarSectionLinks({ isMeRoute, isRequestsRoute, isAdminRoute, isAdmin }),
    [isAdmin, isAdminRoute, isMeRoute, isRequestsRoute]
  );

  useEffect(() => {
    const firstSection = topbarSectionLinks[0]?.id || "";
    setActiveSectionId(firstSection);
  }, [currentPath, topbarSectionLinks]);

  const filteredMyRequests = useMemo(() => {
    const search = myRequestSearch.trim().toLowerCase();
    return myRequests.filter((requestItem) => {
      const status = String(requestItem.requestStatus || "").toUpperCase();
      const statusMatches = myRequestFilter === "ALL" || status === myRequestFilter;
      if (!statusMatches) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        requestItem.id,
        requestItem.contractId,
        requestItem.requestBody,
        requestItem.requestStatus
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [myRequests, myRequestFilter, myRequestSearch]);

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

    const route = findPortalRoute(normalizedPath, PORTAL_ROUTES);
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

  const saveAttachmentRequestId = (requestId) => {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedId = String(requestId || "").trim();
    if (!normalizedId) {
      window.localStorage.removeItem(ATTACHMENTS_REQUEST_STORAGE_KEY);
      window.sessionStorage.removeItem(ATTACHMENTS_REQUEST_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ATTACHMENTS_REQUEST_STORAGE_KEY, normalizedId);
    window.sessionStorage.setItem(ATTACHMENTS_REQUEST_STORAGE_KEY, normalizedId);
  };

  const saveSession = (nextToken, suggestedNetId = "", persistSession = rememberSession) => {
    const { resolvedNetId, resolvedRole } = resolveSessionIdentity(nextToken, suggestedNetId);

    setToken(nextToken);
    setActiveNetId(resolvedNetId);
    setActiveRole(resolvedRole);

    persistSessionState({
      nextToken,
      resolvedNetId,
      persistSession,
      tokenStorageKey: TOKEN_STORAGE_KEY,
      netIdStorageKey: NETID_STORAGE_KEY,
      rememberSessionKey: REMEMBER_SESSION_KEY
    });

    return { netId: resolvedNetId, role: resolvedRole };
  };

  const clearSession = () => {
    saveSession("", "", rememberSession);
    setActionResults({});
    setRequestsNotice(null);
    setRequestAttachmentList([]);
    setAttachmentsRequestId("");
    saveAttachmentRequestId("");
    setDocumentUploadForm({ requestId: "", file: null });
    setRequestEditForm({
      requestId: "",
      contractId: "",
      requestBody: "",
      startDate: "",
      numberOfDays: ""
    });
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

  useEffect(() => {
    if (!token || !isRequestsRoute) {
      return;
    }

    void loadMyRequests({ silent: true });
  }, [token, isRequestsRoute]);

  useEffect(() => {
    if (!token || !isRequestsRoute || !attachmentsRequestId) {
      return;
    }

    void loadRequestAttachments(attachmentsRequestId, { silent: true });
  }, [token, isRequestsRoute]);

  useEffect(() => {
    const requestId = requestLookupForm.requestId.trim();
    if (!requestId) {
      return;
    }

    setDocumentResponseForm((previous) =>
      previous.requestId === requestId ? previous : { ...previous, requestId }
    );
    setDocumentUploadForm((previous) =>
      previous.requestId === requestId ? previous : { ...previous, requestId }
    );
    setRequestEditForm((previous) =>
      previous.requestId === requestId ? previous : { ...previous, requestId }
    );
  }, [requestLookupForm.requestId]);

  useEffect(() => {
    if (!token || !isMeRoute || !activeNetId) {
      return;
    }

    void loadPersonalDashboard({ silent: true });
  }, [token, isMeRoute, activeNetId]);

  const loadPersonalDashboard = async ({ silent = false } = {}) => {
    if (!token || !activeNetId) {
      return;
    }

    setIsProfileLoading(true);

    try {
      const profileResponse = await apiRequest(
        `/api/user/internal/user/getUserDto/${encodeURIComponent(activeNetId)}`,
        {
          method: "GET",
          token
        }
      );
      const nextProfile = profileResponse.data || null;
      setProfileData(nextProfile);

      const resolvedUserId =
        nextProfile?.id && isUuid(String(nextProfile.id))
          ? String(nextProfile.id)
          : await resolveUserUuid(activeNetId, token);

      const [myRequestsResponse, currentContractResponse] = await Promise.all([
        apiRequest("/api/request/internal/request/mine", {
          method: "GET",
          token
        }),
        apiRequest(`/api/contract/internal/contract/current/employee/${resolvedUserId}`, {
          method: "GET",
          token
        })
      ]);

      const nextRequests = Array.isArray(myRequestsResponse.data) ? myRequestsResponse.data : [];
      setMyRequests(nextRequests);
      setRequestStats(buildRequestStats(nextRequests));
      setCurrentContractData(currentContractResponse.status === 204 ? null : currentContractResponse.data);

      if (!silent) {
        pushActivity("Dashboard refreshed", "Loaded your profile, contract and request summary.", "success");
      }
    } catch (error) {
      const message = formatApiError(error);
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message
        });
      }
      pushActivity("Dashboard refresh failed", message, "error");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const loadMyRequests = async ({ silent = false } = {}) => {
    if (!token) {
      return;
    }

    setIsMyRequestsLoading(true);
    if (!silent) {
      setRequestsNotice(null);
    }

    try {
      const response = await apiRequest("/api/request/internal/request/mine", {
        method: "GET",
        token
      });

      const requests = Array.isArray(response.data) ? response.data : [];
      setMyRequests(requests);
      setRequestStats(buildRequestStats(requests));

      if (!silent) {
        setRequestsNotice({
          type: "success",
          message: requests.length === 0
            ? "No requests found for your account yet."
            : `Loaded ${requests.length} request${requests.length === 1 ? "" : "s"}.`
        });
        pushActivity("My requests loaded", `Fetched ${requests.length} request(s).`, "success");
      }
    } catch (error) {
      const message = formatApiError(error);
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message
        });
      }
      pushActivity("My requests failed", message, "error");
    } finally {
      setIsMyRequestsLoading(false);
    }
  };

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
      const actionFeedback = buildPortalActionFeedback(action, response);
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "success",
          message: actionFeedback.resultMessage,
          details: actionFeedback.details || []
        }
      }));
      setRequestsNotice({
        type: "success",
        message: actionFeedback.noticeMessage,
        details: actionFeedback.details || []
      });
      pushActivity(action.label, actionFeedback.activityDetail, "success");
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
            setDocumentUploadForm((previous) => ({ ...previous, requestId, file: null }));
            setRequestEditForm({
              requestId,
              contractId: createUserRequestForm.contractId.trim(),
              requestBody: createUserRequestForm.requestBody.trim(),
              startDate: createUserRequestForm.startDate,
              numberOfDays: createUserRequestForm.numberOfDays
            });
          }
          setCreateUserRequestForm((previous) => ({
            ...previous,
            requestBody: "",
            startDate: "",
            numberOfDays: ""
          }));
          void loadMyRequests({ silent: true });
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
            setDocumentUploadForm((previous) => ({ ...previous, requestId, file: null }));
            setRequestEditForm((previous) => ({
              ...previous,
              requestId
            }));
          }
          void loadMyRequests({ silent: true });
        }
      }
    );
  };

  const loadCurrentUserContract = async () => {
    const normalizedNetId = activeNetId.trim();
    if (!normalizedNetId) {
      setRequestsNotice({
        type: "error",
        message: "No active user in session. Please sign in again."
      });
      return;
    }

    await runTask(
      "load-current-contract",
      "Load my current contract",
      async () => {
        const employeeId = await resolveUserUuid(normalizedNetId, token);
        return apiRequest(`/api/contract/internal/contract/current/employee/${employeeId}`, {
          method: "GET",
          token
        });
      },
      {
        successMessage: (response) => {
          if (response.status === 204) {
            return "No contract found for your profile yet. Ask HR/Admin to create one first.";
          }
          const contractId = response.data?.id;
          if (contractId) {
            return `Current contract loaded (${contractId}). Fields were auto-filled.`;
          }
          return `Current contract loaded successfully (HTTP ${response.status}).`;
        },
        successActivity: (response) => {
          const contractId = response.data?.id;
          if (contractId) {
            return `Loaded contract ${contractId}.`;
          }
          return `Success (${response.status}).`;
        },
        onSuccess: (response) => {
          if (response.status === 204) {
            setCreateUserRequestForm((previous) => ({
              ...previous,
              contractId: ""
            }));
            setContractUpdateRequestForm((previous) => ({
              ...previous,
              contractId: "",
              hoursPerWeek: "",
              vacationDays: "",
              salaryScalePoint: "",
              jobPosition: "",
              benefits: "",
              startDate: "",
              endDate: ""
            }));
            return;
          }
          const contract = response.data || {};
          const terms = contract.contractTerms || {};
          const contractId = contract.id ? String(contract.id) : "";
          const benefitsText = Array.isArray(contract.benefits) ? contract.benefits.join(", ") : "";
          const jobName =
            typeof contract.jobPosition?.name === "string"
              ? contract.jobPosition.name
              : "";

          setCreateUserRequestForm((previous) => ({
            ...previous,
            contractId
          }));

          setContractUpdateRequestForm((previous) => ({
            ...previous,
            contractId,
            hoursPerWeek:
              terms.hoursPerWeek === null || terms.hoursPerWeek === undefined
                ? ""
                : String(terms.hoursPerWeek),
            vacationDays:
              terms.vacationDays === null || terms.vacationDays === undefined
                ? ""
                : String(terms.vacationDays),
            salaryScalePoint:
              terms.salaryScalePoint === null || terms.salaryScalePoint === undefined
                ? ""
                : String(terms.salaryScalePoint),
            jobPosition: jobName,
            benefits: benefitsText,
            startDate: normalizeDateForInput(terms.startDate),
            endDate: normalizeDateForInput(terms.endDate)
          }));
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

  const loadRequestAttachments = async (requestIdInput, { silent = false } = {}) => {
    const requestId = String(requestIdInput || "").trim();
    if (!requestId) {
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message: "Enter a request number first to load attachments."
        });
      }
      return;
    }
    if (!isUuid(requestId)) {
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message: "Request number must be a valid UUID."
        });
      }
      return;
    }

    setIsAttachmentsLoading(true);
    try {
      const response = await apiRequest(`/api/request/internal/request/${requestId}/attachments`, {
        method: "GET",
        token
      });
      const attachments = Array.isArray(response.data) ? response.data : [];
      setAttachmentsRequestId(requestId);
      saveAttachmentRequestId(requestId);
      setRequestAttachmentList(attachments);
      setRequestLookupForm((previous) =>
        previous.requestId === requestId ? previous : { requestId }
      );
      setDocumentUploadForm((previous) =>
        previous.requestId === requestId ? previous : { ...previous, requestId }
      );
      if (!silent) {
        setRequestsNotice({
          type: "success",
          message:
            attachments.length === 0
              ? "No PDF attachments for this request yet."
              : `Loaded ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}.`
        });
      }
    } catch (error) {
      const message = formatApiError(error);
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message
        });
        pushActivity("Load attachments failed", message, "error");
      }
    } finally {
      setIsAttachmentsLoading(false);
    }
  };

  const uploadRequestAttachment = async (event) => {
    event.preventDefault();
    const requestId = documentUploadForm.requestId.trim();
    if (!requestId || !isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Provide a valid request UUID before uploading."
      });
      return;
    }

    const fileValidationMessage = validatePdfUpload(documentUploadForm.file);
    if (fileValidationMessage) {
      setRequestsNotice({
        type: "error",
        message: fileValidationMessage
      });
      return;
    }

    const formData = createMultipartFilePayload(documentUploadForm.file);

    await runTask(
      "upload-request-attachment",
      "Upload request document",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}/attachments`, {
          method: "POST",
          rawBody: formData,
          token
        }),
      {
        successMessage: (response) => {
          const name = response.data?.fileName;
          return name
            ? `Uploaded ${name} successfully.`
            : `Attachment uploaded successfully (HTTP ${response.status}).`;
        },
        onSuccess: () => {
          setDocumentUploadForm((previous) => ({
            ...previous,
            file: null
          }));
          void loadRequestAttachments(requestId, { silent: true });
        }
      }
    );
  };

  const downloadRequestAttachment = async (attachment) => {
    const attachmentId = attachment?.id;
    if (!attachmentId) {
      return;
    }

    setActiveAttachmentId(attachmentId);
    try {
      const response = await apiRequest(`/api/request/internal/request/attachments/${attachmentId}`, {
        method: "GET",
        token,
        headers: { Accept: "application/pdf" },
        responseType: "blob"
      });

      const blob = response.data;
      const fileName = sanitizeFileNameForDownload(attachment.fileName, `request-${attachment.requestId}.pdf`);
      triggerFileDownload(blob, fileName);
    } catch (error) {
      const message = formatApiError(error);
      setRequestsNotice({
        type: "error",
        message
      });
      pushActivity("Download attachment failed", message, "error");
    } finally {
      setActiveAttachmentId("");
    }
  };

  const deleteRequestAttachment = async (attachmentId) => {
    if (!attachmentId) {
      return;
    }

    await runTask(
      `delete-request-attachment-${attachmentId}`,
      "Delete attachment",
      () =>
        apiRequest(`/api/request/internal/request/attachments/${attachmentId}`, {
          method: "DELETE",
          token
        }),
      {
        onSuccess: () => {
          if (attachmentsRequestId) {
            void loadRequestAttachments(attachmentsRequestId, { silent: true });
          }
        }
      }
    );
  };

  const updateOwnRequest = async (event) => {
    event.preventDefault();
    const requestId = requestEditForm.requestId.trim();
    if (!requestId || !isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Provide a valid request UUID before updating."
      });
      return;
    }

    const payload = {};
    if (requestEditForm.requestBody.trim()) {
      payload.requestBody = requestEditForm.requestBody.trim();
    }
    if (requestEditForm.contractId.trim()) {
      if (!isUuid(requestEditForm.contractId.trim())) {
        setRequestsNotice({
          type: "error",
          message: "Contract ID must be a valid UUID."
        });
        return;
      }
      payload.contractId = requestEditForm.contractId.trim();
    }
    if (requestEditForm.startDate) {
      payload.startDate = `${requestEditForm.startDate}T09:00:00`;
    }
    if (requestEditForm.numberOfDays !== "") {
      const parsed = Number(requestEditForm.numberOfDays);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setRequestsNotice({
          type: "error",
          message: "Number of days must be a whole number >= 0."
        });
        return;
      }
      payload.numberOfDays = parsed;
    }

    if (Object.keys(payload).length === 0) {
      setRequestsNotice({
        type: "error",
        message: "Provide at least one field to update."
      });
      return;
    }

    await runTask(
      "update-own-request",
      "Update my request",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}`, {
          method: "PUT",
          body: payload,
          token
        }),
      {
        onSuccess: () => {
          void loadMyRequests({ silent: true });
        }
      }
    );
  };

  const cancelOwnRequest = async (requestIdInput) => {
    const requestId = String(requestIdInput || "").trim();
    if (!requestId || !isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Provide a valid request UUID before cancelling."
      });
      return;
    }

    await runTask(
      "cancel-own-request",
      "Cancel my request",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}`, {
          method: "DELETE",
          token
        }),
      {
        onSuccess: () => {
          void loadMyRequests({ silent: true });
          setRequestAttachmentList([]);
          setAttachmentsRequestId("");
        }
      }
    );
  };

  const openRequestWorkspaceContext = (requestItem) => {
    const requestId = String(requestItem?.id || "");
    if (!requestId) {
      return;
    }

    setRequestLookupForm({ requestId });
    setDocumentResponseForm((previous) => ({ ...previous, requestId }));
    setDocumentUploadForm((previous) => ({ ...previous, requestId, file: null }));
    setRequestEditForm({
      requestId,
      contractId: requestItem?.contractId ? String(requestItem.contractId) : "",
      requestBody: requestItem?.requestBody || "",
      startDate: normalizeDateForInput(requestItem?.startDate),
      numberOfDays:
        requestItem?.numberOfDays === null || requestItem?.numberOfDays === undefined
          ? ""
          : String(requestItem.numberOfDays)
    });

    void loadRequestAttachments(requestId, { silent: true });
  };

  if (!token) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        rememberSession={rememberSession}
        setRememberSession={setRememberSession}
        isLoginLoading={isLoginLoading}
        isRegisterLoading={isRegisterLoading}
        login={login}
        registerFromAuth={registerFromAuth}
        authNotice={authNotice}
      />
    );
  }

  return (
    <main className="portal-layout">
      <PortalSidebar
        activeNetId={activeNetId}
        isAdmin={isAdmin}
        sidebarGroups={sidebarGroups}
        currentPath={currentPath}
        navigate={navigate}
        clearSession={clearSession}
      />

      <section className="portal-main">
        <PageTopbar
          activeRoute={activeRoute}
          sectionLinks={topbarSectionLinks}
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
        />

        {isMeRoute && (
          <MePage
            profileData={profileData}
            activeNetId={activeNetId}
            isAdmin={isAdmin}
            currentContractData={currentContractData}
            requestStats={requestStats}
            isProfileLoading={isProfileLoading}
            formatEnumLabel={formatEnumLabel}
            toLocaleDateTime={toLocaleDateTime}
            loadPersonalDashboard={loadPersonalDashboard}
            navigate={navigate}
            activeSectionId={activeSectionId}
          />
        )}

        {isRequestsRoute && (
          <RequestsPage
            isAdmin={isAdmin}
            runPortalAction={runPortalAction}
            portalActions={PORTAL_ACTIONS}
            activeActionId={activeActionId}
            submitUserRequest={submitUserRequest}
            createUserRequestForm={createUserRequestForm}
            setCreateUserRequestForm={setCreateUserRequestForm}
            loadCurrentUserContract={loadCurrentUserContract}
            activeTaskId={activeTaskId}
            requestContractUpdate={requestContractUpdate}
            contractUpdateRequestForm={contractUpdateRequestForm}
            setContractUpdateRequestForm={setContractUpdateRequestForm}
            checkRequestStatus={checkRequestStatus}
            requestLookupForm={requestLookupForm}
            setRequestLookupForm={setRequestLookupForm}
            loadRequestAttachments={loadRequestAttachments}
            isAttachmentsLoading={isAttachmentsLoading}
            updateOwnRequest={updateOwnRequest}
            requestEditForm={requestEditForm}
            setRequestEditForm={setRequestEditForm}
            uploadRequestAttachment={uploadRequestAttachment}
            documentUploadForm={documentUploadForm}
            setDocumentUploadForm={setDocumentUploadForm}
            respondToDocumentRequest={respondToDocumentRequest}
            documentResponseForm={documentResponseForm}
            setDocumentResponseForm={setDocumentResponseForm}
            requestAttachmentList={requestAttachmentList}
            attachmentsRequestId={attachmentsRequestId}
            formatFileSize={formatFileSize}
            toLocaleDateTime={toLocaleDateTime}
            activeAttachmentId={activeAttachmentId}
            downloadRequestAttachment={downloadRequestAttachment}
            deleteRequestAttachment={deleteRequestAttachment}
            requestsNotice={requestsNotice}
            approveRequest={approveRequest}
            approveRequestForm={approveRequestForm}
            setApproveRequestForm={setApproveRequestForm}
            createContract={createContract}
            createContractForm={createContractForm}
            setCreateContractForm={setCreateContractForm}
            contractTypes={CONTRACT_TYPES}
            userRoles={USER_ROLES}
            formatEnumLabel={formatEnumLabel}
            isAllowedContractStartDate={isAllowedContractStartDate}
            updateUserProfile={updateUserProfile}
            updateProfileForm={updateProfileForm}
            setUpdateProfileForm={setUpdateProfileForm}
            rejectRequest={rejectRequest}
            rejectRequestForm={rejectRequestForm}
            setRejectRequestForm={setRejectRequestForm}
            requestEmployeeDocument={requestEmployeeDocument}
            documentRequestForm={documentRequestForm}
            setDocumentRequestForm={setDocumentRequestForm}
            terminateContract={terminateContract}
            terminateContractForm={terminateContractForm}
            setTerminateContractForm={setTerminateContractForm}
            createSalaryScale={createSalaryScale}
            salaryScaleForm={salaryScaleForm}
            setSalaryScaleForm={setSalaryScaleForm}
            createJobPositionCatalog={createJobPositionCatalog}
            jobPositionCatalogForm={jobPositionCatalogForm}
            setJobPositionCatalogForm={setJobPositionCatalogForm}
            createPensionScheme={createPensionScheme}
            pensionSchemeForm={pensionSchemeForm}
            setPensionSchemeForm={setPensionSchemeForm}
            loadMyRequests={loadMyRequests}
            isMyRequestsLoading={isMyRequestsLoading}
            myRequestFilter={myRequestFilter}
            setMyRequestFilter={setMyRequestFilter}
            myRequestSearch={myRequestSearch}
            setMyRequestSearch={setMyRequestSearch}
            filteredMyRequests={filteredMyRequests}
            getRequestGuidance={getRequestGuidance}
            openRequestWorkspaceContext={openRequestWorkspaceContext}
            cancelOwnRequest={cancelOwnRequest}
            activeSectionId={activeSectionId}
          />
        )}

        {isAdminRoute && (
          <AdminPage
            isAdmin={isAdmin}
            registerFromAdmin={registerFromAdmin}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            isRegisterLoading={isRegisterLoading}
            adminNotice={adminNotice}
            adminActions={adminActions}
            actionResults={actionResults}
            runPortalAction={runPortalAction}
            activeActionId={activeActionId}
            contractLookupForm={contractLookupForm}
            setContractLookupForm={setContractLookupForm}
            lookupContract={lookupContract}
            activeTaskId={activeTaskId}
            deleteContractForm={deleteContractForm}
            setDeleteContractForm={setDeleteContractForm}
            deleteContract={deleteContract}
            salaryScaleUpdateForm={salaryScaleUpdateForm}
            setSalaryScaleUpdateForm={setSalaryScaleUpdateForm}
            updateSalaryScaleRange={updateSalaryScaleRange}
            renameJobPosition={renameJobPosition}
            renameJobPositionForm={renameJobPositionForm}
            setRenameJobPositionForm={setRenameJobPositionForm}
            renamePensionScheme={renamePensionScheme}
            renamePensionSchemeForm={renamePensionSchemeForm}
            setRenamePensionSchemeForm={setRenamePensionSchemeForm}
            deleteCatalogEntity={deleteCatalogEntity}
            deleteCatalogForm={deleteCatalogForm}
            setDeleteCatalogForm={setDeleteCatalogForm}
            activeSectionId={activeSectionId}
          />
        )}

        {activeSectionId === "recent-activity" && (
          <section id="recent-activity" className="panel activity-panel">
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
        )}
      </section>
    </main>
  );
}
