# Invitation Admin Backend

TypeScript-based backend for the **Admin Dashboard** of a web invitation platform. This backend provides a standalone Express API focused on admin operations, separate from the customer-facing application.

## 🎯 Purpose

This backend powers the Admin Dashboard to:
- View user metrics and plan usage
- Manage resellers (free/premium)
- View referred users
- Authenticate admin users manually (separate from Supabase Auth)

## 🛠 Tech Stack

- **Node.js** + **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **Supabase** - Database and customer data access
- **JWT** - Admin session authentication
- **bcrypt** - Password hashing
- **Zod** - Input validation
- **Winston** - Logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📋 Database Schema

### `admin_users`
- `id`: UUID (PK)
- `name`: TEXT
- `email`: TEXT (unique, required)
- `password_hash`: TEXT (bcrypt hash)
- `created_at`: TIMESTAMP

### `resellers`
- `id`: UUID (PK)
- `user_id`: UUID (FK to users.id)
- `referral_code`: TEXT (unique)
- `type`: ENUM('FREE', 'PREMIUM')
- `landing_slug`: TEXT (nullable)
- `custom_domain`: TEXT (nullable)
- `created_at`: TIMESTAMP

### `plans`
- `id`: UUID (PK)
- `name`: TEXT
- `type`: ENUM('FREE', 'PREMIUM')
- `price`: DECIMAL
- `invite_type`: ENUM('WEDDING', 'BIRTHDAY', etc.)
- `created_at`: TIMESTAMP

### `templates`
- `id`: UUID (PK)
- `plan_id`: UUID (FK to plans.id)
- `name`: TEXT
- `preview_url`: TEXT
- `component_id`: TEXT
- `created_at`: TIMESTAMP

### `users` (managed by Supabase Auth)
- `id`: UUID (PK)
- `email`: TEXT
- `name`: TEXT
- `reseller_id`: UUID (FK to resellers.id, nullable)
- `created_at`: TIMESTAMP

### `invites`
- `id`: UUID (PK)
- `user_id`: UUID (FK to users.id)
- `plan_id`: UUID (FK to plans.id)
- `template_id`: UUID (FK to templates.id)
- `type`: ENUM('WEDDING', etc.)
- `slug`: TEXT (unique)
- `form_data`: JSONB
- `is_published`: BOOLEAN
- `created_at`: TIMESTAMP

## 🔐 Authentication Flow

1. Admin logs in via `POST /admin/auth/login` with email + password
2. JWT issued containing: `{ id, email, role: "admin" }`
3. All `/admin/*` routes are protected via `adminAuth` middleware (JWT check)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account with database setup

### Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd node-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual values:
   ```env
   NODE_ENV=development
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **For production:**
   ```bash
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /admin/auth/login` - Admin user login
- `GET /admin/auth/profile` - Get current admin profile
- `POST /admin/auth/refresh` - Refresh JWT token
- `POST /admin/auth/create-admin` - Create new admin user

### Users
- `GET /admin/users` - Get paginated list of users
- `GET /admin/users/:id` - Get user by ID
- `GET /admin/users/stats` - Get user statistics

### Resellers
- `GET /admin/resellers` - Get paginated list of resellers
- `POST /admin/resellers` - Create new reseller
- `GET /admin/resellers/:id` - Get reseller by ID
- `PUT /admin/resellers/:id` - Update reseller
- `DELETE /admin/resellers/:id` - Delete reseller
- `GET /admin/resellers/referral/:code` - Get reseller by referral code

### Invites
- `GET /admin/invites` - Get paginated list of invites
- `GET /admin/invites/:id` - Get invite by ID
- `GET /admin/invites/slug/:slug` - Get invite by slug
- `DELETE /admin/invites/:id` - Delete invite (admin only)
- `GET /admin/invites/stats` - Get invite statistics

### Health Check
- `GET /admin/health` - API health status
- `GET /` - API information

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Configurable origins
- **Rate Limiting** - Request throttling
- **JWT Authentication** - Secure admin sessions
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Zod schemas
- **Error Handling** - Centralized error management

## 📊 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🛠 Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Main application file
```

## 🚀 Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret-min-32-chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
LOGTAIL_TOKEN=your-logtail-token (optional)
```

### Deployment Options

1. **Vercel/Netlify** - Serverless deployment
2. **VPS** - Traditional server with PM2 + Nginx
3. **Docker** - Containerized deployment
4. **Cloudflare Workers** - Edge deployment

### DNS Setup
- Deploy to `api.yourdomain.com` or `admin-api.yourdomain.com`
- Configure CORS to allow your admin dashboard domain

## 📝 Logging

The application uses Winston for structured logging:
- Development: Console + file logging
- Production: File logging + optional Logtail integration
- Request/response logging included
- Error tracking with stack traces

## 🧪 Testing

Create an admin user first:
```bash
curl -X POST http://localhost:3001/admin/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "securepassword123"
  }'
```

Then login:
```bash
curl -X POST http://localhost:3001/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword123"
  }'
```

## 📞 Support

For issues or questions, please check the logs first:
- Development: Console output
- Production: `logs/error.log` and `logs/combined.log`

## 📄 License

MIT License - see LICENSE file for details.
