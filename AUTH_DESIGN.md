# Secure Authentication System Design for Jarvis

This document outlines the design for a secure, cross-platform authentication and credential storage system for the Jarvis ecosystem.

## 1. Authentication Strategy

### A. API Key Authentication (System-to-System)
Used for automated tasks, CI/CD, and internal service communication.
- **Issuance**: Generated via the Jarvis Dashboard or CLI.
- **Validation**: HMAC-based signature or simple Bearer token validation against the Jarvis Backend.

### B. Device Pairing via OAuth2 (User-Facing)
Recommended for CLI and Desktop applications to avoid manual copy-pasting of keys.
1. **Initiation**: User runs `jarvis login`.
2. **Device Code**: Jarvis requests a `device_code` and `user_code` from the Auth Server.
3. **Verification**: User visits `https://auth.jarvis.ai/activate` and enters the `user_code`.
4. **Token Exchange**: Jarvis polls the Auth Server until the user completes verification, then receives an `access_token` and `refresh_token`.

## 2. Secure Credential Storage

To ensure security, credentials must be stored in the OS's native secure storage rather than plaintext `.env` files.

### Implementation Stack
- **`keytar`**: Node.js module that provides access to:
  - **macOS**: Keychain
  - **Windows**: Credential Manager
  - **Linux**: Secret Service API (libsecret) / KWallet
- **`conf`**: (Optional Fallback) For configuration management, but not for raw secrets unless combined with encryption.

### Storage Interface (`CredentialStore`)

```javascript
import keytar from 'keytar';

const SERVICE_NAME = 'JarvisAI';

export class CredentialStore {
  /**
   * Securely saves a token.
   * @param {string} account - The account name (e.g., 'default', user email).
   * @param {string} token - The secret token or API key.
   */
  static async saveToken(account, token) {
    await keytar.setPassword(SERVICE_NAME, account, token);
  }

  /**
   * Retrieves a saved token.
   * @param {string} account 
   * @returns {Promise<string|null>}
   */
  static async getToken(account) {
    return await keytar.getPassword(SERVICE_NAME, account);
  }

  /**
   * Deletes a saved token.
   * @param {string} account 
   */
  static async deleteToken(account) {
    await keytar.deletePassword(SERVICE_NAME, account);
  }
}
```

## 3. Fallback Mechanism (Encrypted Storage)

If `keytar` is unavailable (e.g., in a headless server environment without a keyring), use an encrypted file-based storage.

- **Storage**: `conf` library.
- **Encryption**: `AES-256-GCM`.
- **Key Derivation**: Use a machine-specific identifier (like `machine-id`) combined with a project-specific salt to derive the encryption key.

## 4. Security Best Practices
- **Token Rotation**: Implement automatic refresh logic using `refresh_tokens`.
- **Scope Limitation**: Issue tokens with the minimum required permissions (Principle of Least Privilege).
- **Audit Logging**: Log authentication attempts (success/failure) in the Jarvis Backend.
- **Zero-Plaintext Policy**: Credentials should never touch the disk in unencrypted form.
