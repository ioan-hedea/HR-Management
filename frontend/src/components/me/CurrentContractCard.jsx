export default function CurrentContractCard({ currentContractData, formatEnumLabel, toLocaleDateTime }) {
  return (
    <article id="me-contract" className="panel">
      <h2>Current contract</h2>
      <p className="helper-text">
        Latest active contract details used for requests and updates.
      </p>
      {currentContractData ? (
        <div className="response-area friendly">
          <p className="activity-title">{currentContractData.id}</p>
          <p className="activity-detail">
            Status: {formatEnumLabel(currentContractData.contractInfo?.status || "UNKNOWN")}
          </p>
          <p className="activity-detail">
            Type: {formatEnumLabel(currentContractData.contractInfo?.type || "UNKNOWN")}
          </p>
          <p className="activity-detail">
            Job: {currentContractData.jobPosition?.name || "-"}
          </p>
          <p className="activity-detail">
            Hours/week: {currentContractData.contractTerms?.hoursPerWeek ?? "-"} | Vacation days:{" "}
            {currentContractData.contractTerms?.vacationDays ?? "-"}
          </p>
          <p className="activity-detail">
            Start: {toLocaleDateTime(currentContractData.contractTerms?.startDate)} | End:{" "}
            {toLocaleDateTime(currentContractData.contractTerms?.endDate)}
          </p>
          <p className="activity-detail">
            Benefits: {Array.isArray(currentContractData.benefits) && currentContractData.benefits.length > 0
              ? currentContractData.benefits.join(", ")
              : "-"}
          </p>
        </div>
      ) : (
        <p className="helper-text">No contract assigned yet.</p>
      )}
    </article>
  );
}
