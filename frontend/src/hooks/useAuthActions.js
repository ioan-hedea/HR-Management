export function useAuthActions({
  apiRequest,
  formatApiError,
  validateCredentials,
  registerForm,
  setRegisterForm,
  loginForm,
  setLoginForm,
  setAuthMode,
  setAuthNotice,
  setAdminNotice,
  setIsRegisterLoading,
  setIsLoginLoading,
  rememberSession,
  saveSession,
  pushActivity,
  navigate,
  getDefaultPortalPath
}) {
  const performRegister = async (switchToLogin) => {
    const registerPayload = {
      netId: registerForm.netId.trim(),
      password: registerForm.password
    };
    const credentialError = validateCredentials(registerPayload.netId, registerPayload.password);
    if (credentialError) {
      if (switchToLogin) {
        setAuthNotice({ type: "error", text: credentialError });
      } else {
        setAdminNotice({ type: "error", text: credentialError });
      }
      return;
    }

    setIsRegisterLoading(true);
    setAdminNotice(null);
    setAuthNotice(null);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: registerPayload
      });

      const message = `Account for ${registerPayload.netId} was created successfully.`;
      if (switchToLogin) {
        setAuthNotice({ type: "success", text: message });
        setLoginForm((previous) => ({ ...previous, netId: registerPayload.netId }));
        setAuthMode("login");
      } else {
        setAdminNotice({ type: "success", text: message });
      }

      pushActivity("Registration success", message, "success");
    } catch (error) {
      const message = formatApiError(error);
      if (switchToLogin) {
        setAuthNotice({ type: "error", text: message });
      } else {
        setAdminNotice({ type: "error", text: message });
      }
      pushActivity("Registration failed", message, "error");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const registerFromAuth = async (event) => {
    event.preventDefault();
    await performRegister(true);
  };

  const registerFromAdmin = async (event) => {
    event.preventDefault();
    await performRegister(false);
  };

  const login = async (event) => {
    event.preventDefault();
    setIsLoginLoading(true);
    setAuthNotice(null);

    try {
      const response = await apiRequest("/api/auth/authenticate", {
        method: "POST",
        body: loginForm
      });

      const nextToken = response.data?.token;
      if (!nextToken) {
        throw new Error("Authentication response did not include a token.");
      }

      const session = saveSession(nextToken, loginForm.netId, rememberSession);
      setAuthNotice({
        type: "success",
        text: `Authenticated as ${session.netId || loginForm.netId}.`
      });
      pushActivity("Login success", `Token stored for ${session.netId || loginForm.netId}.`, "success");
      navigate(getDefaultPortalPath());
    } catch (error) {
      const message = formatApiError(error);
      setAuthNotice({ type: "error", text: message });
      pushActivity("Login failed", message, "error");
    } finally {
      setIsLoginLoading(false);
    }
  };

  return {
    performRegister,
    registerFromAuth,
    registerFromAdmin,
    login
  };
}
