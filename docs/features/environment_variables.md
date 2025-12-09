# Environment Variables

This document explains how to set up and use environment variables in the Gospel Labour Ministry Church Management System.

## Overview

Environment variables are used to store configuration values that:
- May change between environments (development, staging, production)
- Contain sensitive information (API keys, secrets)
- Need to be customized per deployment

## Available Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| VITE_SUPABASE_URL | The URL of your Supabase project | Yes | None |
| VITE_SUPABASE_ANON_KEY | The anonymous/public API key for Supabase | Yes | None |
| VITE_APP_NAME | The name of the application | No | "Gospel Labour Ministry CMS" |
| VITE_APP_URL | The base URL of the application | No | "http://localhost:8080" |

## Setting Up Environment Variables

### Development

1. Copy the `.env.example` file to a new file named `.env`:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file and fill in the values for your environment.

3. Restart the development server if it's already running:
   ```
   npm run dev
   ```

### Production

For production deployments, set the environment variables according to your hosting provider's documentation:

- **Vercel**: Use the Vercel dashboard to set environment variables
- **Netlify**: Use the Netlify dashboard or netlify.toml file
- **Docker**: Use Docker environment variables or secrets

## Accessing Environment Variables in Code

Environment variables are accessible in your code using `import.meta.env`:

```typescript
// Example
const apiUrl = import.meta.env.VITE_SUPABASE_URL;
```

Note: Only variables prefixed with `VITE_` will be exposed to your client-side code.

## Security Considerations

- Never commit the `.env` file to version control
- Use different API keys for development and production
- Consider using a secret management service for production deployments
- Regularly rotate API keys and secrets
