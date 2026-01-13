
export const GOOGLE_OAUTH_CONFIG = {
    clientId: '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com',
    clientSecret: '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',
    scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/cclog',
        'https://www.googleapis.com/auth/experimentsandconfigs',
    ],
    // Use Loopback IP for Native Client compatibility.
    // Google will redirect here. Page will fail but code will be in URL.
    redirectUri: 'http://127.0.0.1',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
};
