#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${ROOT_DIR}/.run"

mkdir -p "${RUN_DIR}"

cd "${ROOT_DIR}"

if [[ -f "${ROOT_DIR}/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env.local"
  set +a
elif [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

required_vars=(
  JWT_SECRET
  BOOTSTRAP_ADMIN_PASSWORD
  POSTGRES_USER
  POSTGRES_PASSWORD
  POSTGRES_DB
  AUTH_DB_PASSWORD
  USER_DB_PASSWORD
  CONTRACT_DB_PASSWORD
  REQUEST_DB_PASSWORD
  NOTIFICATION_DB_PASSWORD
  MAIL_USERNAME
  MAIL_PASSWORD
)

missing_vars=()
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    missing_vars+=("${var_name}")
  fi
done

if (( ${#missing_vars[@]} > 0 )); then
  echo "[error] Missing required environment variables:"
  printf '  - %s\n' "${missing_vars[@]}"
  echo "Create .env.local from .env.example and set real values, then rerun."
  exit 1
fi

JAVA_VERSION="$(
  java -version 2>&1 | awk -F[\".] '/version/ {print $2; exit}'
)"

if [[ -n "${JAVA_VERSION}" ]] && [[ "${JAVA_VERSION}" -gt 17 ]]; then
  echo "[error] Detected Java ${JAVA_VERSION}. Gradle 7.4 in this repo requires Java 17 or lower."
  echo "Use Java 11 or Java 17, then rerun this script."
  exit 1
fi

docker compose -f docker-compose.postgres.yml up -d

wait_for_port() {
  local name="$1"
  local port="$2"
  local pid="$3"
  local log_file="$4"
  local max_attempts=120
  local attempt=1

  while (( attempt <= max_attempts )); do
    if ! kill -0 "${pid}" 2>/dev/null; then
      echo "[error] ${name} exited before becoming ready."
      echo "---- ${name} log tail ----"
      tail -n 120 "${log_file}" || true
      echo "--------------------------"
      return 1
    fi

    if lsof -iTCP:"${port}" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
      echo "[ok] ${name} is ready on port ${port}"
      return 0
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  echo "[error] ${name} did not become ready on port ${port} in time."
  echo "---- ${name} log tail ----"
  tail -n 120 "${log_file}" || true
  echo "--------------------------"
  return 1
}

start_service() {
  local name="$1"
  local port="$2"
  shift 2

  local log_file="${RUN_DIR}/${name}.log"
  local pid_file="${RUN_DIR}/${name}.pid"

  if [[ -f "${pid_file}" ]] && kill -0 "$(cat "${pid_file}")" 2>/dev/null; then
    echo "[skip] ${name} already running (pid $(cat "${pid_file}"))"
    if lsof -iTCP:"${port}" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
      echo "[ok] ${name} is listening on ${port}"
      return
    fi
    echo "[warn] ${name} process exists but port ${port} is not open yet."
    return
  fi

  SPRING_PROFILES_ACTIVE=postgres "$@" >"${log_file}" 2>&1 &
  local pid=$!
  echo "${pid}" >"${pid_file}"
  echo "[ok] started ${name} (pid ${pid})"

  wait_for_port "${name}" "${port}" "${pid}" "${log_file}"
}

start_service registry 8761 ./gradlew :gateway:registry:bootRun
start_service auth 8081 ./gradlew :authentication-microservice:bootRun
start_service user 8082 ./gradlew :user:microservice:bootRun
start_service contract 8083 ./gradlew :contract:microservice:bootRun
start_service request 8084 ./gradlew :request:microservice:bootRun
start_service notification 8085 ./gradlew :notification:microservice:bootRun
start_service gateway 8080 ./gradlew :gateway:router:bootRun

echo
echo "Backend + Postgres are up."
echo "Logs: ${RUN_DIR}/*.log"
echo "Use ./scripts/backend-postgres-down.sh to stop everything."
