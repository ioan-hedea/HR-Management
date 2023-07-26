import { formatRequestBodySummary } from "../../utils/formatters";

export default function RequestSummaryCard({
  requestStats,
  formatEnumLabel,
  toLocaleDateTime,
  loadPersonalDashboard,
  isProfileLoading,
  navigate
}) {
  return (
    <article id="me-summary" className="panel">
      <h2>Request summary</h2>
      <p className="helper-text">
        Quick status of your submitted requests and next actions.
      </p>
      <div className="form-two-col">
        <div className="action-item">
          <p className="activity-title">Total</p>
          <p className="activity-detail">{requestStats.total}</p>
        </div>
        <div className="action-item">
          <p className="activity-title">Open</p>
          <p className="activity-detail">{requestStats.open}</p>
        </div>
        <div className="action-item">
          <p className="activity-title">Approved</p>
          <p className="activity-detail">{requestStats.approved}</p>
        </div>
        <div className="action-item">
          <p className="activity-title">Rejected</p>
          <p className="activity-detail">{requestStats.rejected}</p>
        </div>
      </div>
      {requestStats.latest && (
        <div className="response-area friendly">
          <p className="activity-title">
            Latest: {formatEnumLabel(requestStats.latest.requestStatus || "OPEN")}
          </p>
          <p className="activity-detail">
            {formatRequestBodySummary(requestStats.latest.requestBody)}
          </p>
          <p className="activity-time">Created: {toLocaleDateTime(requestStats.latest.requestDate)}</p>
        </div>
      )}
      <div className="stack" style={{ marginTop: "0.7rem" }}>
        <button
          type="button"
          className="ghost"
          onClick={() => void loadPersonalDashboard()}
          disabled={isProfileLoading}
        >
          {isProfileLoading ? "Refreshing..." : "Refresh personal data"}
        </button>
        <button type="button" onClick={() => navigate("/portal/requests")}>
          Open requests workspace
        </button>
      </div>
    </article>
  );
}
