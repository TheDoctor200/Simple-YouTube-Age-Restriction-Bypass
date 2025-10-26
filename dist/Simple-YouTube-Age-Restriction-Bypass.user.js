// ==UserScript==
// @name            Simple YouTube Age Restriction Bypass
// @description     Watch age restricted videos on YouTube without login and without age verification 😎
// @description:de  Schaue YouTube Videos mit Altersbeschränkungen ohne Anmeldung und ohne dein Alter zu bestätigen 😎
// @description:fr  Regardez des vidéos YouTube avec des restrictions d'âge sans vous inscrire et sans confirmer votre âge 😎
// @description:it  Guarda i video con restrizioni di età su YouTube senza login e senza verifica dell'età 😎
// @icon            https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/raw/v2.5.4/src/extension/icon/icon_64.png
// @version         2.6.1
// @author          Zerody (https://github.com/zerodytrash)
// @namespace       https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/
// @supportURL      https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/issues
// @updateURL       https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/raw/main/dist/Simple-YouTube-Age-Restriction-Bypass.user.js
// @license         MIT
// @match           https://www.youtube.com/*
// @match           https://www.youtube-nocookie.com/*
// @match           https://m.youtube.com/*
// @match           https://music.youtube.com/*
// @grant           none
// @run-at          document-start
// @compatible      chrome
// @compatible      firefox
// @compatible      opera
// @compatible      edge
// @compatible      safari
// ==/UserScript==

/*
    This is a transpiled version to achieve a clean code base and better browser compatibility.
    You can find the nicely readable source code at https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass
*/

