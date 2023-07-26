export default function EmployeeTaskModules({
  submitUserRequest,
  createUserRequestForm,
  setCreateUserRequestForm,
  loadCurrentUserContract,
  activeTaskId,
  requestContractUpdate,
  contractUpdateRequestForm,
  setContractUpdateRequestForm,
  checkRequestStatus,
  requestLookupForm,
  setRequestLookupForm,
  loadRequestAttachments,
  isAttachmentsLoading,
  updateOwnRequest,
  requestEditForm,
  setRequestEditForm,
  uploadRequestAttachment,
  documentUploadForm,
  setDocumentUploadForm,
  respondToDocumentRequest,
  documentResponseForm,
  setDocumentResponseForm
}) {
  return (
<section id="requests-modules" className="task-modules">
  <h3>Employee task modules</h3>
  <p className="helper-text">
    Submit, update, and track your own requests using guided forms.
  </p>

  <div className="task-grid">
    <article className="task-card">
      <h4>Submit HR request</h4>
      <form className="stack" onSubmit={submitUserRequest}>
        <label>
          Contract ID (optional)
          <input
            value={createUserRequestForm.contractId}
            onChange={(event) =>
              setCreateUserRequestForm((previous) => ({
                ...previous,
                contractId: event.target.value
              }))
            }
            placeholder="UUID if this request is contract-related"
          />
        </label>
        <label>
          Request details
          <textarea
            className="compact-textarea"
            rows={4}
            value={createUserRequestForm.requestBody}
            onChange={(event) =>
              setCreateUserRequestForm((previous) => ({
                ...previous,
                requestBody: event.target.value
              }))
            }
            placeholder="Describe what you need from HR"
            required
          />
        </label>
        <div className="form-two-col">
          <label>
            Requested start date (optional)
            <input
              type="date"
              value={createUserRequestForm.startDate}
              onChange={(event) =>
                setCreateUserRequestForm((previous) => ({
                  ...previous,
                  startDate: event.target.value
                }))
              }
            />
          </label>
          <label>
            Number of days (optional)
            <input
              type="number"
              min="1"
              value={createUserRequestForm.numberOfDays}
              onChange={(event) =>
                setCreateUserRequestForm((previous) => ({
                  ...previous,
                  numberOfDays: event.target.value
                }))
              }
            />
          </label>
        </div>
        <button type="submit" disabled={activeTaskId === "submit-user-request"}>
          {activeTaskId === "submit-user-request"
            ? "Submitting..."
            : "Submit HR request"}
        </button>
      </form>
    </article>

    <article className="task-card">
      <h4>Request contract update</h4>
      <p className="helper-text">
        Load your current contract first, then adjust only what you want to change.
      </p>
      <button
        type="button"
        className="ghost"
        onClick={loadCurrentUserContract}
        disabled={activeTaskId === "load-current-contract"}
      >
        {activeTaskId === "load-current-contract"
          ? "Loading contract..."
          : "Load my current contract"}
      </button>
      <form className="stack" onSubmit={requestContractUpdate}>
        <label>
          Contract ID
          <input
            value={contractUpdateRequestForm.contractId}
            onChange={(event) =>
              setContractUpdateRequestForm((previous) => ({
                ...previous,
                contractId: event.target.value
              }))
            }
            placeholder="Contract UUID"
            required
          />
        </label>
        <div className="form-two-col">
          <label>
            Hours/week (optional)
            <input
              type="number"
              min="8"
              max="40"
              value={contractUpdateRequestForm.hoursPerWeek}
              onChange={(event) =>
                setContractUpdateRequestForm((previous) => ({
                  ...previous,
                  hoursPerWeek: event.target.value
                }))
              }
            />
          </label>
          <label>
            Vacation days (optional)
            <input
              type="number"
              min="15"
              max="30"
              value={contractUpdateRequestForm.vacationDays}
              onChange={(event) =>
                setContractUpdateRequestForm((previous) => ({
                  ...previous,
                  vacationDays: event.target.value
                }))
              }
            />
          </label>
        </div>
        <div className="form-two-col">
          <label>
            Salary scale point (optional)
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={contractUpdateRequestForm.salaryScalePoint}
              onChange={(event) =>
                setContractUpdateRequestForm((previous) => ({
                  ...previous,
                  salaryScalePoint: event.target.value
                }))
              }
            />
          </label>
          <label>
            Job position (optional)
            <input
              value={contractUpdateRequestForm.jobPosition}
              onChange={(event) =>
                setContractUpdateRequestForm((previous) => ({
                  ...previous,
                  jobPosition: event.target.value
                }))
              }
            />
          </label>
        </div>
        <div className="form-two-col">
          <label>
            New start date (optional)
            <input
              type="date"
              value={contractUpdateRequestForm.startDate}
              onChange={(event) =>
                setContractUpdateRequestForm((previous) => ({
                  ...previous,
                  startDate: event.target.value
                }))
              }
            />
          </label>
          <label>
            New end date (optional)
            <input
              type="date"
              value={contractUpdateRequestForm.endDate}
              onChange={(event) =>
                setContractUpdateRequestForm((previous) => ({
                  ...previous,
                  endDate: event.target.value
                }))
              }
            />
          </label>
        </div>
        <label>
          Benefits update (optional, comma separated)
          <input
            value={contractUpdateRequestForm.benefits}
            onChange={(event) =>
              setContractUpdateRequestForm((previous) => ({
                ...previous,
                benefits: event.target.value
              }))
            }
            placeholder="Meal vouchers, Transport"
          />
        </label>
        <button type="submit" disabled={activeTaskId === "contract-update-request"}>
          {activeTaskId === "contract-update-request"
            ? "Submitting..."
            : "Request contract update"}
        </button>
      </form>
    </article>

    <article className="task-card">
      <h4>Track request status</h4>
      <form className="stack" onSubmit={checkRequestStatus}>
        <label>
          Request number
          <input
            value={requestLookupForm.requestId}
            onChange={(event) =>
              setRequestLookupForm({ requestId: event.target.value })
            }
            placeholder="Paste your request UUID"
            required
          />
        </label>
        <button type="submit" disabled={activeTaskId === "request-status"}>
          {activeTaskId === "request-status"
            ? "Checking..."
            : "Check request status"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => void loadRequestAttachments(requestLookupForm.requestId)}
          disabled={isAttachmentsLoading}
        >
          {isAttachmentsLoading ? "Loading..." : "Load attachments"}
        </button>
      </form>
    </article>

    <article className="task-card">
      <h4>Update my open request</h4>
      <form className="stack" onSubmit={updateOwnRequest}>
        <label>
          Request number
          <input
            value={requestEditForm.requestId}
            onChange={(event) =>
              setRequestEditForm((previous) => ({
                ...previous,
                requestId: event.target.value
              }))
            }
            placeholder="UUID of your OPEN request"
            required
          />
        </label>
        <label>
          Contract ID (optional)
          <input
            value={requestEditForm.contractId}
            onChange={(event) =>
              setRequestEditForm((previous) => ({
                ...previous,
                contractId: event.target.value
              }))
            }
            placeholder="Contract UUID"
          />
        </label>
        <label>
          Updated request details (optional)
          <textarea
            className="compact-textarea"
            rows={4}
            value={requestEditForm.requestBody}
            onChange={(event) =>
              setRequestEditForm((previous) => ({
                ...previous,
                requestBody: event.target.value
              }))
            }
            placeholder="Change the message sent to HR"
          />
        </label>
        <div className="form-two-col">
          <label>
            New start date (optional)
            <input
              type="date"
              value={requestEditForm.startDate}
              onChange={(event) =>
                setRequestEditForm((previous) => ({
                  ...previous,
                  startDate: event.target.value
                }))
              }
            />
          </label>
          <label>
            Number of days (optional)
            <input
              type="number"
              min="0"
              value={requestEditForm.numberOfDays}
              onChange={(event) =>
                setRequestEditForm((previous) => ({
                  ...previous,
                  numberOfDays: event.target.value
                }))
              }
            />
          </label>
        </div>
        <button type="submit" disabled={activeTaskId === "update-own-request"}>
          {activeTaskId === "update-own-request"
            ? "Updating..."
            : "Update my request"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => void cancelOwnRequest(requestEditForm.requestId)}
          disabled={activeTaskId === "cancel-own-request"}
        >
          {activeTaskId === "cancel-own-request"
            ? "Cancelling..."
            : "Cancel this open request"}
        </button>
      </form>
    </article>

    <article className="task-card">
      <h4>Upload supporting PDF</h4>
      <form className="stack" onSubmit={uploadRequestAttachment}>
        <label>
          Request number
          <input
            value={documentUploadForm.requestId}
            onChange={(event) =>
              setDocumentUploadForm((previous) => ({
                ...previous,
                requestId: event.target.value
              }))
            }
            placeholder="UUID from HR request"
            required
          />
        </label>
        <label>
          PDF file
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) =>
              setDocumentUploadForm((previous) => ({
                ...previous,
                file: event.target.files?.[0] || null
              }))
            }
            required
          />
        </label>
        <button type="submit" disabled={activeTaskId === "upload-request-attachment"}>
          {activeTaskId === "upload-request-attachment"
            ? "Uploading..."
            : "Upload PDF"}
        </button>
      </form>
    </article>

    <article className="task-card">
      <h4>Submit requested document note</h4>
      <form className="stack" onSubmit={respondToDocumentRequest}>
        <label>
          Request number
          <input
            value={documentResponseForm.requestId}
            onChange={(event) =>
              setDocumentResponseForm((previous) => ({
                ...previous,
                requestId: event.target.value
              }))
            }
            placeholder="UUID from HR request"
            required
          />
        </label>
        <label>
          Your response
          <textarea
            className="compact-textarea"
            rows={4}
            value={documentResponseForm.responseBody}
            onChange={(event) =>
              setDocumentResponseForm((previous) => ({
                ...previous,
                responseBody: event.target.value
              }))
            }
            placeholder="Add details for HR (context, references, notes)"
            required
          />
        </label>
        <button type="submit" disabled={activeTaskId === "document-response"}>
          {activeTaskId === "document-response"
            ? "Sending..."
            : "Send document note"}
        </button>
      </form>
    </article>
  </div>
</section>
  );
}
