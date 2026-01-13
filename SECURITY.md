# Security Policy

## Authentication & Credentials

Jarvis uses a secure-by-default approach for managing sensitive information like API keys and OAuth tokens.

### Secure Storage

Credentials are never stored in plaintext within the project directory or environment variables (except during development/CI). Instead, Jarvis utilizes the host operating system's native secure storage:

- **macOS**: Apple Keychain
- **Windows**: Windows Credential Manager
- **Linux**: Secret Service API (libsecret) / KWallet

This is implemented using the `keytar` library.

### Configuration Fallback

In environments where native secure storage is unavailable (e.g., headless servers), Jarvis falls back to an encrypted configuration file managed by the `conf` library.

### How to use AuthManager

The `AuthManager` class in `scripts/lib/auth.mjs` provides the following methods:

```javascript
import { AuthManager } from './scripts/lib/auth.mjs';

// Save a token
await AuthManager.saveCredentials('your-api-key', 'default');

// Retrieve a token
const token = await AuthManager.getCredentials('default');

// Logout / Delete token
await AuthManager.logout('default');
```

## Reporting Vulnerabilities

If you discover a security vulnerability within this project, please do not open a public issue. Instead, follow the standard disclosure process (e.g., contact the maintainer directly).

## Best Practices

- **Never** commit `.env` files.
- **Always** use scoped API keys with minimum permissions.
- **Regularly** rotate your credentials.
