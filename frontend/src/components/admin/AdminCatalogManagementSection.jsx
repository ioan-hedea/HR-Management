export default function AdminCatalogManagementSection({
  activeTaskId,
  contractLookupForm,
  setContractLookupForm,
  lookupContract,
  deleteContractForm,
  setDeleteContractForm,
  deleteContract,
  salaryScaleUpdateForm,
  setSalaryScaleUpdateForm,
  updateSalaryScaleRange,
  renameJobPosition,
  renameJobPositionForm,
  setRenameJobPositionForm,
  renamePensionScheme,
  renamePensionSchemeForm,
  setRenamePensionSchemeForm,
  deleteCatalogEntity,
  deleteCatalogForm,
  setDeleteCatalogForm
}) {
  return (
  <section id="admin-operations" className="panel task-modules">
    <h2>Contract and Catalog Management</h2>
    <p className="helper-text">
      Manage contract records and HR catalogs without manually crafting API payloads.
    </p>
    <div className="task-grid">
      <article className="task-card">
        <h4>Lookup contract</h4>
        <form className="stack" onSubmit={lookupContract}>
          <label>
            Contract ID
            <input
              value={contractLookupForm.contractId}
              onChange={(event) =>
                setContractLookupForm({ contractId: event.target.value })
              }
              placeholder="Contract UUID"
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "lookup-contract"}>
            {activeTaskId === "lookup-contract" ? "Checking..." : "Lookup contract"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Delete contract</h4>
        <form className="stack" onSubmit={deleteContract}>
          <label>
            Contract ID
            <input
              value={deleteContractForm.contractId}
              onChange={(event) =>
                setDeleteContractForm({ contractId: event.target.value })
              }
              placeholder="Contract UUID"
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "delete-contract"}>
            {activeTaskId === "delete-contract" ? "Deleting..." : "Delete contract"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Update salary scale pay range</h4>
        <form className="stack" onSubmit={updateSalaryScaleRange}>
          <label>
            Salary scale ID
            <input
              value={salaryScaleUpdateForm.salaryScaleId}
              onChange={(event) =>
                setSalaryScaleUpdateForm((previous) => ({
                  ...previous,
                  salaryScaleId: event.target.value
                }))
              }
              placeholder="Salary scale UUID"
              required
            />
          </label>
          <div className="form-two-col">
            <label>
              New minimum pay (optional)
              <input
                type="number"
                min="0"
                value={salaryScaleUpdateForm.minimumPay}
                onChange={(event) =>
                  setSalaryScaleUpdateForm((previous) => ({
                    ...previous,
                    minimumPay: event.target.value
                  }))
                }
              />
            </label>
            <label>
              New maximum pay (optional)
              <input
                type="number"
                min="0"
                value={salaryScaleUpdateForm.maximumPay}
                onChange={(event) =>
                  setSalaryScaleUpdateForm((previous) => ({
                    ...previous,
                    maximumPay: event.target.value
                  }))
                }
              />
            </label>
          </div>
          <button type="submit" disabled={activeTaskId === "update-salary-scale"}>
            {activeTaskId === "update-salary-scale"
              ? "Updating..."
              : "Update salary scale"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Rename job position</h4>
        <form className="stack" onSubmit={renameJobPosition}>
          <label>
            Job position ID
            <input
              value={renameJobPositionForm.jobPositionId}
              onChange={(event) =>
                setRenameJobPositionForm((previous) => ({
                  ...previous,
                  jobPositionId: event.target.value
                }))
              }
              placeholder="Job position UUID"
              required
            />
          </label>
          <label>
            New name
            <input
              value={renameJobPositionForm.name}
              onChange={(event) =>
                setRenameJobPositionForm((previous) => ({
                  ...previous,
                  name: event.target.value
                }))
              }
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "rename-job-position"}>
            {activeTaskId === "rename-job-position"
              ? "Renaming..."
              : "Rename job position"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Rename pension scheme</h4>
        <form className="stack" onSubmit={renamePensionScheme}>
          <label>
            Pension scheme ID
            <input
              value={renamePensionSchemeForm.pensionSchemeId}
              onChange={(event) =>
                setRenamePensionSchemeForm((previous) => ({
                  ...previous,
                  pensionSchemeId: event.target.value
                }))
              }
              placeholder="Pension scheme UUID"
              required
            />
          </label>
          <label>
            New name
            <input
              value={renamePensionSchemeForm.name}
              onChange={(event) =>
                setRenamePensionSchemeForm((previous) => ({
                  ...previous,
                  name: event.target.value
                }))
              }
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "rename-pension-scheme"}>
            {activeTaskId === "rename-pension-scheme"
              ? "Renaming..."
              : "Rename pension scheme"}
          </button>
        </form>
      </article>

      <article className="task-card">
        <h4>Delete salary/job/pension catalog entry</h4>
        <form className="stack" onSubmit={deleteCatalogEntity}>
          <label>
            Entity type
            <select
              value={deleteCatalogForm.entityType}
              onChange={(event) =>
                setDeleteCatalogForm((previous) => ({
                  ...previous,
                  entityType: event.target.value
                }))
              }
            >
              <option value="salary-scale">Salary scale</option>
              <option value="job-position">Job position</option>
              <option value="pension-scheme">Pension scheme</option>
            </select>
          </label>
          <label>
            Entity ID
            <input
              value={deleteCatalogForm.entityId}
              onChange={(event) =>
                setDeleteCatalogForm((previous) => ({
                  ...previous,
                  entityId: event.target.value
                }))
              }
              placeholder="UUID"
              required
            />
          </label>
          <button type="submit" disabled={activeTaskId === "delete-catalog-entity"}>
            {activeTaskId === "delete-catalog-entity"
              ? "Deleting..."
              : "Delete selected entity"}
          </button>
        </form>
      </article>
    </div>
</section>
  );
}
