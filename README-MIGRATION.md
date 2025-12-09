# Laptop Collection System - Firestore to MariaDB Migration

This guide explains how to migrate from Firestore to MariaDB while maintaining Firestore as a backup option.

## Overview

The system now supports both Firestore and MariaDB databases:
- **Firestore**: Primary database (default), real-time updates
- **MariaDB**: Alternative database, can be used as primary if Firestore is unavailable

## Prerequisites

### For MariaDB Backend
- Node.js 16+
- MariaDB 10.5+
- MariaDB Connector/Node.js

### For Frontend
- React 18+
- Axios for API calls
- Firebase SDK (for Firestore)

## Setup Instructions

### 1. Database Setup

#### MariaDB Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mariadb-server

# macOS with Homebrew
brew install mariadb
brew services start mariadb

# Windows
# Download from https://mariadb.org/download/
```

#### Create Database
```sql
-- Run the migration script
mysql -u root -p < database-migration.sql
```

### 2. Backend Setup

#### Install Dependencies
```bash
# Install server dependencies
npm install --package-lock-only --prefix . server-package.json
npm ci --prefix . server-package.json
```

#### Configure Environment
Update `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=laptop_collection
PORT=5000
```

#### Start Backend Server
```bash
# Using npm
npm run dev --prefix . server-package.json

# Or directly
node server.js
```

### 3. Frontend Setup

#### Install Dependencies
```bash
npm install axios
```

#### Configure Environment
Update `.env.local` file:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MARIADB=false  # Set to true to use MariaDB as primary
```

## Database Switching

### Using Firestore (Default)
```env
VITE_USE_MARIADB=false
```

### Using MariaDB as Primary
```env
VITE_USE_MARIADB=true
```

### Automatic Fallback
If MariaDB is selected but fails to connect, the system automatically falls back to Firestore.

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk-update-status` - Bulk update status
- `POST /api/students/bulk-import` - Import students

### Permissions
- `GET /api/permissions` - Get all permissions
- `POST /api/permissions` - Add permission
- `DELETE /api/permissions/:id` - Delete permission

### Confiscations
- `GET /api/confiscations` - Get all confiscations
- `POST /api/confiscations` - Add confiscation
- `PUT /api/confiscations/:id` - Update confiscation
- `DELETE /api/confiscations/:id` - Delete confiscation

### Collection History
- `GET /api/collection-history` - Get all history
- `POST /api/collection-history` - Add history entry
- `DELETE /api/collection-history/:id` - Delete history entry

## Data Migration

### From Firestore to MariaDB
1. Ensure both databases are running
2. Set `VITE_USE_MARIADB=false` to use Firestore
3. Export data from Firestore (if needed)
4. Import data to MariaDB using the API endpoints

### Database Schema

#### Students Table
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    student_number INT NOT NULL,
    class_name ENUM('XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC') NOT NULL,
    locker_number VARCHAR(50) NOT NULL,
    collection_status ENUM('collected', 'not_collected') DEFAULT 'not_collected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_number (student_number),
    UNIQUE KEY unique_locker_number (locker_number)
);
```

#### Permissions Table
```sql
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    class_name ENUM('XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC') NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Confiscations Table
```sql
CREATE TABLE confiscations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    class_name ENUM('XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC') NOT NULL,
    locker_number VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INT NOT NULL,
    status ENUM('active', 'returned', 'cancelled') DEFAULT 'active',
    returned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Collection History Table
```sql
CREATE TABLE collection_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    status ENUM('collected', 'not_collected') NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Common Issues

#### MariaDB Connection Error
- Check if MariaDB service is running
- Verify database credentials in `.env`
- Ensure database exists: `CREATE DATABASE laptop_collection;`

#### API Connection Error
- Check if backend server is running on port 5000
- Verify `VITE_API_BASE_URL` in `.env.local`
- Check firewall settings for port 5000

#### CORS Errors
- Backend includes CORS middleware for local development
- For production, configure CORS properly

### Performance Considerations

#### MariaDB Optimization
- Add indexes on frequently queried columns
- Use connection pooling (already implemented)
- Monitor query performance

#### Real-time Updates
- Firestore provides real-time updates
- MariaDB requires polling or WebSocket implementation for real-time features

## Production Deployment

### Backend Deployment
```bash
# Build for production
npm run build --prefix . server-package.json

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name laptop-collection-api
```

### Environment Variables for Production
```env
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=laptop_collection
PORT=5000

# Frontend
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_USE_MARIADB=true
```

## Support

For issues or questions about the migration:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check server and client logs for error messages
4. Ensure database schema matches the migration script
