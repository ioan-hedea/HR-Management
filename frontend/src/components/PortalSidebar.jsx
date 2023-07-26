export default function PortalSidebar({
  activeNetId,
  isAdmin,
  sidebarGroups,
  currentPath,
  navigate,
  clearSession
}) {
  return (
    <aside className="portal-sidebar">
      <div>
        <p className="brand-kicker">HR MANAGEMENT SUITE</p>
        <h2 className="brand-title">User Portal</h2>
      </div>

      <div className="sidebar-session">
        <p className="session-name">{activeNetId || "Unknown user"}</p>
        <p className={`role-badge ${isAdmin ? "admin" : "user"}`}>{isAdmin ? "ADMIN" : "USER"}</p>
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
  );
}
