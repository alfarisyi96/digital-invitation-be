# Local Development Guide

This guide will help you set up the Invitation Admin Backend for local development using Supabase locally.

## Prerequisites

- **Node.js 18+** (Check with `node --version`)
- **Docker Desktop** (Required for local Supabase)
- **Git** (For version control)

## Quick Start

### 1. Setup Local Supabase

```bash
# Make the setup script executable (if not already)
chmod +x setup-local-supabase.sh

# Run the setup script
./setup-local-supabase.sh
```

This script will:
- Install Supabase CLI if needed
- Initialize a Supabase project
- Start local Supabase services (Database, Auth, Storage, etc.)
- Set up the database schema

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your local configuration
nano .env
```

The `.env` file is already configured for local Supabase with these defaults:
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.6jw5K0B8YOTNmacJF6vQGm-9S8bRlkOc6J3xTUe6xI0
JWT_SECRET=your-super-secret-jwt-key-for-local-development
```

### 3. Install Dependencies & Start Development

```bash
# Make the start script executable (if not already)
chmod +x start-dev.sh

# Start the development server
./start-dev.sh
```

This script will:
- Install npm dependencies
- Build the TypeScript code
- Start the development server with hot reload

## Access Information

Once everything is running:

### Backend API
- **API Base URL**: http://localhost:3001/admin
- **Health Check**: http://localhost:3001/admin/health
- **API Documentation**: http://localhost:3001/admin/docs

### Supabase Services
- **Supabase Studio**: http://localhost:54323 (Database GUI)
- **API URL**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

### Default Credentials
- **Database User**: `postgres`
- **Database Password**: `postgres`
- **Admin Login**: 
  - Username: `admin`
  - Password: `admin123`

## Development Workflow

### 1. Database Management

```bash
# View database in Supabase Studio
open http://localhost:54323

# Reset database (if needed)
supabase db reset --linked=false

# Apply schema changes
# Edit database.sql and run in Supabase Studio SQL Editor
```

### 2. Backend Development

```bash
# Start development server (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run tests
npm test

# Check code formatting
npm run lint
```

### 3. API Testing

Test the admin endpoints:

```bash
# Health check
curl http://localhost:3001/admin/health

# Admin login
curl -X POST http://localhost:3001/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get user statistics (requires auth token)
curl http://localhost:3001/admin/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
node-backend/
├── src/                    # Source code
│   ├── config/            # Configuration
│   ├── controllers/       # HTTP request handlers
│   ├── middleware/        # Express middleware
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── index.ts          # Main server file
├── dist/                 # Built JavaScript code
├── database.sql          # Database schema
├── setup-local-supabase.sh # Supabase setup script
├── start-dev.sh          # Development startup script
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Node.js configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Key Features

### Authentication
- JWT-based admin authentication
- Secure password hashing with bcrypt
- Token refresh mechanism
- Role-based access control

### User Management
- User CRUD operations
- User statistics and analytics
- Search and filtering
- Pagination support

### Reseller Management
- Reseller account management
- Commission tracking
- Performance analytics

### Invitation Management
- Invitation CRUD operations
- Template management
- Status tracking
- Analytics

### Security
- Input validation with Zod
- Rate limiting
- CORS configuration
- Helmet security headers
- Environment-based configuration

## API Endpoints

### Authentication
- `POST /admin/auth/login` - Admin login
- `GET /admin/auth/profile` - Get admin profile
- `POST /admin/auth/refresh` - Refresh token

### Users
- `GET /admin/users` - List users (with pagination)
- `GET /admin/users/stats` - User statistics
- `GET /admin/users/:id` - Get user by ID
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

### Resellers
- `GET /admin/resellers` - List resellers
- `GET /admin/resellers/stats` - Reseller statistics
- `POST /admin/resellers` - Create reseller
- `PUT /admin/resellers/:id` - Update reseller
- `DELETE /admin/resellers/:id` - Delete reseller

### Invitations
- `GET /admin/invites` - List invitations
- `GET /admin/invites/stats` - Invitation statistics
- `GET /admin/invites/:id` - Get invitation by ID
- `DELETE /admin/invites/:id` - Delete invitation

### System
- `GET /admin/health` - Health check

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   
   # Or use a different port
   export PORT=3002 && npm run dev
   ```

2. **Supabase Not Starting**
   ```bash
   # Check Docker is running
   docker info
   
   # Restart Supabase
   supabase stop
   supabase start
   ```

3. **Database Connection Issues**
   ```bash
   # Check Supabase status
   supabase status
   
   # Reset database
   supabase db reset --linked=false
   ```

4. **TypeScript Build Errors**
   ```bash
   # Clean build
   rm -rf dist
   npm run build
   
   # Check for type errors
   npx tsc --noEmit
   ```

### Logs and Debugging

```bash
# View logs
tail -f logs/app.log

# Debug mode (if LOG_LEVEL=debug in .env)
DEBUG=* npm run dev

# Database logs
supabase logs db
```

## Production Deployment

When ready for production:

1. Update environment variables for production Supabase
2. Build the application: `npm run build`
3. Use the provided Dockerfile for containerization
4. Set up proper SSL/TLS certificates
5. Configure production logging
6. Set up monitoring and alerting

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update this documentation when adding new features
4. Use conventional commit messages
5. Ensure all tests pass before submitting PRs

---

For additional help, check the main project documentation or contact the development team.
