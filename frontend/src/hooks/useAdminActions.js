export function useAdminActions({
  apiRequest,
  formatApiError,
  buildPortalActionFeedback,
  resolveUserUuid,
  toFiniteNumber,
  isAllowedContractStartDate,
  isUuid,
  hasRequiredRole,
  formatEnumLabel,
  activeRole,
  token,
  setActionResults,
  setRequestsNotice,
  setActiveActionId,
  pushActivity,
  runTask,
  approveRequestForm,
  rejectRequestForm,
  documentRequestForm,
  terminateContractForm,
  salaryScaleForm,
  jobPositionCatalogForm,
  pensionSchemeForm,
  contractLookupForm,
  deleteContractForm,
  salaryScaleUpdateForm,
  renameJobPositionForm,
  renamePensionSchemeForm,
  deleteCatalogForm,
  createContractForm,
  updateProfileForm,
  setDocumentRequestForm,
  setSalaryScaleUpdateForm
}) {
  const runPortalAction = async (action) => {
    if (!hasRequiredRole(activeRole || "USER", action.minRole)) {
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "error",
          message: "You do not have permission for this action."
        }
      }));
      setRequestsNotice({
        type: "error",
        message: "You do not have permission for this action."
      });
      return;
    }

    if (action.requiresToken && !token) {
      setActionResults((previous) => ({
        ...previous,
        [action.id]: { status: "error", message: "Login first to attach a Bearer token." }
      }));
      setRequestsNotice({
        type: "error",
        message: "Login first to attach a Bearer token."
      });
      return;
    }

    setActiveActionId(action.id);
    setActionResults((previous) => ({
      ...previous,
      [action.id]: { status: "loading", message: "Running..." }
    }));

    try {
      const response = await apiRequest(`/api/${action.service}${action.path}`, {
        method: action.method,
        token: action.requiresToken ? token : undefined
      });
      const actionFeedback = buildPortalActionFeedback(action, response);
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "success",
          message: actionFeedback.resultMessage,
          details: actionFeedback.details || []
        }
      }));
      setRequestsNotice({
        type: "success",
        message: actionFeedback.noticeMessage,
        details: actionFeedback.details || []
      });
      pushActivity(action.label, actionFeedback.activityDetail, "success");
    } catch (error) {
      const message = formatApiError(error);
      setActionResults((previous) => ({
        ...previous,
        [action.id]: {
          status: "error",
          message
        }
      }));
      setRequestsNotice({
        type: "error",
        message: `${action.label} failed. ${message}`
      });
      pushActivity(action.label, message, "error");
    } finally {
      setActiveActionId("");
    }
  };

  const approveRequest = async (event) => {
    event.preventDefault();
    const requestId = approveRequestForm.requestId.trim();
    if (!requestId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a request number."
      });
      return;
    }
    if (!isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Request number must be a valid UUID."
      });
      return;
    }

    await runTask("approve-request", "Approve employee request", () =>
      apiRequest(`/api/request/internal/request/approve/${requestId}`, {
        method: "PUT",
        token
      })
    );
  };

  const rejectRequest = async (event) => {
    event.preventDefault();
    const requestId = rejectRequestForm.requestId.trim();
    if (!requestId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a request number."
      });
      return;
    }
    if (!isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Request number must be a valid UUID."
      });
      return;
    }

    const reason = rejectRequestForm.reason.trim() || "Request rejected by HR.";
    await runTask("reject-request", "Reject employee request", () =>
      apiRequest(`/api/request/internal/request/reject/${requestId}`, {
        method: "PUT",
        body: reason,
        token
      })
    );
  };

  const requestEmployeeDocument = async (event) => {
    event.preventDefault();
    const employeeRef = documentRequestForm.employeeRef.trim();
    const requestBody = documentRequestForm.requestBody.trim();
    if (!employeeRef || !requestBody) {
      setRequestsNotice({
        type: "error",
        message: "Please provide employee reference and document details."
      });
      return;
    }

    let employeeId = "";
    try {
      employeeId = await resolveUserUuid(employeeRef, token);
    } catch (error) {
      setRequestsNotice({
        type: "error",
        message: formatApiError(error)
      });
      return;
    }

    await runTask(
      "request-document",
      "Request employee document",
      () =>
        apiRequest(`/api/request/internal/request/document/${employeeId}`, {
          method: "POST",
          body: requestBody,
          token
        }),
      {
        successMessage: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Document request sent. Tracking number: ${requestId}.`;
          }
          return `Document request sent successfully (HTTP ${response.status}).`;
        },
        onSuccess: () => {
          setDocumentRequestForm({ employeeRef: "", requestBody: "" });
        }
      }
    );
  };

  const terminateContract = async (event) => {
    event.preventDefault();
    const contractId = terminateContractForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a contract ID."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    await runTask("terminate-contract", "Terminate contract", () =>
      apiRequest(`/api/contract/internal/contract/terminate/${contractId}`, {
        method: "DELETE",
        token
      })
    );
  };

  const createSalaryScale = async (event) => {
    event.preventDefault();

    const minimumPay = toFiniteNumber(salaryScaleForm.minimumPay, 0);
    const maximumPay = toFiniteNumber(salaryScaleForm.maximumPay, 0);
    const step = toFiniteNumber(salaryScaleForm.step, 0);

    if (maximumPay < minimumPay) {
      setRequestsNotice({
        type: "error",
        message: "Maximum pay must be greater than or equal to minimum pay."
      });
      return;
    }

    await runTask(
      "create-salary-scale",
      "Create salary scale",
      () =>
        apiRequest("/api/contract/internal/salary-scale", {
          method: "POST",
          body: {
            minimumPay,
            maximumPay,
            step
          },
          token
        }),
      {
        successMessage: (response) => {
          const scaleId = response.data?.id;
          if (scaleId) {
            return `Salary scale created successfully. ID: ${scaleId}.`;
          }
          return `Salary scale created successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const createJobPositionCatalog = async (event) => {
    event.preventDefault();
    const name = jobPositionCatalogForm.name.trim();
    if (!name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a job position name."
      });
      return;
    }

    const minimumPay = toFiniteNumber(jobPositionCatalogForm.minimumPay, 0);
    const maximumPay = toFiniteNumber(jobPositionCatalogForm.maximumPay, 0);
    const step = toFiniteNumber(jobPositionCatalogForm.step, 0);
    if (maximumPay < minimumPay) {
      setRequestsNotice({
        type: "error",
        message: "Maximum pay must be greater than or equal to minimum pay."
      });
      return;
    }

    await runTask(
      "create-job-position",
      "Create job position",
      () =>
        apiRequest("/api/contract/internal/job-position", {
          method: "POST",
          body: {
            name,
            salaryScale: {
              minimumPay,
              maximumPay,
              step
            }
          },
          token
        }),
      {
        successMessage: (response) => {
          const positionId = response.data?.id;
          if (positionId) {
            return `Job position created successfully. ID: ${positionId}.`;
          }
          return `Job position created successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const createPensionScheme = async (event) => {
    event.preventDefault();
    const name = pensionSchemeForm.name.trim();
    if (!name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a pension scheme name."
      });
      return;
    }

    await runTask(
      "create-pension-scheme",
      "Create pension scheme",
      () =>
        apiRequest("/api/contract/internal/pension-scheme", {
          method: "POST",
          body: { name },
          token
        }),
      {
        successMessage: (response) => {
          const schemeId = response.data?.id;
          if (schemeId) {
            return `Pension scheme created successfully. ID: ${schemeId}.`;
          }
          return `Pension scheme created successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const lookupContract = async (event) => {
    event.preventDefault();
    const contractId = contractLookupForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a contract ID."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    await runTask(
      "lookup-contract",
      "Lookup contract",
      () =>
        apiRequest(`/api/contract/internal/contract/${contractId}`, {
          method: "GET",
          token
        }),
      {
        successMessage: (response) => {
          const contractType = response.data?.contractInfo?.type;
          const contractStatus = response.data?.contractInfo?.status;
          if (contractType || contractStatus) {
            return `Contract found: ${formatEnumLabel(contractType || "UNKNOWN")} (${formatEnumLabel(contractStatus || "UNKNOWN")}).`;
          }
          return `Contract found successfully (HTTP ${response.status}).`;
        }
      }
    );
  };

  const deleteContract = async (event) => {
    event.preventDefault();
    const contractId = deleteContractForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a contract ID."
      });
      return;
    }
    if (!isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }

    await runTask("delete-contract", "Delete contract", () =>
      apiRequest(`/api/contract/internal/contract/${contractId}`, {
        method: "DELETE",
        token
      })
    );
  };

  const updateSalaryScaleRange = async (event) => {
    event.preventDefault();
    const scaleId = salaryScaleUpdateForm.salaryScaleId.trim();
    if (!scaleId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide a salary scale ID."
      });
      return;
    }
    if (!isUuid(scaleId)) {
      setRequestsNotice({
        type: "error",
        message: "Salary scale ID must be a valid UUID."
      });
      return;
    }

    const hasMinimumUpdate = salaryScaleUpdateForm.minimumPay !== "";
    const hasMaximumUpdate = salaryScaleUpdateForm.maximumPay !== "";
    if (!hasMinimumUpdate && !hasMaximumUpdate) {
      setRequestsNotice({
        type: "error",
        message: "Provide at least one pay update (minimum or maximum)."
      });
      return;
    }

    await runTask(
      "update-salary-scale",
      "Update salary scale",
      async () => {
        let response = null;
        if (hasMinimumUpdate) {
          response = await apiRequest(`/api/contract/internal/salary-scale/${scaleId}/edit-minimum-pay`, {
            method: "PUT",
            body: { data: salaryScaleUpdateForm.minimumPay },
            token
          });
        }
        if (hasMaximumUpdate) {
          response = await apiRequest(`/api/contract/internal/salary-scale/${scaleId}/edit-maximum-pay`, {
            method: "PUT",
            body: { data: salaryScaleUpdateForm.maximumPay },
            token
          });
        }
        return response;
      },
      {
        successMessage: () => "Salary scale updated successfully.",
        onSuccess: () => {
          setSalaryScaleUpdateForm((previous) => ({
            ...previous,
            minimumPay: "",
            maximumPay: ""
          }));
        }
      }
    );
  };

  const renameJobPosition = async (event) => {
    event.preventDefault();
    const jobPositionId = renameJobPositionForm.jobPositionId.trim();
    const name = renameJobPositionForm.name.trim();
    if (!jobPositionId || !name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide job position ID and the new name."
      });
      return;
    }
    if (!isUuid(jobPositionId)) {
      setRequestsNotice({
        type: "error",
        message: "Job position ID must be a valid UUID."
      });
      return;
    }

    await runTask("rename-job-position", "Rename job position", () =>
      apiRequest(`/api/contract/internal/job-position/${jobPositionId}/edit-name`, {
        method: "PUT",
        body: { data: name },
        token
      })
    );
  };

  const renamePensionScheme = async (event) => {
    event.preventDefault();
    const pensionSchemeId = renamePensionSchemeForm.pensionSchemeId.trim();
    const name = renamePensionSchemeForm.name.trim();
    if (!pensionSchemeId || !name) {
      setRequestsNotice({
        type: "error",
        message: "Please provide pension scheme ID and the new name."
      });
      return;
    }
    if (!isUuid(pensionSchemeId)) {
      setRequestsNotice({
        type: "error",
        message: "Pension scheme ID must be a valid UUID."
      });
      return;
    }

    await runTask("rename-pension-scheme", "Rename pension scheme", () =>
      apiRequest(`/api/contract/internal/pension-scheme/${pensionSchemeId}/edit-name`, {
        method: "PUT",
        body: { data: name },
        token
      })
    );
  };

  const deleteCatalogEntity = async (event) => {
    event.preventDefault();
    const entityId = deleteCatalogForm.entityId.trim();
    if (!entityId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide an entity ID."
      });
      return;
    }
    if (!isUuid(entityId)) {
      setRequestsNotice({
        type: "error",
        message: "Entity ID must be a valid UUID."
      });
      return;
    }

    const entityConfig = {
      "salary-scale": {
        label: "salary scale",
        path: `/api/contract/internal/salary-scale/${entityId}`
      },
      "job-position": {
        label: "job position",
        path: `/api/contract/internal/job-position/${entityId}`
      },
      "pension-scheme": {
        label: "pension scheme",
        path: `/api/contract/internal/pension-scheme/${entityId}`
      }
    };

    const selectedEntity = entityConfig[deleteCatalogForm.entityType];
    await runTask(
      "delete-catalog-entity",
      `Delete ${selectedEntity.label}`,
      () =>
        apiRequest(selectedEntity.path, {
          method: "DELETE",
          token
        })
    );
  };

  const createContract = async (event) => {
    event.preventDefault();
    const employeeRef = createContractForm.employeeId.trim();
    const employerRef = createContractForm.employerId.trim();
    const positionName = createContractForm.jobPosition.trim();
    const pensionName = createContractForm.pensionScheme.trim();

    if (!employeeRef || !employerRef || !positionName || !pensionName) {
      setRequestsNotice({
        type: "error",
        message: "Please complete employee, employer, job position and pension scheme fields."
      });
      return;
    }

    let employeeId = "";
    let employerId = "";

    try {
      employeeId = await resolveUserUuid(employeeRef, token);
      employerId = await resolveUserUuid(employerRef, token);
    } catch (error) {
      const message = formatApiError(error);
      setRequestsNotice({
        type: "error",
        message
      });
      return;
    }

    if (!isAllowedContractStartDate(createContractForm.startDate)) {
      setRequestsNotice({
        type: "error",
        message: "Start date must be on day 1 or day 15 of the month."
      });
      return;
    }

    const minimumPay = toFiniteNumber(createContractForm.minimumPay);
    const maximumPay = toFiniteNumber(createContractForm.maximumPay);
    if (maximumPay < minimumPay) {
      setRequestsNotice({
        type: "error",
        message: "Maximum pay must be greater than or equal to minimum pay."
      });
      return;
    }

    const benefits = createContractForm.benefits
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const payload = {
      contractParties: {
        employeeId,
        employerId
      },
      contractInfo: {
        type: createContractForm.contractType,
        status: "DRAFT"
      },
      contractTerms: {
        hoursPerWeek: toFiniteNumber(createContractForm.hoursPerWeek, 40),
        vacationDays: toFiniteNumber(createContractForm.vacationDays, 25),
        startDate: createContractForm.startDate || null,
        endDate: createContractForm.endDate || null,
        terminationDate: null,
        salaryScalePoint: toFiniteNumber(createContractForm.salaryScalePoint, 0.2),
        lastSalaryIncreaseDate: null
      },
      jobPosition: {
        name: positionName,
        salaryScale: {
          minimumPay,
          maximumPay,
          step: toFiniteNumber(createContractForm.salaryStep, 0.1)
        }
      },
      pensionScheme: {
        name: pensionName
      },
      benefits
    };

    await runTask("create-contract", "Create employment contract", () =>
      apiRequest("/api/contract/internal/contract", {
        method: "POST",
        body: payload,
        token
      })
    );
  };

  const updateUserProfile = async (event) => {
    event.preventDefault();
    const netId = updateProfileForm.netId.trim();
    if (!netId) {
      setRequestsNotice({
        type: "error",
        message: "Please enter the user NetID you want to update."
      });
      return;
    }

    const payload = {
      netId,
      role: updateProfileForm.role,
      firstName: updateProfileForm.firstName.trim(),
      lastName: updateProfileForm.lastName.trim(),
      email: updateProfileForm.email.trim(),
      phoneNumber: updateProfileForm.phoneNumber.trim(),
      address: updateProfileForm.address.trim(),
      description: updateProfileForm.description.trim()
    };

    await runTask("update-profile", "Update employee profile", () =>
      apiRequest("/api/user/internal/user/updateUser", {
        method: "POST",
        body: payload,
        token
      })
    );
  };

  return {
    runPortalAction,
    approveRequest,
    rejectRequest,
    requestEmployeeDocument,
    terminateContract,
    createSalaryScale,
    createJobPositionCatalog,
    createPensionScheme,
    lookupContract,
    deleteContract,
    updateSalaryScaleRange,
    renameJobPosition,
    renamePensionScheme,
    deleteCatalogEntity,
    createContract,
    updateUserProfile
  };
}
