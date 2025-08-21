# 🚀 Complete NextAuth Setup Guide

This guide will help you set up NextAuth.js with Google OAuth for your Zero2Hero application.

## 📋 **Step 1: Create Google OAuth Credentials**

### 1.1 Go to Google Cloud Console
- Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
- Sign in with your Google account

### 1.2 Create a New Project (if needed)
- Click on the project dropdown at the top
- Click "New Project"
- Give it a name (e.g., "Zero2Hero")
- Click "Create"

### 1.3 Enable Google+ API
- Go to "APIs & Services" > "Library"
- Search for "Google+ API" or "Google Identity"
- Click on it and click "Enable"

### 1.4 Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Choose "Web application"
- Give it a name (e.g., "Zero2Hero Web Client")
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (for development)
  - `https://yourdomain.com/api/auth/callback/google` (for production)
- Click "Create"

### 1.5 Copy Your Credentials
- Copy the **Client ID** and **Client Secret**
- Keep these secure and never commit them to version control

## 📋 **Step 2: Environment Configuration**

### 2.1 Create Environment File
Create a `.env.local` file in your project root:

```bash
# NextAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=your_database_connection_string_here
```

### 2.2 Generate NextAuth Secret
Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## 📋 **Step 3: Database Setup**

### 3.1 Run Database Migration
Apply the NextAuth database schema:

```bash
npm run db:push
```

This will create the required tables:
- `accounts` - OAuth account information
- `sessions` - User session data
- `verificationToken` - Email verification tokens

### 3.2 Verify Database Tables
Check that all tables were created successfully:

```bash
npm run db:studio
```

## 📋 **Step 4: Test the Setup**

### 4.1 Start Development Server
```bash
npm run dev
```

### 4.2 Test Authentication
- Navigate to `http://localhost:3000`
- Click "Sign In" button
- You should be redirected to Google OAuth
- After successful authentication, you should be redirected back

## 🔧 **Troubleshooting**

### Common Issues and Solutions

#### 1. **"Invalid redirect URI" error**
- **Problem**: Google OAuth redirect URI mismatch
- **Solution**: Verify your redirect URIs in Google Cloud Console match exactly

#### 2. **"NEXTAUTH_SECRET is not set" error**
- **Problem**: Missing or invalid NextAuth secret
- **Solution**: Generate a new secret with `openssl rand -base64 32`

#### 3. **Database connection errors**
- **Problem**: Database URL or connection issues
- **Solution**: Verify your `DATABASE_URL` is correct and database is accessible

#### 4. **"Callback URL mismatch" error**
- **Problem**: NextAuth URL configuration issue
- **Solution**: Ensure `NEXTAUTH_URL` matches your actual domain

## 🚀 **Production Deployment**

### 1. Update Environment Variables
- Set `NEXTAUTH_URL` to your production domain
- Use production database credentials
- Ensure Google OAuth redirect URIs include your production domain

### 2. Security Considerations
- Use strong, unique `NEXTAUTH_SECRET`
- Enable HTTPS in production
- Consider adding additional OAuth providers if needed

## 📚 **Additional Resources**

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Examples](https://github.com/nextauthjs/next-auth-example)

## 🆘 **Need Help?**

1. **Check the [NextAuth.js documentation](https://next-auth.js.org/)**
2. **Review your environment variables**
3. **Verify Google OAuth configuration**
4. **Check database connection and schema**

---

**Happy coding! 🎉**



















