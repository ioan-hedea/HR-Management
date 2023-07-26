import { formatRequestBodySummary } from "../../utils/formatters";

export default function MyRequestsPanel({
  loadMyRequests,
  isMyRequestsLoading,
  myRequestFilter,
  setMyRequestFilter,
  myRequestSearch,
  setMyRequestSearch,
  filteredMyRequests,
  formatEnumLabel,
  getRequestGuidance,
  toLocaleDateTime,
  openRequestWorkspaceContext,
  cancelOwnRequest,
  activeTaskId
}) {
  return (
<section id="my-requests" className="panel activity-panel">
  <h3>My requests</h3>
  <p className="helper-text">
    See all requests you submitted and what action is needed next.
  </p>
  <button
    type="button"
    className="ghost"
    onClick={() => void loadMyRequests()}
    disabled={isMyRequestsLoading}
  >
    {isMyRequestsLoading ? "Refreshing..." : "Refresh my requests"}
  </button>
  <div className="form-two-col" style={{ marginTop: "0.65rem" }}>
    <label>
      Filter by status
      <select
        value={myRequestFilter}
        onChange={(event) => setMyRequestFilter(event.target.value)}
      >
        <option value="ALL">All statuses</option>
        <option value="OPEN">Open</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </label>
    <label>
      Search requests
      <input
        value={myRequestSearch}
        onChange={(event) => setMyRequestSearch(event.target.value)}
        placeholder="Search by UUID, text or contract"
      />
    </label>
  </div>
  <div className="activity-feed">
    {filteredMyRequests.length === 0 ? (
      <p className="helper-text">No requests yet.</p>
    ) : (
      filteredMyRequests.map((requestItem) => {
        const statusText = formatEnumLabel(requestItem.requestStatus || "OPEN");
        const statusClass =
          requestItem.requestStatus === "APPROVED"
            ? "success"
            : requestItem.requestStatus === "REJECTED"
              ? "error"
              : "info";
        return (
          <article
            key={requestItem.id || `${requestItem.requestDate}-${requestItem.requestBody}`}
            className={`activity-item ${statusClass}`}
          >
            <p className="activity-title">{statusText}</p>
            <p className="activity-detail">{getRequestGuidance(requestItem.requestStatus)}</p>
            <p className="activity-detail">
              {formatRequestBodySummary(requestItem.requestBody)}
            </p>
            <p className="activity-time">
              Request ID: {requestItem.id || "-"} | Contract: {requestItem.contractId || "-"}
            </p>
            <p className="activity-time">
              Created: {toLocaleDateTime(requestItem.requestDate)}
            </p>
            <div className="inline-actions" style={{ marginTop: "0.45rem" }}>
              <button
                type="button"
                className="ghost"
                onClick={() => openRequestWorkspaceContext(requestItem)}
              >
                Open in workspace
              </button>
              {String(requestItem.requestStatus || "").toUpperCase() === "OPEN" && (
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() => void cancelOwnRequest(requestItem.id)}
                  disabled={activeTaskId === "cancel-own-request"}
                >
                  {activeTaskId === "cancel-own-request"
                    ? "Cancelling..."
                    : "Cancel"}
                </button>
              )}
            </div>
          </article>
        );
      })
    )}
  </div>
</section>
  );
}
