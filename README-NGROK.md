# Ngrok Integration Setup

This guide explains how to set up the local server to automatically sync data from Firestore via ngrok.

## Prerequisites

1. **Firebase Service Account**: You need a Firebase service account key to access Firestore.
2. **MariaDB Database**: Local MariaDB database for storing synced data.
3. **Ngrok Account**: Account to expose your remote server via ngrok.

## Setup Steps

### 1. Install Dependencies

Navigate to the server directory and install the required packages:

```bash
cd /path/to/your/server
npm install
```

### 2. Configure Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (sostek2025)
3. Go to Project Settings > Service Accounts
4. Generate a new private key (JSON format)
5. Open the downloaded JSON file and copy the values

### 3. Update Environment Variables

Edit the `.env` file in your server directory with your Firebase credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=laptop_collection

# Firebase Service Account Credentials
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_actual_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email_here
FIREBASE_CLIENT_ID=your_client_id_here
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url_here

# Server Configuration
PORT=5000
```

**Important**: Replace the placeholder values with your actual Firebase service account credentials.

### 4. Set Up Remote Server with Ngrok

1. **Install ngrok** on your remote server:
   ```bash
   # Download and install ngrok
   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
   tar xvzf ngrok-v3-stable-linux-amd64.tgz
   sudo mv ngrok /usr/local/bin/
   ```

2. **Authenticate ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

3. **Start your remote server** (the one connected to Firestore):
   ```bash
   cd /path/to/remote/server
   npm start
   ```

4. **Expose the remote server via ngrok**:
   ```bash
   ngrok http 5000
   ```

5. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`) and paste it into the GitHub file.

### 5. Update GitHub File

1. Go to your GitHub repository: https://github.com/ItzGirin24/abbskp
2. Open the `laptop.txt` file
3. Replace the content with your ngrok URL (without trailing slash):
   ```
   https://your-ngrok-url.ngrok.io
   ```
4. Commit and push the changes

### 6. Start Local Server

```bash
cd /path/to/local/server
npm start
```

The local server will:
- Start on port 5000
- Automatically fetch the ngrok URL from GitHub every 5 minutes
- Sync data from the remote Firestore-connected server to your local MariaDB
- Perform an initial sync 5 seconds after startup

## How It Works

1. **Ngrok URL Fetching**: The server fetches the current ngrok URL from `https://raw.githubusercontent.com/ItzGirin24/abbskp/main/laptop.txt`

2. **Data Synchronization**: Every 5 minutes, the server:
   - Fetches all data (students, permissions, confiscations, collection history) from the remote server via ngrok
   - Updates the local MariaDB database with the latest data
   - Uses `ON DUPLICATE KEY UPDATE` to handle existing records

3. **Manual Sync**: You can also trigger a manual sync by calling:
   ```bash
   curl -X POST http://localhost:5000/api/sync
   ```

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**:
   - Double-check your service account credentials in `.env`
   - Ensure the private key is properly formatted with `\n` for line breaks

2. **Ngrok URL Not Found**:
   - Verify the GitHub file exists and contains a valid URL
   - Check that the repository is public or you have proper access

3. **Database Connection Error**:
   - Ensure MariaDB is running
   - Verify database credentials in `.env`
   - Make sure the database and tables exist (run the migration scripts)

4. **Sync Not Working**:
   - Check server logs for error messages
   - Verify the remote server is accessible via ngrok
   - Ensure the remote server has the required API endpoints

### Logs

Monitor the server logs for sync status:
```bash
tail -f server.log
```

Look for messages like:
- "Fetched ngrok URL: https://..."
- "Starting sync from Firestore..."
- "Sync completed successfully"

## Security Notes

- Keep your Firebase service account credentials secure
- The `.env` file should not be committed to version control
- Consider using environment-specific configurations for production

## API Endpoints

The local server provides the same API endpoints as the remote server:

- `GET /api/students` - Get all students
- `GET /api/permissions` - Get all permissions
- `GET /api/confiscations` - Get all confiscations
- `GET /api/collection-history` - Get collection history
- `POST /api/sync` - Manual sync trigger
- `GET /api/health` - Health check

All data operations (CREATE, UPDATE, DELETE) work on the local database and will be synced to Firestore via the remote server.
