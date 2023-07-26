export default function RequestsChecksPanel({
  isAdmin,
  runPortalAction,
  portalActions,
  activeActionId,
  showUserChecks = true,
  showAdminChecks = true
}) {
  return (
<div className="workflow-grid">
  {showUserChecks && (
    <article className="workflow-card">
      <h3>My checks</h3>
      <p className="helper-text">
        Quick actions for your own employee flow.
      </p>
      <div className="stack">
        <button
          type="button"
          onClick={() => runPortalAction(portalActions[0])}
          disabled={activeActionId === portalActions[0].id}
        >
          {activeActionId === portalActions[0].id
            ? "Checking..."
            : "Check contract service"}
        </button>
        <button
          type="button"
          onClick={() => runPortalAction(portalActions[1])}
          disabled={activeActionId === portalActions[1].id}
        >
          {activeActionId === portalActions[1].id
            ? "Checking..."
            : "Check request service"}
        </button>
      </div>
    </article>
  )}

  {isAdmin && showAdminChecks && (
    <article className="workflow-card">
      <h3>HR admin checks</h3>
      <p className="helper-text">
        Internal actions available only to administrators.
      </p>
      <div className="stack">
        <button
          type="button"
          onClick={() => runPortalAction(portalActions[2])}
          disabled={activeActionId === portalActions[2].id}
        >
          {activeActionId === portalActions[2].id
            ? "Loading..."
            : "List all user NetIDs"}
        </button>
        <button
          type="button"
          onClick={() => runPortalAction(portalActions[3])}
          disabled={activeActionId === portalActions[3].id}
        >
          {activeActionId === portalActions[3].id
            ? "Loading..."
            : "View open requests"}
        </button>
      </div>
    </article>
  )}
</div>
  );
}
