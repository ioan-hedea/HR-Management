export default function AuthScreen({
  authMode,
  setAuthMode,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  rememberSession,
  setRememberSession,
  isLoginLoading,
  isRegisterLoading,
  login,
  registerFromAuth,
  authNotice
}) {
  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <p className="brand-kicker">HR MANAGEMENT SUITE</p>
        <h1>Sign in first, then continue to your portal</h1>
        <p>
          This app now has dedicated portal routes for users and admins, with a role-aware sidebar navigation.
        </p>
        <ul className="auth-points">
          <li>Route flow: /login to /portal/me</li>
          <li>Role-based sections and action visibility</li>
          <li>Dedicated admin center for HR operations</li>
        </ul>
        <p className="auth-note">
          Bootstrap admin: <code>ADMIN</code> with password from
          <code> BOOTSTRAP_ADMIN_PASSWORD</code>.
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-switch">
          <button
            type="button"
            className={authMode === "login" ? "active" : ""}
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === "register" ? "active" : ""}
            onClick={() => setAuthMode("register")}
          >
            Register
          </button>
        </div>

        {authMode === "login" ? (
          <form className="stack" onSubmit={login}>
            <label>
              NetID
              <input
                value={loginForm.netId}
                onChange={(event) =>
                  setLoginForm((previous) => ({ ...previous, netId: event.target.value }))
                }
                placeholder="e.g. ADMIN"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="your password"
                required
              />
            </label>

            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(event) => setRememberSession(event.target.checked)}
              />
              Keep me signed in on this device
            </label>

            <button type="submit" disabled={isLoginLoading}>
              {isLoginLoading ? "Signing in..." : "Enter portal"}
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={registerFromAuth}>
            <label>
              NetID
              <input
                value={registerForm.netId}
                onChange={(event) =>
                  setRegisterForm((previous) => ({ ...previous, netId: event.target.value }))
                }
                placeholder="e.g. jane"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="create password"
                required
              />
            </label>

            <button type="submit" disabled={isRegisterLoading}>
              {isRegisterLoading ? "Creating..." : "Create account"}
            </button>
          </form>
        )}

        {authNotice && <p className={`notice ${authNotice.type}`}>{authNotice.text}</p>}
      </section>
    </main>
  );
}
