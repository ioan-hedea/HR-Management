export default function RequestsActionStatusPanel({ requestsNotice }) {
  const hasDetails =
    Array.isArray(requestsNotice?.details) && requestsNotice.details.length > 0;

  return (
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
  {hasDetails && (
    <ul className="status-details">
      {requestsNotice.details.map((detail, index) => (
        <li key={`${index}-${detail}`}>{detail}</li>
      ))}
    </ul>
  )}
</div>

  );
}
