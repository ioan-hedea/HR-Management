export function buildTopbarSectionLinks({ isMeRoute, isRequestsRoute, isAdminRoute, isAdmin }) {
  if (isMeRoute) {
    return [
      { id: "me-profile", label: "Profile" },
      { id: "me-contract", label: "Contract" },
      { id: "me-summary", label: "Summary" },
      { id: "recent-activity", label: "Activity" }
    ];
  }

  if (isRequestsRoute) {
    const links = [{ id: "requests-console", label: "Console" }];
    if (isAdmin) {
      links.push({ id: "requests-admin-console", label: "Admin Console" });
    }
    links.push({ id: "requests-modules", label: "Employee Tasks" });
    if (isAdmin) {
      links.push({ id: "requests-hr-modules", label: "HR Task Modules" });
    }
    links.push({ id: "my-requests", label: "My Requests" });
    links.push({ id: "recent-activity", label: "Activity" });
    return links;
  }

  if (isAdminRoute) {
    return [
      { id: "admin-overview", label: "Overview" },
      { id: "admin-operations", label: "Operations" },
      { id: "recent-activity", label: "Activity" }
    ];
  }

  return [];
}
