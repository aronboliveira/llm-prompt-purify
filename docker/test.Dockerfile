FROM node:22-bookworm

# Install dependencies for Cypress
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright dependencies
RUN npx playwright install-deps chromium

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (use install instead of ci for flexibility)
RUN npm install --legacy-peer-deps

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source files
COPY . .

# Build extension
RUN npm run build:dev

# Default command runs all tests
CMD ["npm", "run", "test:all"]
