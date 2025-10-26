/**
 * Configuration and constants
 */
export const Config = {
    // Version
    VERSION: '2.6.1',

    // Environment detection
    IS_DESKTOP: location.host !== 'm.youtube.com',
    IS_MUSIC: location.host === 'music.youtube.com',
    IS_EMBED: location.pathname.startsWith('/embed/'),
    IS_CONFIRMED: location.search.includes('unlock_confirmed'),

    // Playability statuses
    UNLOCKABLE_STATUSES: [
        'AGE_VERIFICATION_REQUIRED',
        'AGE_CHECK_REQUIRED',
        'CONTENT_CHECK_REQUIRED',
        'LOGIN_REQUIRED'
    ],

    VALID_STATUSES: [
        'OK',
        'LIVE_STREAM_OFFLINE',
        'LIVE_STREAM'
    ],

    // Client versions (updated 2024-12)
    CLIENTS: {
        WEB: {
            name: 'WEB',
            version: '2.20241212.01.00'
        },
        WEB_EMBEDDED: {
            name: 'WEB_EMBEDDED_PLAYER',
            version: '1.20241212.01.00'
        },
        TV_EMBEDDED: {
            name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
            version: '2.0'
        },
        ANDROID: {
            name: 'ANDROID',
            version: '19.09.37',
            osVersion: '14',
            sdkVersion: 34
        },
        IOS: {
            name: 'IOS',
            version: '19.09.3',
            deviceModel: 'iPhone16,2'
        }
    },

    // Features
    ENABLE_NOTIFICATIONS: true,
    ENABLE_CONFIRMATION_EMBED: true,
    SKIP_CONTENT_WARNINGS: true,

    // Auth headers
    AUTH_HEADERS: ['Authorization', 'X-Goog-AuthUser', 'X-Origin'],

    // Thumbnail detection
    BLURRED_THUMBNAIL_SQP_LENGTHS: [32, 48, 56, 68, 72, 84, 88]
};

// User needs to confirm the unlock process on embedded player?
export let ENABLE_UNLOCK_CONFIRMATION_EMBED = Config.ENABLE_CONFIRMATION_EMBED;

// Show notification?
export let ENABLE_UNLOCK_NOTIFICATION = Config.ENABLE_NOTIFICATIONS;

// Disable content warnings?
export let SKIP_CONTENT_WARNINGS = Config.SKIP_CONTENT_WARNINGS;

// WORKAROUND: Do not treeshake
export default window[Symbol()] = {
    ENABLE_UNLOCK_CONFIRMATION_EMBED,
    ENABLE_UNLOCK_NOTIFICATION,
    SKIP_CONTENT_WARNINGS,
};

if (__BUILD_TARGET__ === 'WEB_EXTENSION') {
    // This allows the extension to override the settings that can be set via the extension popup.
    function applyConfig(options) {
        for (const option in options) {
            switch (option) {
                case 'unlockNotification':
                    ENABLE_UNLOCK_NOTIFICATION = options[option];
                    break;
                case 'unlockConfirmation':
                    ENABLE_UNLOCK_CONFIRMATION_EMBED = options[option];
                    break;
                case 'skipContentWarnings':
                    SKIP_CONTENT_WARNINGS = options[option];
                    break;
            }
        }
    }

    // Apply initial extension configuration
    applyConfig(window.SYARB_CONFIG);

    // Listen for config changes
    window.addEventListener('SYARB_CONFIG_CHANGE', (e) => applyConfig(e.detail));
}
