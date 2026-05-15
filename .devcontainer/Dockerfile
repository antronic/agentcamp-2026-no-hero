FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install Bun system-wide so it is accessible to all users (including vscode)
RUN BUN_INSTALL=/usr/local curl -fsSL https://bun.sh/install | bash

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
