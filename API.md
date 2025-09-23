# PteroDash API Documentation

Base URL: `http://localhost:4000/api` (development) / `https://yourdomain.com/api` (production)

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Endpoints Overview

### Public Endpoints
- `GET /health` - Health check
- `GET /settings` - Public settings (branding)
- `GET /ads` - Advertisement configuration
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### Protected Endpoints  
- `GET /auth/me` - Get current user
- `PUT /auth/update-profile` - Update user profile
- `GET /servers` - List user servers
- `POST /servers` - Create new server
- `GET /shop` - Get shop items
- `POST /shop/purchase` - Purchase items

### Admin Endpoints (requires admin role)
- `GET /admin/users` - List all users
- `GET /admin/servers` - List all servers  
- `GET /admin/analytics` - Get analytics data
- `POST /admin/settings` - Update settings

## Authentication Endpoints

### POST /auth/login
Login with email/username and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "user",
    "coins": 100
  }
}
```

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com", 
  "password": "securepassword",
  "confirmPassword": "securepassword",
  "referralCode": "optional_referral_code"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "coins": 0
  }
}
```

### GET /auth/me
Get current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "user",
    "coins": 100,
    "plan": "premium",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Server Management

### GET /servers
List servers for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "servers": [
    {
      "id": "server_id",
      "name": "My Server",
      "pterodactylId": "ptero_server_id",
      "status": "running",
      "cpu": 50,
      "memory": 1024,
      "disk": 2048,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### POST /servers
Create a new server.

**Request Body:**
```json
{
  "name": "My New Server",
  "egg": "minecraft_java",
  "location": "node1",
  "cpu": 100,
  "memory": 1024,
  "disk": 2048,
  "ports": 1
}
```

**Response:**
```json
{
  "message": "Server created successfully",
  "server": {
    "id": "server_id",
    "name": "My New Server",
    "pterodactylId": "ptero_server_id",
    "status": "installing"
  }
}
```

## Shop System

### GET /shop
Get available shop items.

**Response:**
```json
{
  "items": [
    {
      "id": "cpu_100",
      "name": "100% CPU",
      "description": "Additional CPU allocation",
      "price": 50,
      "type": "resource",
      "category": "cpu"
    },
    {
      "id": "memory_1gb",
      "name": "1GB Memory",
      "description": "Additional memory allocation", 
      "price": 25,
      "type": "resource",
      "category": "memory"
    }
  ]
}
```

### POST /shop/purchase
Purchase an item from the shop.

**Request Body:**
```json
{
  "itemId": "cpu_100",
  "serverId": "server_id",
  "quantity": 1
}
```

**Response:**
```json
{
  "message": "Purchase successful",
  "transaction": {
    "id": "transaction_id",
    "itemId": "cpu_100", 
    "cost": 50,
    "remainingCoins": 450
  }
}
```

## Admin Endpoints

### GET /admin/users
List all users (admin only).

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search by username/email

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "username": "username",
      "email": "user@example.com",
      "role": "user",
      "coins": 100,
      "serversCount": 2,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /admin/analytics
Get system analytics (admin only).

**Response:**
```json
{
  "totalUsers": 150,
  "totalServers": 300,
  "activeServers": 250,
  "totalCoinsSpent": 50000,
  "recentActivity": [
    {
      "type": "user_registration",
      "count": 5,
      "date": "2024-01-01"
    }
  ]
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Authentication endpoints: 5 requests per 15 minutes
- General API endpoints: 100 requests per minute  
- Admin endpoints: 200 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

For real-time updates, connect to the WebSocket endpoint at `/ws`.

### Server Status Updates
```json
{
  "type": "server_status",
  "serverId": "server_id",
  "status": "running",
  "cpu": 45,
  "memory": 60
}
```

### Notification Events
```json
{
  "type": "notification",
  "message": "Your server is ready!",
  "level": "info"
}
```

## SDK and Examples

### JavaScript/Node.js Example
```javascript
const API_BASE = 'http://localhost:4000/api';

// Login and get token
const loginResponse = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { token } = await loginResponse.json();

// Use token for authenticated requests
const serversResponse = await fetch(`${API_BASE}/servers`, {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const servers = await serversResponse.json();
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get servers (with token)
curl -X GET http://localhost:4000/api/servers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

For more detailed examples and SDKs, see the [examples directory](./examples/) in the repository.