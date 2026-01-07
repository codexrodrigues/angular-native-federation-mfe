#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASES_PATH="$ROOT/releases"
MODE="${1-}"

if [[ "${MODE}" == "-h" || "${MODE}" == "--help" ]]; then
  echo "Usage: ./start-demo.sh [--serve]"
  echo ""
  echo "Steps:"
  echo "  - Build shared-logic and pack tarball into releases/"
  echo "  - Build shared-ui-lib"
  echo "  - Install and build host and remotes"
  echo ""
  echo "Options:"
  echo "  --serve   start dist servers after build"
  exit 0
fi

echo "=================================================="
echo "  MFE Platform Demo - prepare and build"
echo "=================================================="

mkdir -p "${RELEASES_PATH}"

echo ""
echo ">>> Cleaning native federation cache..."
cache_paths=(
  "${ROOT}/host-shell/node_modules/.cache/native-federation"
  "${ROOT}/remote-sales/node_modules/.cache/native-federation"
  "${ROOT}/remote-gde/node_modules/.cache/native-federation"
  "${ROOT}/remote-accounts/node_modules/.cache/native-federation"
)

for path in "${cache_paths[@]}"; do
  if [[ -d "${path}" ]]; then
    rm -rf "${path}"
  fi
done

step=1
total_steps=12

echo ""
echo ">>> [${step}/${total_steps}] Build shared-logic..."
step=$((step + 1))
pushd "${ROOT}/shared-logic" >/dev/null
npm install
npm run build
mkdir -p "${ROOT}/shared-logic/node_modules/.cache/npm"
npm pack --pack-destination "${RELEASES_PATH}" --cache "${ROOT}/shared-logic/node_modules/.cache/npm"
shared_logic_version="$(node -p "require('./package.json').version")"
shared_logic_pack="${RELEASES_PATH}/shared-logic-${shared_logic_version}.tgz"
shared_logic_stable="${RELEASES_PATH}/shared-logic.tgz"
if [[ -f "${shared_logic_pack}" ]]; then
  cp "${shared_logic_pack}" "${shared_logic_stable}"
fi
if [[ -f "${shared_logic_stable}" ]]; then
  echo ">>> Updating shared-logic integrity in package-locks..."
  shared_logic_integrity="$(
    node -e 'const fs=require("fs"); const crypto=require("crypto"); const path=process.argv[1]; const data=fs.readFileSync(path); const hash=crypto.createHash("sha512").update(data).digest("base64"); process.stdout.write("sha512-"+hash);' \
      "${shared_logic_stable}"
  )"
  lock_files=(
    "${ROOT}/host-shell/package-lock.json"
    "${ROOT}/remote-sales/package-lock.json"
    "${ROOT}/remote-gde/package-lock.json"
    "${ROOT}/remote-accounts/package-lock.json"
  )
  for lock in "${lock_files[@]}"; do
    if [[ -f "${lock}" ]]; then
      node -e 'const fs=require("fs"); const [lockPath, integrity]=process.argv.slice(1); let text=fs.readFileSync(lockPath,"utf8"); const re=/("node_modules\/shared-logic"\s*:\s*\{[\s\S]*?"integrity"\s*:\s*")[^"]+(")/; if (!re.test(text)) process.exit(0); text=text.replace(re, (_, p1, p2) => p1 + integrity + p2); fs.writeFileSync(lockPath, text);' \
        "${lock}" \
        "${shared_logic_integrity}"
    fi
  done
fi
popd >/dev/null

echo ""
echo ">>> [${step}/${total_steps}] Build shared-ui-lib..."
step=$((step + 1))
pushd "${ROOT}/shared-ui-lib" >/dev/null
npm install
npm run build
popd >/dev/null

apps=(host-shell remote-sales remote-gde remote-accounts remote-credito)
for app in "${apps[@]}"; do
  echo ""
  echo ">>> [${step}/${total_steps}] Install ${app}..."
  step=$((step + 1))
  pushd "${ROOT}/${app}" >/dev/null
  npm run install:legacy
  popd >/dev/null
done

for app in "${apps[@]}"; do
  echo ""
  echo ">>> [${step}/${total_steps}] Build ${app}..."
  step=$((step + 1))
  pushd "${ROOT}/${app}" >/dev/null
  if [[ "${app}" == "remote-credito" ]]; then
    npm run build:element
  else
    npm run build
  fi
  popd >/dev/null
done

echo ""
echo "=================================================="
echo "  Build complete"
echo "=================================================="

if [[ "${MODE}" == "--serve" ]]; then
  echo ""
  echo "Starting dist servers..."
  pids=()

  pushd "${ROOT}/remote-sales" >/dev/null
  npm run serve:dist &
  pids+=("$!")
  popd >/dev/null

  pushd "${ROOT}/remote-gde" >/dev/null
  npm run serve:dist &
  pids+=("$!")
  popd >/dev/null

  pushd "${ROOT}/remote-accounts" >/dev/null
  npm run serve:dist &
  pids+=("$!")
  popd >/dev/null

  pushd "${ROOT}/remote-credito" >/dev/null
  npm run serve:element &
  pids+=("$!")
  popd >/dev/null

  sleep 2

  pushd "${ROOT}/host-shell" >/dev/null
  npm run serve:dist &
  pids+=("$!")
  popd >/dev/null

  cleanup() {
    for pid in "${pids[@]}"; do
      kill "${pid}" 2>/dev/null || true
    done
  }

  trap cleanup INT TERM EXIT
  echo ""
  echo "Apps running. Press Ctrl+C to stop."
  wait
else
  echo ""
  echo "To serve the dist builds, run in separate terminals:"
  echo "  cd remote-sales && npm run serve:dist"
  echo "  cd remote-gde && npm run serve:dist"
  echo "  cd remote-accounts && npm run serve:dist"
  echo "  cd remote-credito && npm run serve:element"
  echo "  cd host-shell && npm run serve:dist"
fi
