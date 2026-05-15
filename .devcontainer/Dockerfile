FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
