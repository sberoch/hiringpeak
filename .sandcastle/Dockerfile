FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm as a real global npm package. Avoids corepack's per-user
# activation state (which doesn't transfer cleanly from build-time root
# to runtime agent user) and its first-run network fetch. Version pinned
# to match the host repo's packageManager field.
RUN npm install -g pnpm@10.4.1

# Install stdio-decoupling shims for package managers that fork daemons.
# pnpm/npm/corepack helpers can leak file descriptors that keep claude-code's
# stdout pipe open after claude-code itself exits, causing sandcastle to wait
# the full 10-minute idle timeout. The shim runs each in a new session with
# stdio redirected to a tempfile (which is tailed back to the caller).
COPY safeexec.sh /usr/local/lib/safeexec.sh
RUN chmod +x /usr/local/lib/safeexec.sh \
  && mkdir -p /usr/local/safeexec-bin \
  && for tool in pnpm npm npx corepack; do \
       ln -s /usr/local/lib/safeexec.sh /usr/local/safeexec-bin/$tool; \
     done

# Rename the base image's "node" user (UID 1000) to "agent".
# This keeps UID 1000 so that --userns=keep-id (Podman) and
# --user 1000:1000 (Docker) map to the correct home directory owner.
RUN usermod -d /home/agent -m -l agent node
USER agent

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Add Claude and the safeexec shims to PATH. Shim dir comes BEFORE the
# default bin dirs so symlinked names (pnpm/npm/npx/corepack) take priority
# over the real binaries.
ENV PATH="/home/agent/.local/bin:/usr/local/safeexec-bin:$PATH"

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["sleep", "infinity"]
