# Process Pipeline Creator - Deployment Guide

## Overview

This guide covers deploying the Process Pipeline Creator application to various environments, from local development to production deployment.

## Prerequisites

### System Requirements
- **Node.js**: 18+ (LTS recommended)
- **npm**: 9+ or **yarn**: 1.22+
- **Git**: Version control
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Tools
- **VS Code**: Recommended IDE
- **React Developer Tools**: Browser extension
- **TypeScript**: Language support

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd signavio-process-creator
```

### 2. Install Dependencies
```bash
# Client dependencies
cd client
npm install

# Server dependencies (future)
cd ../server
npm install
```

### 3. Environment Configuration
Create environment files:

**Client** (`client/.env.local`):
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_VERSION=1.0.0
```

**Server** (`server/.env`):
```bash
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 4. Start Development Servers
```bash
# Terminal 1 - Client
cd client
npm start

# Terminal 2 - Server (when available)
cd server
npm run dev
```

### 5. Access Application
- **Client**: http://localhost:3000
- **API**: http://localhost:3001 (when server is ready)

## Build Process

### Production Build
```bash
cd client
npm run build
```

### Build Optimization
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Bundle analysis
npm run analyze
```

### Build Output
```
client/build/
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── index.html
├── manifest.json
└── asset-manifest.json
```

## Deployment Options

### 1. Vercel Deployment (Recommended)

#### Setup
```bash
npm install -g vercel
vercel login
```

#### Deploy
```bash
cd client
vercel --prod
```

#### Configuration (`vercel.json`):
```json
{
  "name": "process-pipeline-creator",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "s-maxage=31536000,immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@api_url",
    "REACT_APP_VERSION": "@app_version"
  }
}
```

### 2. Netlify Deployment

#### Setup
```bash
npm install -g netlify-cli
netlify login
```

#### Deploy
```bash
cd client
npm run build
netlify deploy --prod --dir=build
```

#### Configuration (`netlify.toml`):
```toml
[build]
  base = "client"
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/api/*"
  to = "https://your-api-domain.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://your-api-domain.com"
```

### 3. AWS S3 + CloudFront

#### S3 Bucket Setup
```bash
# Create S3 bucket
aws s3 mb s3://your-bucket-name --region us-east-1

# Configure for static hosting
aws s3 website s3://your-bucket-name \
    --index-document index.html \
    --error-document index.html
```

#### Deploy to S3
```bash
cd client
npm run build
aws s3 sync build/ s3://your-bucket-name --delete
```

#### CloudFront Distribution
```json
{
  "CallerReference": "process-pipeline-creator",
  "Comment": "Process Pipeline Creator CDN",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-bucket-name",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-your-bucket-name",
        "DomainName": "your-bucket-name.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "Enabled": true
}
```

### 4. Docker Deployment

#### Dockerfile
```dockerfile
# Client build stage
FROM node:18-alpine as build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production

COPY client/ ./
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/client/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration (`nginx.conf`):
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;
        
        # Cache static assets
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy (when backend is ready)
        location /api/ {
            proxy_pass http://backend:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

#### Docker Compose (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=file:./data/prod.db
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Environment Configuration

### Development Environment
```bash
# client/.env.development
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
GENERATE_SOURCEMAP=true
```

### Staging Environment
```bash
# client/.env.staging
REACT_APP_API_URL=https://api-staging.yourdomain.com
REACT_APP_WS_URL=wss://api-staging.yourdomain.com
REACT_APP_ENV=staging
GENERATE_SOURCEMAP=false
```

### Production Environment
```bash
# client/.env.production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WS_URL=wss://api.yourdomain.com
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

## CI/CD Pipeline

### GitHub Actions

#### Workflow (`.github/workflows/deploy.yml`):
```yaml
name: Deploy Process Pipeline Creator

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      
      - name: Install dependencies
        working-directory: ./client
        run: npm ci
      
      - name: Run tests
        working-directory: ./client
        run: npm test -- --coverage --watchAll=false
      
      - name: Run type check
        working-directory: ./client
        run: npm run type-check
      
      - name: Run lint
        working-directory: ./client
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      
      - name: Install dependencies
        working-directory: ./client
        run: npm ci
      
      - name: Build application
        working-directory: ./client
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
          REACT_APP_VERSION: ${{ github.sha }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: client/build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          vercel-args: '--prod'
```

## Monitoring & Analytics

### Performance Monitoring
```typescript
// Performance monitoring setup
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Error Tracking
```typescript
// Error boundary for React
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send error to monitoring service
    console.error('App Error:', error, errorInfo);
  }
}
```

### Health Checks
```bash
# Health check endpoint
curl https://your-domain.com/health

# Expected response
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## Security Configuration

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://api.yourdomain.com wss://api.yourdomain.com;">
```

### HTTPS Configuration
```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## Backup & Recovery

### Database Backup (Future)
```bash
# SQLite backup
sqlite3 /path/to/database.db ".backup /path/to/backup.db"

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
sqlite3 /app/data/prod.db ".backup $BACKUP_DIR/database.db"
```

### Static Asset Backup
```bash
# S3 backup
aws s3 sync s3://your-bucket-name s3://your-backup-bucket --delete
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Environment Variables
```bash
# Check environment variables
echo $REACT_APP_API_URL
printenv | grep REACT_APP
```

### Performance Issues
- **Bundle Size**: Use `npm run analyze` to identify large dependencies
- **Loading Speed**: Implement code splitting and lazy loading
- **Runtime Performance**: Use React Profiler to identify bottlenecks

### Rollback Strategy
```bash
# Vercel rollback
vercel rollback [deployment-url]

# S3 rollback
aws s3 sync s3://your-backup-bucket s3://your-bucket-name
```

---

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] All features function as expected
- [ ] Performance metrics are acceptable
- [ ] Error monitoring is active
- [ ] Backup systems are configured
- [ ] SSL certificates are valid
- [ ] CDN is properly configured
- [ ] Database migrations completed (when applicable)
- [ ] Environment variables are correct
- [ ] Health checks pass

This deployment guide provides comprehensive instructions for deploying the Process Pipeline Creator in various environments with proper monitoring and security configurations.