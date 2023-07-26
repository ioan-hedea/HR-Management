import EmployeeTaskModules from "../components/requests/EmployeeTaskModules";
import HrTaskModules from "../components/requests/HrTaskModules";
import MyRequestsPanel from "../components/requests/MyRequestsPanel";
import RequestAttachmentsPanel from "../components/requests/RequestAttachmentsPanel";
import RequestsActionStatusPanel from "../components/requests/RequestsActionStatusPanel";
import RequestsChecksPanel from "../components/requests/RequestsChecksPanel";

export default function RequestsPage({
  isAdmin,
  runPortalAction,
  portalActions,
  activeActionId,
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
  setDocumentResponseForm,
  requestAttachmentList,
  attachmentsRequestId,
  formatFileSize,
  toLocaleDateTime,
  activeAttachmentId,
  downloadRequestAttachment,
  deleteRequestAttachment,
  requestsNotice,
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
  loadMyRequests,
  isMyRequestsLoading,
  myRequestFilter,
  setMyRequestFilter,
  myRequestSearch,
  setMyRequestSearch,
  filteredMyRequests,
  getRequestGuidance,
  openRequestWorkspaceContext,
  cancelOwnRequest,
  activeSectionId
}) {
  const showConsole = activeSectionId === "requests-console";
  const showAdminConsole = activeSectionId === "requests-admin-console";
  const showEmployeeModules = activeSectionId === "requests-modules";
  const showHrModules = activeSectionId === "requests-hr-modules";
  const showMine = activeSectionId === "my-requests";

  return (
    <>
      {showConsole && (
        <section id="requests-console" className="panel workspace">
          <h2>Requests Console</h2>
          <p className="helper-text">
            Use these guided actions to interact with the HR backend.
          </p>
          <RequestsChecksPanel
            isAdmin={isAdmin}
            runPortalAction={runPortalAction}
            portalActions={portalActions}
            activeActionId={activeActionId}
            showUserChecks
            showAdminChecks={false}
          />
          <RequestsActionStatusPanel requestsNotice={requestsNotice} />
        </section>
      )}

      {showAdminConsole && isAdmin && (
        <section id="requests-admin-console" className="panel workspace">
          <h2>Admin Requests Console</h2>
          <p className="helper-text">
            Run operational HR actions directly from buttons and forms.
          </p>
          <RequestsChecksPanel
            isAdmin={isAdmin}
            runPortalAction={runPortalAction}
            portalActions={portalActions}
            activeActionId={activeActionId}
            showUserChecks={false}
            showAdminChecks
          />
          <RequestsActionStatusPanel requestsNotice={requestsNotice} />
        </section>
      )}

      {showEmployeeModules && (
        <section id="requests-modules" className="panel workspace">
          <h2>Employee task modules</h2>
          <p className="helper-text">
            Submit, update, and track your own requests using guided forms.
          </p>
          <EmployeeTaskModules
            submitUserRequest={submitUserRequest}
            createUserRequestForm={createUserRequestForm}
            setCreateUserRequestForm={setCreateUserRequestForm}
            loadCurrentUserContract={loadCurrentUserContract}
            activeTaskId={activeTaskId}
            requestContractUpdate={requestContractUpdate}
            contractUpdateRequestForm={contractUpdateRequestForm}
            setContractUpdateRequestForm={setContractUpdateRequestForm}
            checkRequestStatus={checkRequestStatus}
            requestLookupForm={requestLookupForm}
            setRequestLookupForm={setRequestLookupForm}
            loadRequestAttachments={loadRequestAttachments}
            isAttachmentsLoading={isAttachmentsLoading}
            updateOwnRequest={updateOwnRequest}
            requestEditForm={requestEditForm}
            setRequestEditForm={setRequestEditForm}
            uploadRequestAttachment={uploadRequestAttachment}
            documentUploadForm={documentUploadForm}
            setDocumentUploadForm={setDocumentUploadForm}
            respondToDocumentRequest={respondToDocumentRequest}
            documentResponseForm={documentResponseForm}
            setDocumentResponseForm={setDocumentResponseForm}
          />
          <RequestAttachmentsPanel
            requestAttachmentList={requestAttachmentList}
            attachmentsRequestId={attachmentsRequestId}
            formatFileSize={formatFileSize}
            toLocaleDateTime={toLocaleDateTime}
            activeAttachmentId={activeAttachmentId}
            downloadRequestAttachment={downloadRequestAttachment}
            deleteRequestAttachment={deleteRequestAttachment}
            activeTaskId={activeTaskId}
          />
          <RequestsActionStatusPanel requestsNotice={requestsNotice} />
        </section>
      )}

      {showHrModules && isAdmin && (
        <section id="requests-hr-modules" className="panel workspace">
          <h2>HR task modules</h2>
          <p className="helper-text">
            Complete business forms instead of calling raw technical endpoints.
          </p>
          <HrTaskModules
            isAdmin={isAdmin}
            activeTaskId={activeTaskId}
            approveRequest={approveRequest}
            approveRequestForm={approveRequestForm}
            setApproveRequestForm={setApproveRequestForm}
            createContract={createContract}
            createContractForm={createContractForm}
            setCreateContractForm={setCreateContractForm}
            contractTypes={contractTypes}
            userRoles={userRoles}
            formatEnumLabel={formatEnumLabel}
            isAllowedContractStartDate={isAllowedContractStartDate}
            updateUserProfile={updateUserProfile}
            updateProfileForm={updateProfileForm}
            setUpdateProfileForm={setUpdateProfileForm}
            rejectRequest={rejectRequest}
            rejectRequestForm={rejectRequestForm}
            setRejectRequestForm={setRejectRequestForm}
            requestEmployeeDocument={requestEmployeeDocument}
            documentRequestForm={documentRequestForm}
            setDocumentRequestForm={setDocumentRequestForm}
            terminateContract={terminateContract}
            terminateContractForm={terminateContractForm}
            setTerminateContractForm={setTerminateContractForm}
            createSalaryScale={createSalaryScale}
            salaryScaleForm={salaryScaleForm}
            setSalaryScaleForm={setSalaryScaleForm}
            createJobPositionCatalog={createJobPositionCatalog}
            jobPositionCatalogForm={jobPositionCatalogForm}
            setJobPositionCatalogForm={setJobPositionCatalogForm}
            createPensionScheme={createPensionScheme}
            pensionSchemeForm={pensionSchemeForm}
            setPensionSchemeForm={setPensionSchemeForm}
            requestLookupForm={requestLookupForm}
            setRequestLookupForm={setRequestLookupForm}
            loadRequestAttachments={loadRequestAttachments}
            isAttachmentsLoading={isAttachmentsLoading}
          />
          <RequestAttachmentsPanel
            requestAttachmentList={requestAttachmentList}
            attachmentsRequestId={attachmentsRequestId}
            formatFileSize={formatFileSize}
            toLocaleDateTime={toLocaleDateTime}
            activeAttachmentId={activeAttachmentId}
            downloadRequestAttachment={downloadRequestAttachment}
            deleteRequestAttachment={deleteRequestAttachment}
            activeTaskId={activeTaskId}
          />
          <RequestsActionStatusPanel requestsNotice={requestsNotice} />
        </section>
      )}

      {showMine && (
        <MyRequestsPanel
          loadMyRequests={loadMyRequests}
          isMyRequestsLoading={isMyRequestsLoading}
          myRequestFilter={myRequestFilter}
          setMyRequestFilter={setMyRequestFilter}
          myRequestSearch={myRequestSearch}
          setMyRequestSearch={setMyRequestSearch}
          filteredMyRequests={filteredMyRequests}
          formatEnumLabel={formatEnumLabel}
          getRequestGuidance={getRequestGuidance}
          toLocaleDateTime={toLocaleDateTime}
          openRequestWorkspaceContext={openRequestWorkspaceContext}
          cancelOwnRequest={cancelOwnRequest}
          activeTaskId={activeTaskId}
        />
      )}
    </>
  );
}
