#!/usr/bin/env bash
#
# 以「真实后端」模式启动 H5 联调环境（vite dev proxy -> 127.0.0.1:8080）。
#
# 用法：
#   scripts/dev-real.sh start    # 后台启动（默认）
#   scripts/dev-real.sh stop     # 停止
#   scripts/dev-real.sh restart  # 重启
#   scripts/dev-real.sh status   # 查看 pid / 监听 / 首页状态码
#
# 说明：
#   - VITE_COSEN_USE_MOCK=false 关闭 mock；
#   - VITE_COSEN_API_BASE_URL='' 让 baseURL 留空，浏览器走同源 /app/**，
#     再由 vite.config.ts 的 proxy 转发到 http://127.0.0.1:8080（绕开 CORS）；
#   - 日志：/tmp/cosen-h5-real.log，pid：/tmp/cosen-h5-real.pid；
#   - 只管理本 H5 dev server（5173），不会碰 8080 后端。
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="${COSEN_H5_REAL_PID:-/tmp/cosen-h5-real.pid}"
LOG_FILE="${COSEN_H5_REAL_LOG:-/tmp/cosen-h5-real.log}"
PORT="${COSEN_H5_REAL_PORT:-5173}"
APP_URL="http://127.0.0.1:${PORT}/"

export PATH="${HOME}/.nvm/versions/node/v24.21.0/bin:${PATH}"
cd "${ROOT_DIR}"

listener_pids() {
  lsof -tiTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true
}

pid_alive() {
  [[ -f "${PID_FILE}" ]] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null
}

status() {
  if pid_alive; then
    echo "running: pid $(cat "${PID_FILE}")"
  else
    echo "stopped (pid file: ${PID_FILE})"
  fi
  local listeners
  listeners="$(listener_pids)"
  if [[ -n "${listeners}" ]]; then
    echo "listening on ${PORT}: ${listeners}"
  else
    echo "no listener on ${PORT}"
  fi
  if command -v curl >/dev/null 2>&1 && [[ -n "${listeners}" ]]; then
    echo "http ${PORT}: $(curl -s -o /dev/null -w '%{http_code}' "${APP_URL}")"
  fi
}

stop() {
  local pid=""
  if [[ -f "${PID_FILE}" ]]; then
    pid="$(cat "${PID_FILE}")"
  fi
  if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" 2>/dev/null || true
  fi
  # npm -> uni -> vite 可能多进程，按端口兜底（只针对 H5 dev 端口，不碰 8080）
  local listeners
  listeners="$(listener_pids)"
  if [[ -n "${listeners}" ]]; then
    # shellcheck disable=SC2086
    kill ${listeners} 2>/dev/null || true
    sleep 1
    # shellcheck disable=SC2086
    kill -9 ${listeners} 2>/dev/null || true
  fi
  rm -f "${PID_FILE}"
  echo "stopped (pid ${pid:-unknown}, port ${PORT})"
}

start() {
  if pid_alive || [[ -n "$(listener_pids)" ]]; then
    echo "already running, use '$0 restart' to reload"
    status
    exit 0
  fi
  : >"${LOG_FILE}"
  VITE_COSEN_USE_MOCK=false VITE_COSEN_API_BASE_URL='' \
    nohup npm run dev:h5 >"${LOG_FILE}" 2>&1 &
  echo $! >"${PID_FILE}"
  echo "started pid $(cat "${PID_FILE}")"
  echo "log: ${LOG_FILE}"
  echo "url: ${APP_URL} (tailnet: http://100.116.44.85:${PORT}/)"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  *)
    echo "usage: $0 {start|stop|restart|status}" >&2
    exit 1
    ;;
esac
