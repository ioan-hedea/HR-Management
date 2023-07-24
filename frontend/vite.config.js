import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const targets = {
    auth: env.VITE_AUTH_SERVICE_URL || "http://localhost:8081",
    user: env.VITE_USER_SERVICE_URL || "http://localhost:8082",
    contract: env.VITE_CONTRACT_SERVICE_URL || "http://localhost:8083",
    request: env.VITE_REQUEST_SERVICE_URL || "http://localhost:8084",
    notification: env.VITE_NOTIFICATION_SERVICE_URL || "http://localhost:8085",
    gateway: env.VITE_GATEWAY_URL || "http://localhost:8080"
  };

  const buildProxy = (target, namespace) => ({
    target,
    changeOrigin: true,
    rewrite: (path) => path.replace(new RegExp(`^/api/${namespace}`), "")
  });

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api/auth": buildProxy(targets.auth, "auth"),
        "/api/user": buildProxy(targets.user, "user"),
        "/api/contract": buildProxy(targets.contract, "contract"),
        "/api/request": buildProxy(targets.request, "request"),
        "/api/notification": buildProxy(targets.notification, "notification"),
        "/api/gateway": buildProxy(targets.gateway, "gateway")
      }
    }
  };
});
