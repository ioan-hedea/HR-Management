export default function PageTopbar({
  activeRoute,
  sectionLinks = [],
  activeSectionId = "",
  onSelectSection
}) {
  const routePath = activeRoute?.path || "/portal/me";
  const routeTitle = activeRoute?.title || "Portal";
  const routeDescription = activeRoute?.description || "Role-aware workspace for HR operations.";

  return (
    <header className="portal-header">
      <div className="portal-header-main">
        <p className="route-kicker">{routePath}</p>
        <h1>{routeTitle}</h1>
        <p>{routeDescription}</p>
      </div>

      {sectionLinks.length > 0 && (
        <nav className="page-topnav" aria-label="Page sections">
          {sectionLinks.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`topnav-chip ${activeSectionId === section.id ? "active" : ""}`}
              onClick={() => onSelectSection?.(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
