#!/bin/sh
# stdio-decoupling shim. Symlinked to from pnpm / npm / npx / corepack.
#
# Package managers fork helpers and daemons (postinstall scripts, parallel
# install workers, store servers) that inherit the caller's stdout/stderr.
# When those leaked descendants outlive the caller's exit, they keep the
# caller's pipe open. Sandcastle reads claude-code's stdout pipe; if a
# leaked daemon is still holding it, sandcastle never sees EOF and waits
# the full 10-minute idle timeout, then aborts the iteration as a failure.
#
# This shim runs the real binary in a subshell with stdio redirected to a
# tempfile. Any descendant the real binary forks inherits the tempfile fds,
# NOT the caller's pipes. The shim tails the tempfile back to the caller
# so output stays visible.

self=$(basename "$0")
shim_dir=$(dirname "$(readlink -f "$0")")

# Strip our shim dir from PATH so `command -v` finds the real binary.
clean_path=$(printf '%s' ":$PATH:" | sed -e "s#:$shim_dir:#:#g" -e 's/^://' -e 's/:$//')
real=$(PATH="$clean_path" command -v "$self")
if [ -z "$real" ]; then
  echo "$self: real binary not found on PATH (excluding $shim_dir)" >&2
  exit 127
fi

log=$(mktemp -t safeexec.XXXXXX)
trap 'rm -f "$log"' EXIT

# Subshell isolates stdio: when the real binary and its synchronous
# descendants finish, the subshell exits. Async grandchildren that
# disowned themselves still hold the logfile fd, but the caller's
# pipe is owned only by us.
( "$real" "$@" </dev/null >"$log" 2>&1 ) &
pid=$!

# Tail the log to the caller's stdout. We kill tail explicitly when the
# real binary finishes — relying on tail's --pid is flaky across distros.
tail -n +1 -f "$log" 2>/dev/null &
tail_pid=$!

wait "$pid"
status=$?

# Let tail flush the trailing bytes, then stop it.
sleep 0.1
kill "$tail_pid" 2>/dev/null
wait "$tail_pid" 2>/dev/null

exit "$status"
