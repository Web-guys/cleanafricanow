# CleanAfricaNow - MySQL/cPanel Export

This package contains everything needed to deploy the CleanAfricaNow backend on a MySQL/cPanel server.

## 📁 Package Contents

```
mysql-export/
├── schema.sql          # Complete MySQL database schema
├── api/
│   ├── .htaccess       # Apache routing configuration
│   ├── config.php      # Database & JWT configuration
│   ├── auth.php        # Authentication endpoints
│   ├── reports.php     # Reports CRUD API
│   ├── cities.php      # Cities API
│   ├── users.php       # User management API
│   └── upload.php      # File upload handling
└── README.md           # This file
```

## 🚀 Installation Guide

### Step 1: Database Setup

1. Log into cPanel → **MySQL Databases**
2. Create a new database: `cleanafricanow`
3. Create a database user with all privileges
4. Import the schema:
   - Go to **phpMyAdmin**
   - Select your database
   - Click **Import** → Upload `schema.sql`

### Step 2: Upload API Files

1. Upload the `api/` folder to your web root:
   ```
   public_html/
   └── api/
       ├── .htaccess
       ├── config.php
       └── ... (other PHP files)
   ```

2. Create uploads directory:
   ```
   public_html/
   └── uploads/     (chmod 755)
   ```

### Step 3: Configure Environment

Edit `api/config.php` and update these values:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_cpanel_username_cleanafricanow');
define('DB_USER', 'your_cpanel_username_dbuser');
define('DB_PASS', 'your_secure_password');

// IMPORTANT: Change this in production!
define('JWT_SECRET', 'your-super-secret-key-min-32-chars');
```

### Step 4: Frontend Configuration

In your React app, create `.env.production`:

```env
VITE_API_URL=https://yourdomain.com/api
VITE_BACKEND_TYPE=mysql
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List all reports |
| GET | `/api/reports/:id` | Get single report |
| POST | `/api/reports` | Create report |
| PUT | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Delete report |
| GET | `/api/reports/stats` | Get statistics |
| GET | `/api/reports/:id/history` | Get history |

### Cities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cities` | List all cities |
| GET | `/api/cities/:id` | Get single city |
| GET | `/api/cities/regions` | List regions |
| POST | `/api/cities` | Create city (admin) |
| PUT | `/api/cities/:id` | Update city (admin) |
| DELETE | `/api/cities/:id` | Delete city (admin) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (admin) |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/users/:id/public` | Get public profile |
| PUT | `/api/users/:id` | Update profile |
| PUT | `/api/users/:id/roles` | Update roles (admin) |
| DELETE | `/api/users/:id` | Delete user (admin) |
| GET | `/api/users/leaderboard` | Get leaderboard |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file |
| GET | `/api/upload` | List user files |
| DELETE | `/api/upload/:filename` | Delete file |

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with cost factor 12
- **SQL Injection Protection**: Prepared statements
- **XSS Protection**: Input sanitization
- **CORS Support**: Configurable origins
- **Rate Limiting**: (implement with cPanel tools)

## 🔄 Feature Comparison

| Feature | Lovable Cloud | MySQL/cPanel |
|---------|--------------|--------------|
| Authentication | ✅ Built-in | ✅ JWT |
| Real-time Updates | ✅ WebSockets | ❌ Polling |
| Row-Level Security | ✅ Database | ✅ API-level |
| File Storage | ✅ Cloud | ✅ Local |
| Edge Functions | ✅ Serverless | ✅ PHP |
| Auto-scaling | ✅ Yes | ❌ Manual |

## 🔧 Troubleshooting

### Common Issues

**500 Internal Server Error**
- Check PHP error logs in cPanel
- Verify database credentials
- Ensure `.htaccess` mod_rewrite is enabled

**401 Unauthorized**
- Check JWT_SECRET matches between requests
- Verify token is being sent in Authorization header

**CORS Errors**
- Update `Access-Control-Allow-Origin` in config.php
- Ensure preflight OPTIONS requests are handled

### Enable Error Logging

In `config.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Keep 0 in production
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/error.log');
```

## 📊 Database Maintenance

### Backup Database
```bash
mysqldump -u username -p database_name > backup.sql
```

### Optimize Tables
```sql
OPTIMIZE TABLE reports, profiles, users;
```

### Add Indexes for Performance
```sql
-- Already included in schema.sql
```

## 🔄 Data Migration

To migrate existing data from Lovable Cloud to MySQL:

1. Export data from Lovable Cloud (use the admin export feature)
2. Transform JSON to SQL INSERT statements
3. Import into MySQL

## 📞 Support

For issues with this export:
- Check the README troubleshooting section
- Review PHP error logs
- Ensure all file permissions are correct (755 for folders, 644 for files)

---

**Note**: This MySQL export provides equivalent functionality to Lovable Cloud but requires manual server management. For production use, ensure you implement:
- SSL/TLS certificates
- Regular backups
- Server monitoring
- DDoS protection
