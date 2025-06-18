FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# for arm64 support we need to install chromium provided by debian
# npm ERR! The chromium binary is not available for arm64.
# https://github.com/puppeteer/puppeteer/issues/7740

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update && \
    apt-get install -y wget gnupg && \
    apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    libgtk2.0-0 libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2 && \
    apt-get install -y chromium && \
    apt-get clean

# Only copy the specific files needed to build
COPY src/puppeteer/package.json /project/package.json
COPY src/puppeteer/index.ts /project/index.ts

# Create tsconfig.json for TypeScript compilation
RUN echo '{ \
    "compilerOptions": { \
    "target": "ES2020", \
    "module": "NodeNext", \
    "moduleResolution": "NodeNext", \
    "esModuleInterop": true, \
    "outDir": "dist", \
    "strict": true, \
    "skipLibCheck": true \
    }, \
    "include": ["*.ts"] \
    }' > /project/tsconfig.json

WORKDIR /project

RUN npm install && \
    npx tsc && \
    chmod +x dist/*.js

ENTRYPOINT ["node", "dist/index.js"]