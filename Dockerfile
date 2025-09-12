FROM mcr.microsoft.com/playwright:focal
WORKDIR /app

# Install dependencies based on package-lock.json for reproducible installs
COPY package*.json ./
RUN npm ci

# Copy repository files
COPY . .

# Ensure Playwright browsers and deps are available (image usually includes them,
# this is a safe no-op if they are already installed)
RUN npx playwright install --with-deps

ENV CI=true

# Default entry runs the test suite; override with docker run or docker-compose command if needed
ENTRYPOINT ["npx", "playwright", "test"]