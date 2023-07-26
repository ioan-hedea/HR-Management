export const PORTAL_ACTIONS = [
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

export const PORTAL_ROUTES = [
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

export const SIDEBAR_GROUPS = [
  { id: "workspace", label: "Workspace" },
  { id: "administration", label: "Administration" }
];

export const USER_ROLES = ["CANDIDATE", "EMPLOYEE", "HR", "ADMIN", "FIRED"];
export const CONTRACT_TYPES = ["TEMPORARY", "PART_TIME", "FULL_TIME"];
