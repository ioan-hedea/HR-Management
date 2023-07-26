export default function AdminOverviewSection({
  registerFromAdmin,
  registerForm,
  setRegisterForm,
  isRegisterLoading,
  adminNotice,
  adminActions,
  actionResults,
  runPortalAction,
  activeActionId
}) {
  return (
  <section id="admin-overview" className="portal-grid">
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
                  {Array.isArray(result.details) && result.details.length > 0 && (
                    <ul className="status-details">
                      {result.details.map((detail, index) => (
                        <li key={`${index}-${detail}`}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </article>
  </section>
  );
}
