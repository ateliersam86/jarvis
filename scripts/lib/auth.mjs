/**
 * Jarvis Authentication & Credential Management
 * 
 * This module provides a unified interface for securely storing and retrieving
 * credentials across different platforms (Windows, macOS, Linux).
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Dynamic imports to handle environments where these might not be installed yet
let keytar;
let Conf;

try {
    keytar = require('keytar');
} catch (e) {
    console.warn('⚠️  keytar not found. Native secure storage unavailable.');
}

try {
    const { default: ConfClass } = require('conf');
    Conf = ConfClass;
} catch (e) {
    console.warn('⚠️  conf not found. Configuration fallback unavailable.');
}

const SERVICE_NAME = 'JarvisAI';
const FALLBACK_ACCOUNT = 'jarvis-default';

export class AuthManager {
    /**
     * Store a credential securely
     * @param {string} token 
     * @param {string} account 
     */
    static async saveCredentials(token, account = FALLBACK_ACCOUNT) {
        if (keytar) {
            try {
                await keytar.setPassword(SERVICE_NAME, account, token);
                return { success: true, method: 'native-keychain' };
            } catch (error) {
                console.error('Failed to save to native keychain:', error);
            }
        }

        // Fallback to conf (encrypted if possible)
        if (Conf) {
            const config = new Conf({ projectName: 'jarvis' });
            // NOTE: In a real implementation, 'token' should be encrypted here
            // using a machine-specific key before saving to conf.
            config.set(`auth.${account}`, token);
            return { success: true, method: 'local-config' };
        }

        throw new Error('No available storage method for credentials');
    }

    /**
     * Retrieve a stored credential
     * @param {string} account 
     */
    static async getCredentials(account = FALLBACK_ACCOUNT) {
        if (keytar) {
            try {
                const password = await keytar.getPassword(SERVICE_NAME, account);
                if (password) return password;
            } catch (error) {
                console.error('Failed to retrieve from native keychain:', error);
            }
        }

        if (Conf) {
            const config = new Conf({ projectName: 'jarvis' });
            return config.get(`auth.${account}`);
        }

        return null;
    }

    /**
     * Remove credentials
     * @param {string} account 
     */
    static async logout(account = FALLBACK_ACCOUNT) {
        if (keytar) {
            await keytar.deletePassword(SERVICE_NAME, account);
        }
        if (Conf) {
            const config = new Conf({ projectName: 'jarvis' });
            config.delete(`auth.${account}`);
        }
    }

    /**
     * Example Device Flow Login (Conceptual)
     */
    static async loginWithDeviceFlow() {
        console.log('Initiating Device Flow Login...');
        // 1. POST /oauth/device/code
        // 2. Display user_code and verification_uri
        // 3. Poll /oauth/token
        // 4. Save token using saveCredentials()
        
        console.log('1. Visit: https://auth.jarvis.ai/activate');
        console.log('2. Enter Code: ABCD-1234');
        
        // Mocking successful login
        const mockToken = 'jv_sk_example_token_12345';
        await this.saveCredentials(mockToken);
        console.log('✅ Successfully authenticated and saved credentials.');
    }
}