(function iife(ranOnce) {
    // Trick to get around the sandbox restrictions in Greasemonkey (Firefox)
    // Inject code into the main window if criteria match
    if (this !== window && !ranOnce) {
        window.eval('(' + iife.toString() + ')(true);');
        return;
    }

    /**
     * Configuration and constants
     */
    const Config = {
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
            'LOGIN_REQUIRED',
        ],

        VALID_STATUSES: [
            'OK',
            'LIVE_STREAM_OFFLINE',
            'LIVE_STREAM',
        ],

        // Client versions (updated 2024-12)
        CLIENTS: {
            WEB_EMBEDDED: {
                name: 'WEB_EMBEDDED_PLAYER',
                version: '1.20241212.01.00',
            },
            TV_EMBEDDED: {
                name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                version: '2.0',
            },
            ANDROID: {
                name: 'ANDROID',
                version: '19.09.37',
                osVersion: '14',
                sdkVersion: 34,
            },
            IOS: {
                name: 'IOS',
                version: '19.09.3',
                deviceModel: 'iPhone16,2',
            },
        },

        // Features
        ENABLE_NOTIFICATIONS: true,
        ENABLE_CONFIRMATION_EMBED: true,
        SKIP_CONTENT_WARNINGS: true,

        // Auth headers
        AUTH_HEADERS: ['Authorization', 'X-Goog-AuthUser', 'X-Origin'],

        // Thumbnail detection
        BLURRED_THUMBNAIL_SQP_LENGTHS: [32, 48, 56, 68, 72, 84, 88],
    };

    // User needs to confirm the unlock process on embedded player?
    let ENABLE_UNLOCK_CONFIRMATION_EMBED = Config.ENABLE_CONFIRMATION_EMBED;

    // Show notification?
    let ENABLE_UNLOCK_NOTIFICATION = Config.ENABLE_NOTIFICATIONS;

    // Disable content warnings?
    let SKIP_CONTENT_WARNINGS = Config.SKIP_CONTENT_WARNINGS;

    // WORKAROUND: Do not treeshake
    window[Symbol()] = {
        ENABLE_UNLOCK_CONFIRMATION_EMBED,
        ENABLE_UNLOCK_NOTIFICATION,
        SKIP_CONTENT_WARNINGS,
    };

    /**
     * Centralized logging system
     */
    class Logger {
        constructor() {
            let context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'SYARB';
            this.context = context;
            this.prefix = '%c[YouTube Age Bypass]';
            this.style = 'background: #1e5c85; color: #fff; padding: 2px 6px; border-radius: 3px;';
        }

        info(message) {
            for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
            console.info(this.prefix, this.style, `[${this.context}]`, message, ...args);
        }

        warn(message) {
            for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
            console.warn(this.prefix, this.style, `[${this.context}]`, message, ...args);
        }

        error(message, error) {
            for (var _len3 = arguments.length, args = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) args[_key3 - 2] = arguments[_key3];
            console.error(
                this.prefix,
                this.style,
                `[${this.context}]`,
                message,
                error,
                ...args,
                '\n\n📝 Report issues: https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/issues',
            );
        }

        debug(message) {
            if (window.SYARB_DEBUG) {
                for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) args[_key4 - 1] = arguments[_key4];
                console.debug(this.prefix, this.style, `[${this.context}]`, message, ...args);
            }
        }
    }

    /**
     * YouTube API utilities
     */

    class YouTubeUtils {
        static getYtcfg(key) {
            var _window$ytcfg;
            return (_window$ytcfg = window.ytcfg) === null || _window$ytcfg === void 0 ? void 0 : _window$ytcfg.get(key);
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

    const desktopTemplate = `<tp-yt-paper-toast></tp-yt-paper-toast>`;

    const mobileTemplate = `
<c3-toast>
    <ytm-notification-action-renderer>
        <div class="notification-action-response-text"></div>
    </ytm-notification-action-renderer>
</c3-toast>
`;

    class ToastManager {
        constructor() {
            this.container = null;
            this.toast = null;
            this.initialized = false;
        }

        async show(message) {
            let duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;
            if (Config.IS_EMBED) return;

            await this.waitForPage();

            if (document.visibilityState === 'hidden') return;

            if (!this.initialized) {
                this.initialize();
            }

            this.displayToast(message, duration);
        }

        initialize() {
            const template = Config.IS_DESKTOP ? desktopTemplate : mobileTemplate;

            this.container = document.createElement('div');
            this.container.id = 'syarb-toast-container';
            this.container.innerHTML = template;

            this.toast = this.container.querySelector(':scope > *');

            if (Config.IS_MUSIC) {
                this.toast.style.marginBottom = '85px';
            }

            if (!Config.IS_DESKTOP) {
                this.setupMobileToast();
            }

            this.initialized = true;
        }

        setupMobileToast() {
            const messageElement = this.toast.querySelector('.notification-action-response-text');

            this.toast.show = (message) => {
                messageElement.innerText = message;
                this.toast.setAttribute('dir', 'in');

                setTimeout(() => {
                    this.toast.setAttribute('dir', 'out');
                }, this.toast.duration + 225);
            };
        }

        displayToast(message, duration) {
            if (!this.container.isConnected) {
                document.documentElement.append(this.container);
            }

            this.toast.duration = duration * 1000;
            this.toast.show(message);
        }

        async waitForPage() {
            if (document.readyState === 'complete') return;

            return new Promise((resolve) => {
                window.addEventListener('load', resolve, { once: true });
            });
        }
    }

    const Toast = new ToastManager();

    class UnlockStrategies {
        static getPlayer(videoId, reason) {
            const sts = YouTubeUtils.getSignatureTimestamp();
            const startTime = YouTubeUtils.getVideoStartTime(videoId);
            const hl = YouTubeUtils.getLanguage();

            return [
                {
                    name: 'Web Embedded Player',
                    requiresAuth: false,
                    payload: {
                        context: {
                            client: {
                                clientName: Config.CLIENTS.WEB_EMBEDDED.name,
                                clientVersion: Config.CLIENTS.WEB_EMBEDDED.version,
                                clientScreen: 'EMBED',
                                hl,
                            },
                            thirdParty: {
                                embedUrl: 'https://www.youtube.com/',
                            },
                        },
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: sts,
                                referer: 'https://www.youtube.com/',
                                html5Preference: 'HTML5_PREF_WANTS',
                            },
                        },
                        videoId,
                        startTimeSecs: startTime,
                        contentCheckOk: true,
                        racyCheckOk: true,
                    },
                },
                {
                    name: 'TV Embedded Player',
                    requiresAuth: false,
                    payload: {
                        context: {
                            client: {
                                clientName: Config.CLIENTS.TV_EMBEDDED.name,
                                clientVersion: Config.CLIENTS.TV_EMBEDDED.version,
                                clientScreen: 'EMBED',
                                hl,
                            },
                            thirdParty: {
                                embedUrl: 'https://www.youtube.com/',
                            },
                        },
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: sts,
                                referer: 'https://www.youtube.com/',
                            },
                        },
                        videoId,
                        startTimeSecs: startTime,
                        contentCheckOk: true,
                        racyCheckOk: true,
                    },
                },
                {
                    name: 'Android Client',
                    requiresAuth: false,
                    payload: {
                        context: {
                            client: {
                                clientName: Config.CLIENTS.ANDROID.name,
                                clientVersion: Config.CLIENTS.ANDROID.version,
                                androidSdkVersion: Config.CLIENTS.ANDROID.sdkVersion,
                                osName: 'Android',
                                osVersion: Config.CLIENTS.ANDROID.osVersion,
                                hl,
                            },
                        },
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: sts,
                            },
                        },
                        videoId,
                        startTimeSecs: startTime,
                        contentCheckOk: true,
                        racyCheckOk: true,
                        params: 'CgIQBg==',
                    },
                },
                {
                    name: 'iOS Client',
                    requiresAuth: false,
                    payload: {
                        context: {
                            client: {
                                clientName: Config.CLIENTS.IOS.name,
                                clientVersion: Config.CLIENTS.IOS.version,
                                deviceMake: 'Apple',
                                deviceModel: Config.CLIENTS.IOS.deviceModel,
                                osName: 'iOS',
                                osVersion: '17.7.1',
                                hl,
                            },
                        },
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: sts,
                            },
                        },
                        videoId,
                        startTimeSecs: startTime,
                        contentCheckOk: true,
                        racyCheckOk: true,
                    },
                },
                {
                    name: 'Content Warning Bypass',
                    skip: !(reason !== null && reason !== void 0 && reason.includes('CHECK_REQUIRED')),
                    requiresAuth: false,
                    payload: {
                        context: {
                            client: {
                                clientName: YouTubeUtils.getClientName(),
                                clientVersion: YouTubeUtils.getClientVersion(),
                                hl,
                            },
                        },
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: sts,
                            },
                        },
                        videoId,
                        startTimeSecs: startTime,
                        contentCheckOk: true,
                        racyCheckOk: true,
                    },
                },
            ];
        }

        static getNext(videoId, reason) {
            var _YouTubeUtils$getYtcf;
            const hl = YouTubeUtils.getLanguage();
            const theme = ((_YouTubeUtils$getYtcf = YouTubeUtils.getYtcfg('INNERTUBE_CONTEXT')) === null || _YouTubeUtils$getYtcf === void 0
                    || (_YouTubeUtils$getYtcf = _YouTubeUtils$getYtcf.client) === null || _YouTubeUtils$getYtcf === void 0
                ? void 0
                : _YouTubeUtils$getYtcf.userInterfaceTheme) || (
                    document.documentElement.hasAttribute('dark') ? 'USER_INTERFACE_THEME_DARK' : 'USER_INTERFACE_THEME_LIGHT'
                );

            return [
                {
                    name: 'Content Warning Bypass',
                    skip: !(reason !== null && reason !== void 0 && reason.includes('CHECK_REQUIRED')),
                    payload: {
                        context: {
                            client: {
                                clientName: YouTubeUtils.getClientName(),
                                clientVersion: YouTubeUtils.getClientVersion(),
                                hl,
                                userInterfaceTheme: theme,
                            },
                        },
                        videoId,
                        contentCheckOk: true,
                        racyCheckOk: true,
                    },
                },
            ];
        }
    }

    const logger$4 = new Logger('PlayerUnlocker');

    class PlayerUnlocker {
        constructor() {
            this.cache = new Map();
            this.lastUnlockedVideoId = null;
        }

        process(data) {
            var _data$videoDetails, _YouTubeUtils$getYtcf2;
            if (!this.isPlayerResponse(data)) return false;

            const playabilityStatus = data.previewPlayabilityStatus || data.playabilityStatus;
            if (!this.isAgeRestricted(playabilityStatus)) return false;

            logger$4.info('Age-restricted video detected');

            const videoId = ((_data$videoDetails = data.videoDetails) === null || _data$videoDetails === void 0 ? void 0 : _data$videoDetails.videoId)
                || ((_YouTubeUtils$getYtcf2 = YouTubeUtils.getYtcfg('PLAYER_VARS')) === null || _YouTubeUtils$getYtcf2 === void 0 ? void 0 : _YouTubeUtils$getYtcf2.video_id);
            if (!videoId) {
                logger$4.error('Cannot unlock: no video ID found');
                return false;
            }

            try {
                const unlockedData = this.unlock(videoId, playabilityStatus.status);

                if (!unlockedData || !unlockedData.streamingData) {
                    throw new Error('No streaming data in unlocked response');
                }

                // Replace blocked data with unlocked data
                Object.assign(data, unlockedData);
                data.unlocked = true;

                if (data.previewPlayabilityStatus) {
                    data.previewPlayabilityStatus = unlockedData.playabilityStatus;
                }

                this.lastUnlockedVideoId = videoId;

                logger$4.info(`✅ Video unlocked: ${videoId}`);
                Toast.show('Age-restricted video unlocked!', 5);

                return true;
            } catch (error) {
                logger$4.error('Failed to unlock video', error);
                Toast.show('Failed to unlock video - check console for details', 10);
                return false;
            }
        }

        unlock(videoId, reason) {
            // Check cache
            if (this.cache.has(videoId)) {
                logger$4.debug('Using cached response');
                return JSON.parse(JSON.stringify(this.cache.get(videoId)));
            }

            const strategies = UnlockStrategies.getPlayer(videoId, reason);

            for (const strategy of strategies) {
                if (strategy.skip) continue;
                if (strategy.requiresAuth && !YouTubeUtils.isUserLoggedIn()) continue;

                logger$4.info(`Trying strategy: ${strategy.name}`);

                try {
                    const response = this.sendRequest(strategy.payload, strategy.requiresAuth);

                    if (this.isValidResponse(response)) {
                        logger$4.info(`✓ Strategy succeeded: ${strategy.name}`);

                        // Add workaround for tracking params
                        this.fixTrackingParams(response);

                        // Cache successful response
                        this.cache.set(videoId, response);

                        return response;
                    }
                } catch (error) {
                    logger$4.warn(`Strategy failed: ${strategy.name}`, error);
                }
            }

            logger$4.error('All unlock strategies failed');
            return null;
        }

        sendRequest(payload) {
            let useAuth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            const xhr = new XMLHttpRequest();
            const apiKey = YouTubeUtils.getApiKey();

            xhr.open('POST', `/youtubei/v1/player?key=${apiKey}&prettyPrint=false`, false);
            xhr.setRequestHeader('Content-Type', 'application/json');

            if (useAuth && YouTubeUtils.isUserLoggedIn()) {
                xhr.withCredentials = true;

                Config.AUTH_HEADERS.forEach((header) => {
                    const value = this.getStoredHeader(header);
                    if (value) xhr.setRequestHeader(header, value);
                });
            }

            xhr.send(JSON.stringify(payload));
            return JSON.parse(xhr.responseText);
        }

        isPlayerResponse(data) {
            return (data === null || data === void 0 ? void 0 : data.videoDetails) && (data === null || data === void 0 ? void 0 : data.playabilityStatus) || (
                data === null || data === void 0 ? void 0 : data.previewPlayabilityStatus
            );
        }

        isAgeRestricted(playabilityStatus) {
            if (!(playabilityStatus !== null && playabilityStatus !== void 0 && playabilityStatus.status)) return false;

            if (playabilityStatus.desktopLegacyAgeGateReason) return true;

            if (Config.UNLOCKABLE_STATUSES.includes(playabilityStatus.status)) return true;

            // Embed player detection
            if (Config.IS_EMBED) {
                var _playabilityStatus$er;
                const errorUrl =
                    (_playabilityStatus$er = playabilityStatus.errorScreen) === null || _playabilityStatus$er === void 0 || (_playabilityStatus$er = _playabilityStatus$er
                                .playerErrorMessageRenderer) === null
                        || _playabilityStatus$er === void 0 || (_playabilityStatus$er = _playabilityStatus$er
                                .reason) === null
                        || _playabilityStatus$er === void 0 || (_playabilityStatus$er = _playabilityStatus$er
                                .runs) === null
                        || _playabilityStatus$er === void 0 || (_playabilityStatus$er = _playabilityStatus$er
                                .find((x) => x.navigationEndpoint)) === null
                        || _playabilityStatus$er === void 0 || (_playabilityStatus$er = _playabilityStatus$er
                                .navigationEndpoint) === null
                        || _playabilityStatus$er === void 0 || (_playabilityStatus$er = _playabilityStatus$er
                                .urlEndpoint) === null
                        || _playabilityStatus$er === void 0
                        ? void 0
                        : _playabilityStatus$er
                            .url;

                return errorUrl === null || errorUrl === void 0 ? void 0 : errorUrl.includes('/2802167');
            }

            return false;
        }

        isValidResponse(response) {
            return (response === null || response === void 0 ? void 0 : response.playabilityStatus)
                && Config.VALID_STATUSES.includes(response.playabilityStatus.status)
                && response.streamingData;
        }

        fixTrackingParams(response) {
            var _response$responseCon;
            if (
                !response.trackingParams
                || !((_response$responseCon = response.responseContext) !== null && _response$responseCon !== void 0
                    && (_response$responseCon = _response$responseCon.mainAppWebResponseContext) !== null && _response$responseCon !== void 0
                    && _response$responseCon.trackingParam)
            ) {
                response.trackingParams = 'CAAQu2kiEwjor8uHyOL_AhWOvd4KHavXCKw=';
                response.responseContext = {
                    mainAppWebResponseContext: {
                        trackingParam: 'kx_fmPxhoPZRzgL8kzOwANUdQh8ZwHTREkw2UqmBAwpBYrzRgkuMsNLBwOcCE59TDtslLKPQ-SS',
                    },
                };
            }
        }

        getStoredHeader(name) {
            try {
                return JSON.parse(localStorage.getItem(`SYARB_${name}`));
            } catch {
                return null;
            }
        }
    }

    const logger$3 = new Logger('NextUnlocker');

    class NextUnlocker {
        constructor() {
            this.cache = new Map();
            this.lastUnlockedVideoId = null;
        }

        process(data) {
            var _response$currentVide;
            const response = data.response || data;

            if (!this.isWatchNextResponse(response)) return false;
            if (!this.isSidebarEmpty(response)) return false;

            const videoId = (_response$currentVide = response.currentVideoEndpoint) === null || _response$currentVide === void 0
                    || (_response$currentVide = _response$currentVide.watchEndpoint) === null || _response$currentVide === void 0
                ? void 0
                : _response$currentVide.videoId;
            if (!videoId) return false;

            // Only unlock if player was unlocked for this video
            if (videoId !== this.lastUnlockedVideoId) return false;

            try {
                const unlockedData = this.unlock(videoId);

                if (unlockedData && !this.isSidebarEmpty(unlockedData)) {
                    this.mergeSidebar(response, unlockedData);
                    logger$3.info(`✅ Sidebar unlocked: ${videoId}`);
                    return true;
                }
            } catch (error) {
                logger$3.error('Failed to unlock sidebar', error);
            }

            return false;
        }

        unlock(videoId) {
            if (this.cache.has(videoId)) {
                return JSON.parse(JSON.stringify(this.cache.get(videoId)));
            }

            const strategies = UnlockStrategies.getNext(videoId);

            for (const strategy of strategies) {
                if (strategy.skip) continue;

                logger$3.info(`Trying next strategy: ${strategy.name}`);

                try {
                    const response = this.sendRequest(strategy.payload, strategy.optionalAuth);

                    if (!this.isSidebarEmpty(response)) {
                        this.cache.set(videoId, response);
                        return response;
                    }
                } catch (error) {
                    logger$3.warn(`Next strategy failed: ${strategy.name}`, error);
                }
            }

            return null;
        }

        sendRequest(payload) {
            let useAuth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            const xhr = new XMLHttpRequest();
            const apiKey = YouTubeUtils.getApiKey();

            xhr.open('POST', `/youtubei/v1/next?key=${apiKey}&prettyPrint=false`, false);
            xhr.setRequestHeader('Content-Type', 'application/json');

            if (useAuth && YouTubeUtils.isUserLoggedIn()) {
                xhr.withCredentials = true;
            }

            xhr.send(JSON.stringify(payload));
            return JSON.parse(xhr.responseText);
        }

        isWatchNextResponse(data) {
            var _data$contents, _data$contents2;
            return (data === null || data === void 0 || (_data$contents = data.contents) === null || _data$contents === void 0 ? void 0 : _data$contents.twoColumnWatchNextResults)
                || (
                    data === null || data === void 0 || (_data$contents2 = data.contents) === null || _data$contents2 === void 0
                        ? void 0
                        : _data$contents2.singleColumnWatchNextResults
                );
        }

        isSidebarEmpty(data) {
            var _data$contents4;
            if (data.IS_DESKTOP) {
                var _data$contents3;
                const results = (_data$contents3 = data.contents) === null || _data$contents3 === void 0 || (_data$contents3 = _data$contents3.twoColumnWatchNextResults) === null
                        || _data$contents3 === void 0 || (_data$contents3 = _data$contents3
                                .secondaryResults) === null
                        || _data$contents3 === void 0 || (_data$contents3 = _data$contents3.secondaryResults) === null || _data$contents3 === void 0
                    ? void 0
                    : _data$contents3.results;
                return !results;
            }

            // Mobile
            const contents = (_data$contents4 = data.contents) === null || _data$contents4 === void 0 || (_data$contents4 = _data$contents4.singleColumnWatchNextResults) === null
                    || _data$contents4 === void 0 || (_data$contents4 = _data$contents4
                            .results) === null
                    || _data$contents4 === void 0 || (_data$contents4 = _data$contents4.results) === null || _data$contents4 === void 0
                ? void 0
                : _data$contents4.contents;
            const feed = contents === null || contents === void 0 ? void 0 : contents.find((x) => {
                var _x$itemSectionRendere;
                return (
                    ((_x$itemSectionRendere = x.itemSectionRenderer) === null || _x$itemSectionRendere === void 0 ? void 0 : _x$itemSectionRendere.targetId) === 'watch-next-feed'
                );
            });
            return !(feed !== null && feed !== void 0 && feed.itemSectionRenderer);
        }

        mergeSidebar(original, unlocked) {
            var _original$contents, _original$contents2;
            // Implementation for merging sidebar data
            // Desktop vs Mobile layouts
            if ((_original$contents = original.contents) !== null && _original$contents !== void 0 && _original$contents.twoColumnWatchNextResults) {
                original.contents.twoColumnWatchNextResults.secondaryResults = unlocked.contents.twoColumnWatchNextResults.secondaryResults;
            } else if ((_original$contents2 = original.contents) !== null && _original$contents2 !== void 0 && _original$contents2.singleColumnWatchNextResults) {
                var _unlocked$contents$si;
                // Mobile merge logic
                const unlockedFeed = (_unlocked$contents$si = unlocked.contents.singleColumnWatchNextResults) === null || _unlocked$contents$si === void 0
                        || (_unlocked$contents$si = _unlocked$contents$si
                                .results) === null
                        || _unlocked$contents$si === void 0 || (_unlocked$contents$si = _unlocked$contents$si.results) === null || _unlocked$contents$si === void 0
                        || (_unlocked$contents$si = _unlocked$contents$si.contents) === null || _unlocked$contents$si === void 0
                    ? void 0
                    : _unlocked$contents$si.find((x) => {
                        var _x$itemSectionRendere2;
                        return (
                            ((_x$itemSectionRendere2 = x.itemSectionRenderer) === null || _x$itemSectionRendere2 === void 0 ? void 0 : _x$itemSectionRendere2.targetId)
                                === 'watch-next-feed'
                        );
                    });

                if (unlockedFeed) {
                    original.contents.singleColumnWatchNextResults.results.results.contents
                        .push(unlockedFeed);
                }
            }
        }
    }

    const logger$2 = new Logger('ThumbnailProcessor');

    class ThumbnailProcessor {
        process(data) {
            if (!this.isSearchResult(data)) return false;

            const thumbnails = this.findThumbnails(data);
            let unblurredCount = 0;

            for (const thumbnail of thumbnails) {
                if (this.isBlurred(thumbnail)) {
                    thumbnail.url = thumbnail.url.split('?')[0];
                    unblurredCount++;
                }
            }

            if (unblurredCount > 0) {
                logger$2.info(`Unblurred ${unblurredCount}/${thumbnails.length} thumbnails`);
            }

            return unblurredCount > 0;
        }

        findThumbnails(obj) {
            const results = [];
            const stack = [obj];

            for (const current of stack) {
                if (current !== null && current !== void 0 && current.url && current !== null && current !== void 0 && current.height) {
                    results.push(current);
                }

                for (const key in current) {
                    if (current[key] && typeof current[key] === 'object') {
                        stack.push(current[key]);
                    }
                }
            }

            return results;
        }

        isBlurred(thumbnail) {
            if (!thumbnail.url.includes('?sqp=')) return false;

            const sqp = new URL(thumbnail.url).searchParams.get('sqp');
            return Config.BLURRED_THUMBNAIL_SQP_LENGTHS.includes((sqp === null || sqp === void 0 ? void 0 : sqp.length) || 0);
        }

        isSearchResult(data) {
            var _data$contents5, _data$contents6, _data$onResponseRecei;
            return (data === null || data === void 0 || (_data$contents5 = data.contents) === null || _data$contents5 === void 0
                ? void 0
                : _data$contents5.twoColumnSearchResultsRenderer)
                || (data === null || data === void 0 || (_data$contents6 = data.contents) === null || _data$contents6 === void 0
                            || (_data$contents6 = _data$contents6.sectionListRenderer) === null || _data$contents6 === void 0
                        ? void 0
                        : _data$contents6.targetId) === 'search-feed'
                || (
                    data === null || data === void 0 || (_data$onResponseRecei = data.onResponseReceivedCommands) === null || _data$onResponseRecei === void 0
                        ? void 0
                        : _data$onResponseRecei.some((cmd) => {
                            var _cmd$appendContinuati;
                            return (
                                ((_cmd$appendContinuati = cmd.appendContinuationItemsAction) === null || _cmd$appendContinuati === void 0 ? void 0 : _cmd$appendContinuati.targetId)
                                    === 'search-feed'
                            );
                        })
                );
        }
    }

    const logger$1 = new Logger('Interceptor');

    class Interceptor {
        constructor() {
            this.dataCallbacks = [];
            this.nativeJSON = JSON.parse;
            this.nativeXHR = XMLHttpRequest.prototype.open;
            this.nativeFetch = window.fetch;
        }

        onDataReceived(callback) {
            this.dataCallbacks.push(callback);
        }

        attachAll() {
            this.attachJSONInterceptor();
            this.attachXHRInterceptor();
            this.attachFetchInterceptor();
            this.attachPropertyInterceptor();
            this.attachInitialData();
        }

        attachJSONInterceptor() {
            const self = this;

            JSON.parse = function() {
                for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) args[_key5] = arguments[_key5];
                const data = self.nativeJSON.apply(this, args);

                if (typeof data === 'object' && data !== null) {
                    self.processData(data);
                }

                return data;
            };
        }

        attachXHRInterceptor() {
            const self = this;

            XMLHttpRequest.prototype.open = function(method, url) {
                if (typeof url === 'string' && url.includes('/youtubei/')) {
                    const original = this.send;

                    this.send = function(body) {
                        // Store auth headers
                        self.storeAuthHeaders(this);

                        // Add content check flags
                        if (body && (url.includes('/player') || url.includes('/next'))) {
                            try {
                                const parsed = JSON.parse(body);
                                if (parsed.videoId) {
                                    parsed.contentCheckOk = true;
                                    parsed.racyCheckOk = true;
                                    body = JSON.stringify(parsed);
                                }
                            } catch {}
                        }

                        return original.call(this, body);
                    };
                }
                for (var _len6 = arguments.length, args = new Array(_len6 > 2 ? _len6 - 2 : 0), _key6 = 2; _key6 < _len6; _key6++) args[_key6 - 2] = arguments[_key6];

                return self.nativeXHR.call(this, method, url, ...args);
            };
        }

        attachFetchInterceptor() {
            const self = this;

            window.fetch = function(url) {
                let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                if (typeof url === 'string' && url.includes('/youtubei/')) {
                    // Store auth headers
                    if (options.headers) {
                        self.storeAuthHeadersFromObject(options.headers);
                    }

                    // Add content check flags
                    if (options.body && (url.includes('/player') || url.includes('/next'))) {
                        try {
                            const parsed = JSON.parse(options.body);
                            if (parsed.videoId) {
                                parsed.contentCheckOk = true;
                                parsed.racyCheckOk = true;
                                options.body = JSON.stringify(parsed);
                            }
                        } catch {}
                    }
                }

                return self.nativeFetch.call(this, url, options);
            };
        }

        attachPropertyInterceptor() {
            const self = this;
            const dataKey = '__SYARB_playerResponse';

            const descriptor = Object.getOwnPropertyDescriptor(Object.prototype, 'playerResponse') || {
                set(value) {
                    this[dataKey] = value;
                },
                get() {
                    return this[dataKey];
                },
            };

            Object.defineProperty(Object.prototype, 'playerResponse', {
                set(value) {
                    if (typeof value === 'object' && value !== null) {
                        const processed = self.processData(value);
                        descriptor.set.call(this, processed || value);

                        // Force reload if modified
                        if (processed && processed !== value) {
                            return JSON.parse(JSON.stringify(processed));
                        }
                    } else {
                        descriptor.set.call(this, value);
                    }
                },
                get() {
                    return descriptor.get.call(this);
                },
                configurable: true,
            });
        }

        attachInitialData() {
            const self = this;

            window.addEventListener('DOMContentLoaded', () => {
                if (window.ytInitialData) {
                    self.processData(window.ytInitialData);
                }

                if (window.ytInitialPlayerResponse) {
                    self.processData(window.ytInitialPlayerResponse);
                }
            });
        }

        processData(data) {
            let modified = false;

            for (const callback of this.dataCallbacks) {
                try {
                    const result = callback(data);
                    if (result) modified = true;
                } catch (error) {
                    logger$1.error('Callback failed', error);
                }
            }

            return modified ? data : null;
        }

        storeAuthHeaders(xhr) {
            const authHeaders = ['Authorization', 'X-Goog-AuthUser', 'X-Origin'];

            // We can't directly read headers, but we can intercept setRequestHeader
            const original = xhr.setRequestHeader;
            xhr.setRequestHeader = function(name, value) {
                if (authHeaders.includes(name)) {
                    localStorage.setItem(`SYARB_${name}`, JSON.stringify(value));
                }
                return original.call(this, name, value);
            };
        }

        storeAuthHeadersFromObject(headers) {
            const authHeaders = ['Authorization', 'X-Goog-AuthUser', 'X-Origin'];

            for (const [name, value] of Object.entries(headers)) {
                if (authHeaders.includes(name)) {
                    localStorage.setItem(`SYARB_${name}`, JSON.stringify(value));
                }
            }
        }
    }

    /**
     * Simple YouTube Age Restriction Bypass
     * Modern rewrite with improved error handling and logging
     * @version 2.6.1
     */

    const logger = new Logger('Main');

    /**
     * Initialize the age restriction bypass
     */
    async function initialize() {
        try {
            logger.info('Initializing YouTube Age Restriction Bypass v2.6.1');

            // Setup interceptors
            const interceptor = new Interceptor();
            interceptor.attachAll();

            // Initialize unlocking systems
            const playerUnlocker = new PlayerUnlocker();
            const nextUnlocker = new NextUnlocker();
            const thumbnailProcessor = new ThumbnailProcessor();

            // Process YouTube data
            interceptor.onDataReceived((data) => {
                try {
                    playerUnlocker.process(data);
                    nextUnlocker.process(data);
                    thumbnailProcessor.process(data);
                } catch (error) {
                    logger.error('Failed to process YouTube data', error);
                }
            });

            logger.info('Initialization complete');
            Toast.show('Age restriction bypass active', 3);
        } catch (error) {
            logger.error('Critical initialization error', error);
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
