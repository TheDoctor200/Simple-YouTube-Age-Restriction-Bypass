/**
 * YouTube API utilities
 */

export class YouTubeUtils {
    static getYtcfg(key) {
        return window.ytcfg?.get(key);
    }

    static getApiKey() {
        return this.getYtcfg('INNERTUBE_API_KEY');
    }

    static getClientName() {
        return this.getYtcfg('INNERTUBE_CLIENT_NAME') || 'WEB';
    }

    static getClientVersion() {
        return this.getYtcfg('INNERTUBE_CLIENT_VERSION') || '2.20241212.01.00';
    }

    static getLanguage() {
        return this.getYtcfg('HL') || 'en';
    }

    static isUserLoggedIn() {
        const loggedIn = this.getYtcfg('LOGGED_IN');
        if (typeof loggedIn === 'boolean') return loggedIn;

        const sessionId = this.getYtcfg('DELEGATED_SESSION_ID');
        if (sessionId) return true;

        const sessionIndex = parseInt(this.getYtcfg('SESSION_INDEX'));
        return sessionIndex >= 0;
    }

    static getSignatureTimestamp() {
        // Try to get from ytcfg
        const sts = this.getYtcfg('STS');
        if (sts) return sts;

        // Fallback: extract from player script
        const playerScript = document.querySelector('script[src*="/base.js"], script[src*="/player/"]');
        if (!playerScript) return null;

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', playerScript.src, false);
            xhr.send();

            const match = xhr.responseText.match(/signatureTimestamp[:\s]*(\d+)/);
            return match ? parseInt(match[1]) : null;
        } catch (error) {
            console.warn('Failed to get signature timestamp:', error);
            return null;
        }
    }

    static getVideoStartTime(videoId) {
        if (!location.href.includes(videoId)) return 0;

        const params = new URLSearchParams(location.search);
        const time = params.get('t') || params.get('start') || params.get('time_continue');

        if (!time) return 0;

        const seconds = parseInt(time.replace('s', ''));
        return isNaN(seconds) ? 0 : seconds;
    }
}
