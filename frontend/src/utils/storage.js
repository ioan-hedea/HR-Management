import { REMEMBER_SESSION_KEY } from "../constants/app";

export function readStorageValue(key) {
  if (typeof window === "undefined") {
    return "";
  }

  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) {
    return sessionValue;
  }

  return window.localStorage.getItem(key) || "";
}

export function readRememberSessionPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(REMEMBER_SESSION_KEY) === "true";
}
