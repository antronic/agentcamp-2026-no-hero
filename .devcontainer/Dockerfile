FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install Bun system-wide so it is accessible to all users (including vscode)
# BUN_INSTALL must be set for the bash process, not just curl
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
