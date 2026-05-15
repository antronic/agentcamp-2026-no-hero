FROM mcr.microsoft.com/devcontainers/base:alpine

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Install Azure CLI (for DefaultAzureCredential in demo 03)
RUN apk add --no-cache python3 py3-pip \
    && pip3 install --break-system-packages azure-cli