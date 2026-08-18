FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm install

COPY . .

# Environment variables for dev
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ARG API_BACKEND_URL
ENV API_BACKEND_URL=${API_BACKEND_URL}

EXPOSE 3000

CMD ["npm", "run", "dev"]