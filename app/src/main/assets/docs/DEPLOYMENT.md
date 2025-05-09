# Deployment Guide

This guide details the steps to deploy and configure the Epher Secure Chat application in various environments.

## System Requirements

### Minimum Requirements
- Node.js >= 14.0.0
- Python 3.x (for development server)
- Modern web browser with:
  - WebCrypto API support
  - Web Workers support
  - IndexedDB support
  - Service Workers support

### Recommended Hardware
- CPU: 2+ cores
- RAM: 4GB+
- Storage: 1GB+ free space

## Installation

### 1. Basic Setup

```bash
# Clone the repository
git clone https://github.com/your-org/epher-chat.git

# Navigate to project directory
cd epher-chat

# Install dependencies
npm install

# Verify installation
npm test
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
# Environment
NODE_ENV=production

# Security Settings
CSRF_TOKEN_LENGTH=32
SESSION_TIMEOUT=1800000
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=30

# Logging
LOG_LEVEL=info
MAX_LOG_SIZE=5242880
LOG_RETENTION_DAYS=30
```

### 3. SSL/TLS Configuration

The application requires HTTPS in production. Set up SSL certificates:

```bash
# Generate self-signed certificates for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private.key -out certificate.crt

# For production, use proper SSL certificates from a trusted CA
```

## Development Environment

### Local Development Server

```bash
# Start development server
npm run serve

# Run with hot reloading
npm run serve:dev

# Run with debugging
npm run serve:debug
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test utils
npm test crypto
npm test network

# Generate coverage report
npm run test:coverage
```

## Production Deployment

### 1. Build Process

```bash
# Create production build
npm run build

# Verify build
npm run verify
```

### 2. Server Configuration

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Root directory
    root /var/www/epher-chat/dist;
    index index.html;

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Service worker path
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Main application
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/epher-chat/dist

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"

    # Caching
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|woff2)$">
        Header set Cache-Control "max-age=2592000, public"
    </FilesMatch>

    # Service worker
    <Files "service-worker.js">
        Header set Cache-Control "no-cache"
        Header set Expires 0
    </Files>

    <Directory /var/www/epher-chat/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 3. Database Setup

The application uses IndexedDB for client-side storage. No server-side database is required.

### 4. Monitoring Setup

#### Application Monitoring

```javascript
// Monitor client-side errors
window.addEventListener('error', function(e) {
    logger.error('Global', 'Uncaught error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
    });
});

// Monitor unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    logger.error('Global', 'Unhandled promise rejection', {
        reason: e.reason
    });
});
```

#### Health Checks

Create a health check endpoint:

```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        version: process.env.npm_package_version
    });
});
```

### 5. Backup Strategy

- Client-side data is stored in IndexedDB
- Users should be encouraged to export important conversations
- Regular cleanup of expired messages is automatic

## Security Considerations

1. **SSL/TLS Configuration**
   - Use only TLS 1.2 and 1.3
   - Configure secure cipher suites
   - Enable HSTS

2. **Content Security Policy**
   - Restrict resource origins
   - Prevent XSS attacks
   - Control script execution

3. **File Upload Security**
   - Validate file types
   - Enforce size limits
   - Scan for malware

4. **Rate Limiting**
   - Configure appropriate limits
   - Monitor for abuse
   - Implement gradual backoff

## Troubleshooting

### Common Issues

1. **Service Worker Registration Failed**
   ```javascript
   // Check if service worker is supported
   if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/service-worker.js')
           .catch(error => logger.error('ServiceWorker', 'Registration failed', { error }));
   }
   ```

2. **IndexedDB Initialization Failed**
   - Check browser compatibility
   - Verify storage permissions
   - Clear browser data if needed

3. **WebCrypto API Unavailable**
   - Ensure HTTPS is properly configured
   - Check browser compatibility
   - Verify security headers

### Logging

- Check browser console for errors
- Review application logs
- Monitor server logs

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor error logs
   - Check system health
   - Review security alerts

2. **Weekly**
   - Update dependencies
   - Review performance metrics
   - Backup configurations

3. **Monthly**
   - Security patches
   - SSL certificate check
   - Performance optimization

### Updates

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Apply security fixes
npm audit fix
```

## Support

For technical support:
- Email: support@example.com
- GitHub Issues: https://github.com/your-org/epher-chat/issues
- Documentation: https://docs.epher-chat.example.com
