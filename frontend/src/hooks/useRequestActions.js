export function useRequestActions({
  apiRequest,
  formatApiError,
  resolveUserUuid,
  buildRequestStats,
  currentApiDateTime,
  toOptionalNumber,
  toFiniteNumber,
  isAllowedContractStartDate,
  normalizeDateForInput,
  isUuid,
  validatePdfUpload,
  createMultipartFilePayload,
  triggerFileDownload,
  sanitizeFileNameForDownload,
  formatEnumLabel,
  token,
  activeNetId,
  createUserRequestForm,
  setCreateUserRequestForm,
  contractUpdateRequestForm,
  setContractUpdateRequestForm,
  documentResponseForm,
  setDocumentResponseForm,
  documentUploadForm,
  setDocumentUploadForm,
  requestLookupForm,
  setRequestLookupForm,
  requestEditForm,
  setRequestEditForm,
  attachmentsRequestId,
  setAttachmentsRequestId,
  setRequestAttachmentList,
  setRequestsNotice,
  setIsAttachmentsLoading,
  setActiveAttachmentId,
  setIsProfileLoading,
  setProfileData,
  setMyRequests,
  setRequestStats,
  setCurrentContractData,
  setIsMyRequestsLoading,
  pushActivity,
  runTask
}) {
  const loadPersonalDashboard = async ({ silent = false } = {}) => {
    if (!token || !activeNetId) {
      return;
    }

    setIsProfileLoading(true);

    try {
      const profileResponse = await apiRequest(
        `/api/user/internal/user/getUserDto/${encodeURIComponent(activeNetId)}`,
        {
          method: "GET",
          token
        }
      );
      const nextProfile = profileResponse.data || null;
      setProfileData(nextProfile);

      const resolvedUserId =
        nextProfile?.id && isUuid(String(nextProfile.id))
          ? String(nextProfile.id)
          : await resolveUserUuid(activeNetId, token);

      const [myRequestsResponse, currentContractResponse] = await Promise.all([
        apiRequest("/api/request/internal/request/mine", {
          method: "GET",
          token
        }),
        apiRequest(`/api/contract/internal/contract/current/employee/${resolvedUserId}`, {
          method: "GET",
          token
        })
      ]);

      const nextRequests = Array.isArray(myRequestsResponse.data) ? myRequestsResponse.data : [];
      setMyRequests(nextRequests);
      setRequestStats(buildRequestStats(nextRequests));
      setCurrentContractData(currentContractResponse.status === 204 ? null : currentContractResponse.data);

      if (!silent) {
        pushActivity("Dashboard refreshed", "Loaded your profile, contract and request summary.", "success");
      }
    } catch (error) {
      const message = formatApiError(error);
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message
        });
      }
      pushActivity("Dashboard refresh failed", message, "error");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const loadMyRequests = async ({ silent = false } = {}) => {
    if (!token) {
      return;
    }

    setIsMyRequestsLoading(true);
    if (!silent) {
      setRequestsNotice(null);
    }

    try {
      const response = await apiRequest("/api/request/internal/request/mine", {
        method: "GET",
        token
      });

      const requests = Array.isArray(response.data) ? response.data : [];
      setMyRequests(requests);
      setRequestStats(buildRequestStats(requests));

      if (!silent) {
        setRequestsNotice({
          type: "success",
          message: requests.length === 0
            ? "No requests found for your account yet."
            : `Loaded ${requests.length} request${requests.length === 1 ? "" : "s"}.`
        });
        pushActivity("My requests loaded", `Fetched ${requests.length} request(s).`, "success");
      }
    } catch (error) {
      const message = formatApiError(error);
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message
        });
      }
      pushActivity("My requests failed", message, "error");
    } finally {
      setIsMyRequestsLoading(false);
    }
  };

  const submitUserRequest = async (event) => {
    event.preventDefault();
    const requestBody = createUserRequestForm.requestBody.trim();
    if (!requestBody) {
      setRequestsNotice({
        type: "error",
        message: "Please add the request details before submitting."
      });
      return;
    }

    const contractId = createUserRequestForm.contractId.trim();
    if (contractId && !isUuid(contractId)) {
      setRequestsNotice({
        type: "error",
        message: "Contract ID must be a valid UUID."
      });
      return;
    }
    const numberOfDays = toOptionalNumber(createUserRequestForm.numberOfDays) ?? 0;
    const startDate = createUserRequestForm.startDate
      ? `${createUserRequestForm.startDate}T09:00:00`
      : null;

    await runTask(
      "submit-user-request",
      "Submit employee request",
      () =>
        apiRequest("/api/request/internal/request", {
          method: "POST",
          body: {
            contractId: contractId || null,
            requestBody,
            requestDate: currentApiDateTime(),
            requestStatus: "OPEN",
            startDate,
            numberOfDays
          },
          token
        }),
      {
        successMessage: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Request submitted successfully. Tracking number: ${requestId}.`;
          }
          return `Request submitted successfully (HTTP ${response.status}).`;
        },
        successActivity: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Created request ${requestId}.`;
          }
          return `Success (${response.status}).`;
        },
        onSuccess: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            setRequestLookupForm({ requestId });
            setDocumentResponseForm((previous) => ({ ...previous, requestId }));
            setDocumentUploadForm((previous) => ({ ...previous, requestId, file: null }));
            setRequestEditForm({
              requestId,
              contractId: createUserRequestForm.contractId.trim(),
              requestBody: createUserRequestForm.requestBody.trim(),
              startDate: createUserRequestForm.startDate,
              numberOfDays: createUserRequestForm.numberOfDays
            });
          }
          setCreateUserRequestForm((previous) => ({
            ...previous,
            requestBody: "",
            startDate: "",
            numberOfDays: ""
          }));
          void loadMyRequests({ silent: true });
        }
      }
    );
  };

  const requestContractUpdate = async (event) => {
    event.preventDefault();
    const contractId = contractUpdateRequestForm.contractId.trim();
    if (!contractId) {
      setRequestsNotice({
        type: "error",
        message: "Please provide the contract ID for this update request."
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

    if (
      contractUpdateRequestForm.startDate
      && !isAllowedContractStartDate(contractUpdateRequestForm.startDate)
    ) {
      setRequestsNotice({
        type: "error",
        message: "Contract start date can only be day 1 or day 15."
      });
      return;
    }

    const benefits = contractUpdateRequestForm.benefits
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const payload = {
      hoursPerWeek: toOptionalNumber(contractUpdateRequestForm.hoursPerWeek),
      vacationDays: toOptionalNumber(contractUpdateRequestForm.vacationDays),
      salaryScalePoint: toOptionalNumber(contractUpdateRequestForm.salaryScalePoint),
      jobPosition: contractUpdateRequestForm.jobPosition.trim() || null,
      benefits: benefits.length > 0 ? benefits : null,
      startDate: contractUpdateRequestForm.startDate || null,
      endDate: contractUpdateRequestForm.endDate || null
    };

    const hasAnyChange = Object.values(payload).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null;
    });

    if (!hasAnyChange) {
      setRequestsNotice({
        type: "error",
        message: "Please provide at least one change for the contract update request."
      });
      return;
    }

    await runTask(
      "contract-update-request",
      "Request contract update",
      () =>
        apiRequest(`/api/request/internal/request/contract/${contractId}`, {
          method: "POST",
          body: payload,
          token
        }),
      {
        successMessage: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            return `Contract update request submitted. Tracking number: ${requestId}.`;
          }
          return `Contract update request submitted (HTTP ${response.status}).`;
        },
        onSuccess: (response) => {
          const requestId = response.data?.id;
          if (requestId) {
            setRequestLookupForm({ requestId });
            setDocumentResponseForm((previous) => ({ ...previous, requestId }));
            setDocumentUploadForm((previous) => ({ ...previous, requestId, file: null }));
            setRequestEditForm((previous) => ({
              ...previous,
              requestId
            }));
          }
          void loadMyRequests({ silent: true });
        }
      }
    );
  };

  const loadCurrentUserContract = async () => {
    const normalizedNetId = activeNetId.trim();
    if (!normalizedNetId) {
      setRequestsNotice({
        type: "error",
        message: "No active user in session. Please sign in again."
      });
      return;
    }

    await runTask(
      "load-current-contract",
      "Load my current contract",
      async () => {
        const employeeId = await resolveUserUuid(normalizedNetId, token);
        return apiRequest(`/api/contract/internal/contract/current/employee/${employeeId}`, {
          method: "GET",
          token
        });
      },
      {
        successMessage: (response) => {
          if (response.status === 204) {
            return "No contract found for your profile yet. Ask HR/Admin to create one first.";
          }
          const contractId = response.data?.id;
          if (contractId) {
            return `Current contract loaded (${contractId}). Fields were auto-filled.`;
          }
          return `Current contract loaded successfully (HTTP ${response.status}).`;
        },
        successActivity: (response) => {
          const contractId = response.data?.id;
          if (contractId) {
            return `Loaded contract ${contractId}.`;
          }
          return `Success (${response.status}).`;
        },
        onSuccess: (response) => {
          if (response.status === 204) {
            setCreateUserRequestForm((previous) => ({
              ...previous,
              contractId: ""
            }));
            setContractUpdateRequestForm((previous) => ({
              ...previous,
              contractId: "",
              hoursPerWeek: "",
              vacationDays: "",
              salaryScalePoint: "",
              jobPosition: "",
              benefits: "",
              startDate: "",
              endDate: ""
            }));
            return;
          }
          const contract = response.data || {};
          const terms = contract.contractTerms || {};
          const contractId = contract.id ? String(contract.id) : "";
          const benefitsText = Array.isArray(contract.benefits) ? contract.benefits.join(", ") : "";
          const jobName =
            typeof contract.jobPosition?.name === "string"
              ? contract.jobPosition.name
              : "";

          setCreateUserRequestForm((previous) => ({
            ...previous,
            contractId
          }));

          setContractUpdateRequestForm((previous) => ({
            ...previous,
            contractId,
            hoursPerWeek:
              terms.hoursPerWeek === null || terms.hoursPerWeek === undefined
                ? ""
                : String(terms.hoursPerWeek),
            vacationDays:
              terms.vacationDays === null || terms.vacationDays === undefined
                ? ""
                : String(terms.vacationDays),
            salaryScalePoint:
              terms.salaryScalePoint === null || terms.salaryScalePoint === undefined
                ? ""
                : String(terms.salaryScalePoint),
            jobPosition: jobName,
            benefits: benefitsText,
            startDate: normalizeDateForInput(terms.startDate),
            endDate: normalizeDateForInput(terms.endDate)
          }));
        }
      }
    );
  };

  const respondToDocumentRequest = async (event) => {
    event.preventDefault();
    const requestId = documentResponseForm.requestId.trim();
    const responseBody = documentResponseForm.responseBody.trim();
    if (!requestId || !responseBody) {
      setRequestsNotice({
        type: "error",
        message: "Please provide request number and your response."
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

    await runTask("document-response", "Submit document response", () =>
      apiRequest(`/api/request/internal/request/document/respond/${requestId}`, {
        method: "PUT",
        body: responseBody,
        token
      })
    );
  };

  const checkRequestStatus = async (event) => {
    event.preventDefault();
    const requestId = requestLookupForm.requestId.trim();
    if (!requestId) {
      setRequestsNotice({
        type: "error",
        message: "Please enter a request number to check."
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

    await runTask(
      "request-status",
      "Check request status",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}`, {
          method: "GET",
          token
        }),
      {
        successMessage: (response) => {
          const status = response.data?.requestStatus;
          if (status) {
            return `Request status: ${formatEnumLabel(status)}.`;
          }
          return `Request found successfully (HTTP ${response.status}).`;
        },
        successActivity: (response) => {
          const status = response.data?.requestStatus;
          if (status) {
            return `Status is ${formatEnumLabel(status)}.`;
          }
          return `Success (${response.status}).`;
        }
      }
    );
  };

  const loadRequestAttachments = async (requestIdInput, { silent = false } = {}) => {
    const requestId = String(requestIdInput || "").trim();
    if (!requestId) {
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message: "Enter a request number first to load attachments."
        });
      }
      return;
    }
    if (!isUuid(requestId)) {
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message: "Request number must be a valid UUID."
        });
      }
      return;
    }

    setIsAttachmentsLoading(true);
    try {
      const response = await apiRequest(`/api/request/internal/request/${requestId}/attachments`, {
        method: "GET",
        token
      });
      const attachments = Array.isArray(response.data) ? response.data : [];
      setAttachmentsRequestId(requestId);
      setRequestAttachmentList(attachments);
      if (!silent) {
        setRequestsNotice({
          type: "success",
          message:
            attachments.length === 0
              ? "No PDF attachments for this request yet."
              : `Loaded ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}.`
        });
      }
    } catch (error) {
      const message = formatApiError(error);
      if (!silent) {
        setRequestsNotice({
          type: "error",
          message
        });
      }
      pushActivity("Load attachments failed", message, "error");
    } finally {
      setIsAttachmentsLoading(false);
    }
  };

  const uploadRequestAttachment = async (event) => {
    event.preventDefault();
    const requestId = documentUploadForm.requestId.trim();
    if (!requestId || !isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Provide a valid request UUID before uploading."
      });
      return;
    }

    const fileValidationMessage = validatePdfUpload(documentUploadForm.file);
    if (fileValidationMessage) {
      setRequestsNotice({
        type: "error",
        message: fileValidationMessage
      });
      return;
    }

    const formData = createMultipartFilePayload(documentUploadForm.file);

    await runTask(
      "upload-request-attachment",
      "Upload request document",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}/attachments`, {
          method: "POST",
          rawBody: formData,
          token
        }),
      {
        successMessage: (response) => {
          const name = response.data?.fileName;
          return name
            ? `Uploaded ${name} successfully.`
            : `Attachment uploaded successfully (HTTP ${response.status}).`;
        },
        onSuccess: () => {
          setDocumentUploadForm((previous) => ({
            ...previous,
            file: null
          }));
          void loadRequestAttachments(requestId, { silent: true });
        }
      }
    );
  };

  const downloadRequestAttachment = async (attachment) => {
    const attachmentId = attachment?.id;
    if (!attachmentId) {
      return;
    }

    setActiveAttachmentId(attachmentId);
    try {
      const response = await apiRequest(`/api/request/internal/request/attachments/${attachmentId}`, {
        method: "GET",
        token,
        headers: { Accept: "application/pdf" },
        responseType: "blob"
      });

      const blob = response.data;
      const fileName = sanitizeFileNameForDownload(attachment.fileName, `request-${attachment.requestId}.pdf`);
      triggerFileDownload(blob, fileName);
    } catch (error) {
      const message = formatApiError(error);
      setRequestsNotice({
        type: "error",
        message
      });
      pushActivity("Download attachment failed", message, "error");
    } finally {
      setActiveAttachmentId("");
    }
  };

  const deleteRequestAttachment = async (attachmentId) => {
    if (!attachmentId) {
      return;
    }

    await runTask(
      `delete-request-attachment-${attachmentId}`,
      "Delete attachment",
      () =>
        apiRequest(`/api/request/internal/request/attachments/${attachmentId}`, {
          method: "DELETE",
          token
        }),
      {
        onSuccess: () => {
          if (attachmentsRequestId) {
            void loadRequestAttachments(attachmentsRequestId, { silent: true });
          }
        }
      }
    );
  };

  const updateOwnRequest = async (event) => {
    event.preventDefault();
    const requestId = requestEditForm.requestId.trim();
    if (!requestId || !isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Provide a valid request UUID before updating."
      });
      return;
    }

    const payload = {};
    if (requestEditForm.requestBody.trim()) {
      payload.requestBody = requestEditForm.requestBody.trim();
    }
    if (requestEditForm.contractId.trim()) {
      if (!isUuid(requestEditForm.contractId.trim())) {
        setRequestsNotice({
          type: "error",
          message: "Contract ID must be a valid UUID."
        });
        return;
      }
      payload.contractId = requestEditForm.contractId.trim();
    }
    if (requestEditForm.startDate) {
      payload.startDate = `${requestEditForm.startDate}T09:00:00`;
    }
    if (requestEditForm.numberOfDays !== "") {
      const parsed = Number(requestEditForm.numberOfDays);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setRequestsNotice({
          type: "error",
          message: "Number of days must be a whole number >= 0."
        });
        return;
      }
      payload.numberOfDays = parsed;
    }

    if (Object.keys(payload).length === 0) {
      setRequestsNotice({
        type: "error",
        message: "Provide at least one field to update."
      });
      return;
    }

    await runTask(
      "update-own-request",
      "Update my request",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}`, {
          method: "PUT",
          body: payload,
          token
        }),
      {
        onSuccess: () => {
          void loadMyRequests({ silent: true });
        }
      }
    );
  };

  const cancelOwnRequest = async (requestIdInput) => {
    const requestId = String(requestIdInput || "").trim();
    if (!requestId || !isUuid(requestId)) {
      setRequestsNotice({
        type: "error",
        message: "Provide a valid request UUID before cancelling."
      });
      return;
    }

    await runTask(
      "cancel-own-request",
      "Cancel my request",
      () =>
        apiRequest(`/api/request/internal/request/${requestId}`, {
          method: "DELETE",
          token
        }),
      {
        onSuccess: () => {
          void loadMyRequests({ silent: true });
          setRequestAttachmentList([]);
          setAttachmentsRequestId("");
        }
      }
    );
  };

  const openRequestWorkspaceContext = (requestItem) => {
    const requestId = String(requestItem?.id || "");
    if (!requestId) {
      return;
    }

    setRequestLookupForm({ requestId });
    setDocumentResponseForm((previous) => ({ ...previous, requestId }));
    setDocumentUploadForm((previous) => ({ ...previous, requestId, file: null }));
    setRequestEditForm({
      requestId,
      contractId: requestItem?.contractId ? String(requestItem.contractId) : "",
      requestBody: requestItem?.requestBody || "",
      startDate: normalizeDateForInput(requestItem?.startDate),
      numberOfDays:
        requestItem?.numberOfDays === null || requestItem?.numberOfDays === undefined
          ? ""
          : String(requestItem.numberOfDays)
    });

    void loadRequestAttachments(requestId, { silent: true });
  };

  return {
    loadPersonalDashboard,
    loadMyRequests,
    submitUserRequest,
    requestContractUpdate,
    loadCurrentUserContract,
    respondToDocumentRequest,
    checkRequestStatus,
    loadRequestAttachments,
    uploadRequestAttachment,
    downloadRequestAttachment,
    deleteRequestAttachment,
    updateOwnRequest,
    cancelOwnRequest,
    openRequestWorkspaceContext
  };
}
