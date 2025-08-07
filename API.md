# API Documentation - Admin Backend

Complete API reference for the Invitation Platform Admin Backend.

## 🔐 Authentication

All admin endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Login to get token:
```bash
curl -X POST http://localhost:3001/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

## 📋 API Reference

### Authentication Endpoints

#### `POST /admin/auth/login`
Admin user login

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-string",
    "admin": {
      "id": "uuid",
      "name": "Admin Name",
      "email": "admin@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  },
  "error": null
}
```

#### `GET /admin/auth/profile`
Get current admin profile (requires auth)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Admin Name",
    "email": "admin@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

#### `POST /admin/auth/create-admin`
Create new admin user (requires auth)

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required, min 8 chars)"
}
```

#### `POST /admin/auth/refresh`
Refresh JWT token (requires auth)

---

### User Management

#### `GET /admin/users`
Get paginated list of users (requires auth)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name or email
- `reseller_id` (optional): Filter by reseller ID

**Example:**
```bash
curl -H 'Authorization: Bearer YOUR_TOKEN' \
  'http://localhost:3001/admin/users?page=1&limit=10&search=john'
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "reseller_id": "uuid or null",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "error": null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `GET /admin/users/:id`
Get user by ID (requires auth)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "reseller_id": "uuid or null",
    "created_at": "2024-01-01T00:00:00Z",
    "invites": [...],
    "reseller": {...}
  },
  "error": null
}
```

#### `GET /admin/users/stats`
Get user statistics (requires auth)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalInvites": 3450,
    "totalResellers": 85,
    "recentSignups": 45,
    "planDistribution": {
      "Free Wedding Plan": 800,
      "Premium Wedding Plan": 450
    },
    "resellerTypeDistribution": {
      "FREE": 65,
      "PREMIUM": 20
    }
  },
  "error": null
}
```

---

### Reseller Management

#### `GET /admin/resellers`
Get paginated list of resellers (requires auth)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by type ('FREE' | 'PREMIUM')
- `search` (optional): Search by name, email, or referral code

**Example:**
```bash
curl -H 'Authorization: Bearer YOUR_TOKEN' \
  'http://localhost:3001/admin/resellers?type=PREMIUM&page=1'
```

#### `POST /admin/resellers`
Create new reseller (requires auth)

**Request Body:**
```json
{
  "user_id": "uuid (required)",
  "type": "FREE | PREMIUM (required)",
  "landing_slug": "string (optional)",
  "custom_domain": "string (optional, must be valid URL)"
}
```

#### `GET /admin/resellers/:id`
Get reseller by ID (requires auth)

#### `PUT /admin/resellers/:id`
Update reseller (requires auth)

**Request Body:**
```json
{
  "type": "FREE | PREMIUM (optional)",
  "landing_slug": "string (optional)",
  "custom_domain": "string (optional)"
}
```

#### `DELETE /admin/resellers/:id`
Delete reseller (requires auth)

#### `GET /admin/resellers/referral/:referral_code`
Get reseller by referral code (requires auth)

---

### Invite Management

#### `GET /admin/invites`
Get paginated list of invites (requires auth)

**Query Parameters:**
- `page`, `limit`: Pagination
- `user_id`: Filter by user
- `plan_id`: Filter by plan
- `template_id`: Filter by template
- `type`: Filter by invitation type
- `is_published`: Filter by published status ('true' | 'false')

**Example:**
```bash
curl -H 'Authorization: Bearer YOUR_TOKEN' \
  'http://localhost:3001/admin/invites?type=WEDDING&is_published=true'
```

#### `GET /admin/invites/:id`
Get invite by ID (requires auth)

#### `GET /admin/invites/slug/:slug`
Get invite by slug (requires auth)

#### `DELETE /admin/invites/:id`
Delete invite (admin only, requires auth)

#### `GET /admin/invites/stats`
Get invite statistics (requires auth)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalInvites": 3450,
    "publishedInvites": 2100,
    "draftInvites": 1350,
    "typeDistribution": {
      "WEDDING": 2500,
      "BIRTHDAY": 700,
      "PARTY": 200,
      "CORPORATE": 50
    },
    "recentInvites": 120
  },
  "error": null
}
```

---

### System Endpoints

#### `GET /`
API information

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Invitation Admin Backend API",
    "version": "1.0.0",
    "documentation": "/admin/health",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

#### `GET /admin/health`
Health check endpoint

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00Z",
    "environment": "development"
  },
  "error": null
}
```

---

## 🔄 Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "error": null,
  "meta": {          // Only for paginated responses
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": "Error message description"
}
```

## 📊 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🔐 Security Headers

The API includes these security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)
- Content Security Policy headers

## 📝 Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Headers included in response:**
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## 🔧 Debugging

### Test Authentication
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/admin/users
```

### Common curl Examples

```bash
# Health check
curl http://localhost:3001/admin/health

# Login
curl -X POST http://localhost:3001/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password"}'

# Get users with pagination
curl -H 'Authorization: Bearer TOKEN' \
  'http://localhost:3001/admin/users?page=1&limit=20'

# Search users
curl -H 'Authorization: Bearer TOKEN' \
  'http://localhost:3001/admin/users?search=john&limit=5'

# Create reseller
curl -X POST http://localhost:3001/admin/resellers \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"uuid","type":"PREMIUM"}'

# Get invite stats
curl -H 'Authorization: Bearer TOKEN' \
  http://localhost:3001/admin/invites/stats
```

## 📚 Additional Resources

- **Setup Guide**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Database Schema**: See `database.sql`
- **API Testing**: Use `./test-api.sh`

---

For support or questions, check the logs and verify your environment configuration first.
