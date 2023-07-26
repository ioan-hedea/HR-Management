export default function HrTaskModules({
  isAdmin,
  activeTaskId,
  approveRequest,
  approveRequestForm,
  setApproveRequestForm,
  createContract,
  createContractForm,
  setCreateContractForm,
  contractTypes,
  userRoles,
  formatEnumLabel,
  isAllowedContractStartDate,
  updateUserProfile,
  updateProfileForm,
  setUpdateProfileForm,
  rejectRequest,
  rejectRequestForm,
  setRejectRequestForm,
  requestEmployeeDocument,
  documentRequestForm,
  setDocumentRequestForm,
  terminateContract,
  terminateContractForm,
  setTerminateContractForm,
  createSalaryScale,
  salaryScaleForm,
  setSalaryScaleForm,
  createJobPositionCatalog,
  jobPositionCatalogForm,
  setJobPositionCatalogForm,
  createPensionScheme,
  pensionSchemeForm,
  setPensionSchemeForm,
  requestLookupForm,
  setRequestLookupForm,
  loadRequestAttachments,
  isAttachmentsLoading
}) {
  if (!isAdmin) {
    return null;
  }

  return (
  <section className="task-modules">
    <h3>HR task modules</h3>
    <p className="helper-text">
      Complete business forms instead of calling raw technical endpoints.
    </p>

    <div className="task-grid">
      <article className="task-card">
        <h4>Approve employee request</h4>
        <form className="stack" onSubmit={approveRequest}>
          <label>
            Request number
            <input
              value={approveRequestForm.requestId}
              onChange={(event) =>
                setApproveRequestForm({ requestId: event.target.value })
              }
              placeholder="Paste the request UUID"
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "approve-request"}>
            {activeTaskId === "approve-request"
              ? "Approving..."
              : "Approve employee request"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Create employment contract</h4>
        <form className="stack" onSubmit={createContract}>
          <label>
            Employee (NetID or UUID)
            <input
              value={createContractForm.employeeId}
              onChange={(event) =>
                setCreateContractForm((prev) => ({
                  ...prev,
                  employeeId: event.target.value
                }))
              }
              placeholder="e.g. ioan or user UUID"
              required
            />
          </label>
          <label>
            Employer (NetID or UUID)
            <input
              value={createContractForm.employerId}
              onChange={(event) =>
                setCreateContractForm((prev) => ({
                  ...prev,
                  employerId: event.target.value
                }))
              }
              placeholder="e.g. ADMIN or employer UUID"
              required
            />
          </label>
          <div className="form-two-col">
            <label>
              Contract type
              <select
                value={createContractForm.contractType}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    contractType: event.target.value
                  }))
                }
              >
                {contractTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hours/week
              <input
                type="number"
                min="8"
                max="40"
                value={createContractForm.hoursPerWeek}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    hoursPerWeek: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <div className="form-two-col">
            <label>
              Vacation days
              <input
                type="number"
                min="15"
                max="30"
                value={createContractForm.vacationDays}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    vacationDays: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Salary scale point
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={createContractForm.salaryScalePoint}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    salaryScalePoint: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <div className="form-two-col">
            <label>
              Start date
              <input
                type="date"
                value={createContractForm.startDate}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    startDate: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              End date (optional)
              <input
                type="date"
                value={createContractForm.endDate}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    endDate: event.target.value
                  }))
                }
              />
            </label>
          </div>
          <label>
            Job position
            <input
              value={createContractForm.jobPosition}
              onChange={(event) =>
                setCreateContractForm((prev) => ({
                  ...prev,
                  jobPosition: event.target.value
                }))
              }
              required
            />
          </label>
          <div className="form-three-col">
            <label>
              Min pay
              <input
                type="number"
                min="0"
                value={createContractForm.minimumPay}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    minimumPay: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Max pay
              <input
                type="number"
                min="0"
                value={createContractForm.maximumPay}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    maximumPay: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Scale step
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={createContractForm.salaryStep}
                onChange={(event) =>
                  setCreateContractForm((prev) => ({
                    ...prev,
                    salaryStep: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <label>
            Pension scheme
            <input
              value={createContractForm.pensionScheme}
              onChange={(event) =>
                setCreateContractForm((prev) => ({
                  ...prev,
                  pensionScheme: event.target.value
                }))
              }
              required
            />
          </label>
          <label>
            Benefits (comma separated)
            <input
              value={createContractForm.benefits}
              onChange={(event) =>
                setCreateContractForm((prev) => ({
                  ...prev,
                  benefits: event.target.value
                }))
              }
            />
          </label>
          <button type="submit" disabled={activeTaskId === "create-contract"}>
            {activeTaskId === "create-contract"
              ? "Creating..."
              : "Create employment contract"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Update employee profile</h4>
        <form className="stack" onSubmit={updateUserProfile}>
          <label>
            Employee NetID
            <input
              value={updateProfileForm.netId}
              onChange={(event) =>
                setUpdateProfileForm((prev) => ({
                  ...prev,
                  netId: event.target.value
                }))
              }
              required
            />
          </label>
          <label>
            Role
            <select
              value={updateProfileForm.role}
              onChange={(event) =>
                setUpdateProfileForm((prev) => ({
                  ...prev,
                  role: event.target.value
                }))
              }
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {formatEnumLabel(role)}
                </option>
              ))}
            </select>
          </label>
          <div className="form-two-col">
            <label>
              First name
              <input
                value={updateProfileForm.firstName}
                onChange={(event) =>
                  setUpdateProfileForm((prev) => ({
                    ...prev,
                    firstName: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Last name
              <input
                value={updateProfileForm.lastName}
                onChange={(event) =>
                  setUpdateProfileForm((prev) => ({
                    ...prev,
                    lastName: event.target.value
                  }))
                }
              />
            </label>
          </div>
          <div className="form-two-col">
            <label>
              Email
              <input
                type="email"
                value={updateProfileForm.email}
                onChange={(event) =>
                  setUpdateProfileForm((prev) => ({
                    ...prev,
                    email: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Phone number
              <input
                value={updateProfileForm.phoneNumber}
                onChange={(event) =>
                  setUpdateProfileForm((prev) => ({
                    ...prev,
                    phoneNumber: event.target.value
                  }))
                }
              />
            </label>
          </div>
          <label>
            Address
            <input
              value={updateProfileForm.address}
              onChange={(event) =>
                setUpdateProfileForm((prev) => ({
                  ...prev,
                  address: event.target.value
                }))
              }
            />
          </label>
          <label>
            Description
            <input
              value={updateProfileForm.description}
              onChange={(event) =>
                setUpdateProfileForm((prev) => ({
                  ...prev,
                  description: event.target.value
                }))
              }
            />
          </label>
          <button type="submit" disabled={activeTaskId === "update-profile"}>
            {activeTaskId === "update-profile"
              ? "Updating..."
              : "Update employee profile"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Reject employee request</h4>
        <form className="stack" onSubmit={rejectRequest}>
          <label>
            Request number
            <input
              value={rejectRequestForm.requestId}
              onChange={(event) =>
                setRejectRequestForm((previous) => ({
                  ...previous,
                  requestId: event.target.value
                }))
              }
              placeholder="Request UUID"
              required
            />
          </label>
          <label>
            Rejection reason
            <textarea
              className="compact-textarea"
              rows={3}
              value={rejectRequestForm.reason}
              onChange={(event) =>
                setRejectRequestForm((previous) => ({
                  ...previous,
                  reason: event.target.value
                }))
              }
              placeholder="Explain why the request is rejected"
            />
          </label>
          <button type="submit" disabled={activeTaskId === "reject-request"}>
            {activeTaskId === "reject-request"
              ? "Rejecting..."
              : "Reject employee request"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Review request attachments</h4>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void loadRequestAttachments(requestLookupForm.requestId);
          }}
        >
          <label>
            Request number
            <input
              value={requestLookupForm.requestId}
              onChange={(event) =>
                setRequestLookupForm({ requestId: event.target.value })
              }
              placeholder="Paste request UUID"
              required
            />
          </label>
          <button type="submit" disabled={isAttachmentsLoading}>
            {isAttachmentsLoading ? "Loading..." : "Load request attachments"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Request employee document</h4>
        <form className="stack" onSubmit={requestEmployeeDocument}>
          <label>
            Employee (NetID or UUID)
            <input
              value={documentRequestForm.employeeRef}
              onChange={(event) =>
                setDocumentRequestForm((previous) => ({
                  ...previous,
                  employeeRef: event.target.value
                }))
              }
              placeholder="e.g. ioan or employee UUID"
              required
            />
          </label>
          <label>
            Document details
            <textarea
              className="compact-textarea"
              rows={3}
              value={documentRequestForm.requestBody}
              onChange={(event) =>
                setDocumentRequestForm((previous) => ({
                  ...previous,
                  requestBody: event.target.value
                }))
              }
              placeholder="What document should the employee provide?"
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "request-document"}>
            {activeTaskId === "request-document"
              ? "Sending..."
              : "Request employee document"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Terminate contract</h4>
        <form className="stack" onSubmit={terminateContract}>
          <label>
            Contract ID
            <input
              value={terminateContractForm.contractId}
              onChange={(event) =>
                setTerminateContractForm({ contractId: event.target.value })
              }
              placeholder="Contract UUID"
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "terminate-contract"}>
            {activeTaskId === "terminate-contract"
              ? "Terminating..."
              : "Terminate contract"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Create salary scale</h4>
        <form className="stack" onSubmit={createSalaryScale}>
          <div className="form-three-col">
            <label>
              Min pay
              <input
                type="number"
                min="0"
                value={salaryScaleForm.minimumPay}
                onChange={(event) =>
                  setSalaryScaleForm((previous) => ({
                    ...previous,
                    minimumPay: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Max pay
              <input
                type="number"
                min="0"
                value={salaryScaleForm.maximumPay}
                onChange={(event) =>
                  setSalaryScaleForm((previous) => ({
                    ...previous,
                    maximumPay: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Step
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={salaryScaleForm.step}
                onChange={(event) =>
                  setSalaryScaleForm((previous) => ({
                    ...previous,
                    step: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <button type="submit" disabled={activeTaskId === "create-salary-scale"}>
            {activeTaskId === "create-salary-scale"
              ? "Creating..."
              : "Create salary scale"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Create job position</h4>
        <form className="stack" onSubmit={createJobPositionCatalog}>
          <label>
            Position name
            <input
              value={jobPositionCatalogForm.name}
              onChange={(event) =>
                setJobPositionCatalogForm((previous) => ({
                  ...previous,
                  name: event.target.value
                }))
              }
              required
            />
          </label>
          <div className="form-three-col">
            <label>
              Min pay
              <input
                type="number"
                min="0"
                value={jobPositionCatalogForm.minimumPay}
                onChange={(event) =>
                  setJobPositionCatalogForm((previous) => ({
                    ...previous,
                    minimumPay: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Max pay
              <input
                type="number"
                min="0"
                value={jobPositionCatalogForm.maximumPay}
                onChange={(event) =>
                  setJobPositionCatalogForm((previous) => ({
                    ...previous,
                    maximumPay: event.target.value
                  }))
                }
                required
              />
            </label>
            <label>
              Step
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={jobPositionCatalogForm.step}
                onChange={(event) =>
                  setJobPositionCatalogForm((previous) => ({
                    ...previous,
                    step: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <button type="submit" disabled={activeTaskId === "create-job-position"}>
            {activeTaskId === "create-job-position"
              ? "Creating..."
              : "Create job position"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Create pension scheme</h4>
        <form className="stack" onSubmit={createPensionScheme}>
          <label>
            Scheme name
            <input
              value={pensionSchemeForm.name}
              onChange={(event) =>
                setPensionSchemeForm({ name: event.target.value })
              }
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "create-pension-scheme"}>
            {activeTaskId === "create-pension-scheme"
              ? "Creating..."
              : "Create pension scheme"}
          </button>
        </form>
      </article>
    </div>
  </section>
  );
}
