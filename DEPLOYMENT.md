# Deployment Guide - Admin Backend

This guide covers various deployment options for the Invitation Admin Backend.

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   cd node-backend
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   # Edit .env file with your actual values
   nano .env
   ```

3. **Setup database:**
   - Run `database.sql` in your Supabase SQL editor
   - This creates all required tables and default data

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   ./test-api.sh
   ```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Serverless)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/dist/index.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard**

### Option 2: Railway

1. **Connect GitHub repo to Railway**
2. **Set environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret`
   - `SUPABASE_URL=your-url`
   - `SUPABASE_SERVICE_KEY=your-key`
3. **Railway will auto-deploy on git push**

### Option 3: Render

1. **Create new Web Service on Render**
2. **Build Command:** `npm run build`
3. **Start Command:** `npm start`
4. **Set environment variables in dashboard**

### Option 4: DigitalOcean App Platform

1. **Create app from GitHub repo**
2. **Configure build:**
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. **Add environment variables**

### Option 5: Traditional VPS (Ubuntu/CentOS)

1. **Setup server:**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Install Nginx
   sudo apt update
   sudo apt install nginx
   ```

2. **Deploy code:**
   ```bash
   git clone your-repo
   cd node-backend
   npm install
   npm run build
   ```

3. **Create PM2 ecosystem file:**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'admin-backend',
       script: 'dist/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       }
     }]
   }
   ```

4. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx reverse proxy:**
   ```nginx
   # /etc/nginx/sites-available/admin-api
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable site and SSL:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/admin-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   
   # Install SSL with Let's Encrypt
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Option 6: Docker Deployment

1. **Build and run with Docker:**
   ```bash
   docker build -t admin-backend .
   docker run -p 3001:3001 --env-file .env admin-backend
   ```

2. **Or use Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **For production with Traefik:**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   
   services:
     admin-backend:
       build: .
       labels:
         - traefik.enable=true
         - traefik.http.routers.admin-api.rule=Host(`api.yourdomain.com`)
         - traefik.http.routers.admin-api.tls=true
         - traefik.http.routers.admin-api.tls.certresolver=letsencrypt
       env_file:
         - .env.production
       networks:
         - traefik
   
   networks:
     traefik:
       external: true
   ```

## 🔧 Environment Variables

### Required Variables
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Optional Variables
```env
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGTAIL_TOKEN=your-logtail-token-for-logging
```

## 🔒 Security Checklist

- [ ] JWT secret is at least 32 characters long
- [ ] Supabase service key is kept secure
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled in production
- [ ] Database RLS policies are configured
- [ ] Admin user passwords are strong
- [ ] Server firewall is configured
- [ ] Regular security updates are applied

## 📊 Monitoring

### Health Check Endpoint
- `GET /admin/health` - Returns server status

### Logging
- Development: Console + files
- Production: Files + optional Logtail integration
- Log files: `logs/error.log`, `logs/combined.log`

### Metrics
Consider integrating with:
- **New Relic** - Application performance monitoring
- **Sentry** - Error tracking
- **Datadog** - Infrastructure monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy Admin Backend

on:
  push:
    branches: [main]
    paths: ['node-backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      working-directory: ./node-backend
      run: npm ci
      
    - name: Build
      working-directory: ./node-backend
      run: npm run build
      
    - name: Run tests
      working-directory: ./node-backend
      run: ./test-api.sh
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        working-directory: ./node-backend
```

## 🆘 Troubleshooting

### Common Issues

1. **Build fails:**
   - Check Node.js version (18+ required)
   - Clear node_modules: `rm -rf node_modules && npm install`

2. **Database connection fails:**
   - Verify Supabase credentials
   - Check if database tables exist
   - Verify RLS policies

3. **JWT errors:**
   - Ensure JWT_SECRET is set and long enough
   - Check token expiration settings

4. **CORS errors:**
   - Update ALLOWED_ORIGINS environment variable
   - Verify frontend domain is included

5. **Rate limiting issues:**
   - Adjust RATE_LIMIT_MAX_REQUESTS
   - Check if multiple requests from same IP

### Debug Commands
```bash
# Check logs
tail -f logs/combined.log

# Test database connection
curl -X POST http://localhost:3001/admin/auth/login -d '{"email":"test","password":"test"}'

# Check environment variables
node -e "console.log(process.env)"
```

## 📞 Support

For issues or questions:
1. Check logs first
2. Verify environment configuration
3. Test with curl commands
4. Check database connectivity

---

Happy deploying! 🚀
