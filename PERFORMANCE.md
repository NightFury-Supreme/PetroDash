# Performance Optimization Guide

This document outlines performance best practices and optimizations for PteroDash.

## Backend Performance

### Database Optimization

#### MongoDB Indexes
Ensure proper indexes are created for frequently queried fields:

```javascript
// User queries
db.users.createIndex({ email: 1 })
db.users.createIndex({ username: 1 })
db.users.createIndex({ pterodactylId: 1 })

// Server queries  
db.servers.createIndex({ userId: 1 })
db.servers.createIndex({ pterodactylId: 1 })

// Audit logs
db.auditlogs.createIndex({ userId: 1, createdAt: -1 })
db.auditlogs.createIndex({ createdAt: -1 })

// Settings
db.settings.createIndex({ key: 1 })
```

#### Query Optimization
- Use `.lean()` for read-only operations
- Implement pagination for large datasets
- Use projection to limit returned fields
- Avoid N+1 queries with proper population

```javascript
// Good - using lean() and projection
const users = await User.find({ active: true })
  .select('username email createdAt')
  .lean()
  .limit(50);

// Good - pagination
const servers = await Server.find({ userId })
  .populate('user', 'username')
  .skip(page * limit)
  .limit(limit)
  .sort({ createdAt: -1 });
```

### Caching Strategies

#### Redis Caching
Implement Redis for frequently accessed data:

```javascript
// Cache user sessions
const session = await redis.get(`session:${sessionId}`);

// Cache settings
const settings = await redis.get('app:settings');
if (!settings) {
  const dbSettings = await Settings.findOne();
  await redis.setex('app:settings', 300, JSON.stringify(dbSettings));
}

// Cache server status
const serverStatus = await redis.get(`server:${serverId}:status`);
```

#### Memory Caching
Use in-memory caching for configuration:

```javascript
const configCache = new Map();

function getConfig(key) {
  if (configCache.has(key)) {
    return configCache.get(key);
  }
  
  const config = loadConfigFromDatabase(key);
  configCache.set(key, config);
  
  // Auto-expire after 5 minutes
  setTimeout(() => configCache.delete(key), 5 * 60 * 1000);
  
  return config;
}
```

### API Optimization

#### Rate Limiting
Implement intelligent rate limiting:

```javascript
// Different limits for different endpoints
const limiterConfig = {
  '/api/auth': { max: 5, windowMs: 15 * 60 * 1000 },    // 5 per 15min
  '/api/servers': { max: 100, windowMs: 60 * 1000 },    // 100 per minute
  '/api/admin': { max: 200, windowMs: 60 * 1000 }       // 200 per minute
};
```

#### Response Compression
Enable gzip compression:

```javascript
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

#### Request/Response Optimization
- Use streaming for large responses
- Implement proper HTTP caching headers
- Minimize payload sizes
- Use appropriate HTTP status codes

## Frontend Performance

### Code Splitting
Implement route-based code splitting:

```javascript
// Next.js dynamic imports
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

// Lazy load admin components
const AdminPanel = lazy(() => import('./admin/AdminPanel'));
```

### Image Optimization
Optimize images using Next.js Image component:

```jsx
import Image from 'next/image';

// Optimized image loading
<Image
  src="/dashboard-screenshot.png"
  alt="Dashboard"
  width={800}
  height={600}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Bundle Optimization
- Analyze bundle size with `npm run analyze`
- Remove unused dependencies
- Use tree shaking effectively
- Implement proper code splitting

### State Management
Optimize React state management:

```javascript
// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback((id) => {
  onClick(id);
}, [onClick]);

// Implement proper key props for lists
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

## Monitoring and Metrics

### Performance Monitoring
Implement performance monitoring:

```javascript
// Custom timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.url} took ${duration}ms`);
    }
  });
  
  next();
});
```

### Database Performance Monitoring
Monitor database performance:

```javascript
// MongoDB slow query logging
mongoose.connection.on('connected', () => {
  mongoose.connection.db.admin().command({
    profile: 2,
    slowms: 100
  });
});
```

## Production Optimization

### Environment Configuration
Optimize for production environment:

```bash
# Environment variables
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"

# PM2 configuration
pm2 start ecosystem.config.js --env production
```

### Load Balancing
Implement load balancing with multiple instances:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pterodash-api',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

### CDN and Static Assets
- Use CDN for static assets
- Implement proper caching headers
- Optimize asset delivery
- Use HTTP/2 when possible

## Security Performance
- Implement efficient security middleware
- Use helmet.js for security headers
- Optimize JWT validation
- Cache authentication results

## Best Practices Summary

1. **Database**: Use indexes, implement caching, optimize queries
2. **API**: Use compression, implement rate limiting, minimize payloads
3. **Frontend**: Code splitting, image optimization, efficient state management
4. **Monitoring**: Track performance metrics, log slow operations
5. **Production**: Use clustering, CDN, proper environment configuration

Regular performance audits and monitoring are essential for maintaining optimal performance as the application scales.