#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${ROOT_DIR}/.run"

stop_pid_file() {
  local pid_file="$1"
  local name
  local pid

  name="$(basename "${pid_file}" .pid)"
  pid="$(cat "${pid_file}")"

  if kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" 2>/dev/null || true
    echo "[ok] stopped ${name} (pid ${pid})"
  else
    echo "[skip] ${name} is not running"
  fi

  rm -f "${pid_file}"
}

if [[ -d "${RUN_DIR}" ]]; then
  shopt -s nullglob
  for pid_file in "${RUN_DIR}"/*.pid; do
    stop_pid_file "${pid_file}"
  done
  shopt -u nullglob
fi

cd "${ROOT_DIR}"
docker compose -f docker-compose.postgres.yml stop postgres

echo
echo "Stopped backend services and Postgres container."
