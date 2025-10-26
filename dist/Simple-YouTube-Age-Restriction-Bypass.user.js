// ==UserScript==
// @name            Simple YouTube Age Restriction Bypass
// @description     Watch age restricted videos on YouTube without login and without age verification 😎
// @description:de  Schaue YouTube Videos mit Altersbeschränkungen ohne Anmeldung und ohne dein Alter zu bestätigen 😎
// @description:fr  Regardez des vidéos YouTube avec des restrictions d'âge sans vous inscrire et sans confirmer votre âge 😎
// @description:it  Guarda i video con restrizioni di età su YouTube senza login e senza verifica dell'età 😎
// @icon            https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/raw/v2.5.4/src/extension/icon/icon_64.png
// @version         2.6.0
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

    // User needs to confirm the unlock process on embedded player?
    let ENABLE_UNLOCK_CONFIRMATION_EMBED = true;

    // Show notification?
    let ENABLE_UNLOCK_NOTIFICATION = true;

    // Disable content warnings?
    let SKIP_CONTENT_WARNINGS = true;

    // WORKAROUND: Do not treeshake
    window[Symbol()] = {
        ENABLE_UNLOCK_CONFIRMATION_EMBED,
        ENABLE_UNLOCK_NOTIFICATION,
        SKIP_CONTENT_WARNINGS,
    };

    const logPrefix = '%cSimple-YouTube-Age-Restriction-Bypass:';
    const logPrefixStyle = 'background-color: #1e5c85; color: #fff; font-size: 1.2em;';
    const logSuffix = '\uD83D\uDC1E You can report bugs at: https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues';

    function error(err, msg) {
        console.error(logPrefix, logPrefixStyle, msg, err, '\n\n', logSuffix);
        if (window.SYARB_CONFIG) {
            window.dispatchEvent(
                new CustomEvent('SYARB_LOG_ERROR', {
                    detail: {
                        message: (msg ? msg + '; ' : '') + (err && err.message ? err.message : ''),
                        stack: err && err.stack ? err.stack : null,
                    },
                }),
            );
        }
    }

    function info(msg) {
        console.info(logPrefix, logPrefixStyle, msg);
        if (window.SYARB_CONFIG) {
            window.dispatchEvent(
                new CustomEvent('SYARB_LOG_INFO', {
                    detail: {
                        message: msg,
                    },
                }),
            );
        }
    }

    /**
     * The SQP parameter length is different for blurred thumbnails.
     * They contain much less information, than normal thumbnails.
     * The thumbnail SQPs tend to have a long and a short version.
     */
    const BLURRED_THUMBNAIL_SQP_LENGTHS = [
        32, // Mobile (SHORT)
        48, // Desktop Playlist (SHORT)
        56, // Desktop (SHORT)
        68, // Mobile (LONG)
        72, // Mobile Shorts
        84, // Desktop Playlist (LONG)
        88, // Desktop (LONG)
    ];

    function processThumbnails(responseObject) {
        const thumbnails = findObjectsByInnerKeys(responseObject, ['url', 'height']);

        let blurredThumbnailCount = 0;

        for (const thumbnail of thumbnails) {
            if (isThumbnailBlurred(thumbnail)) {
                blurredThumbnailCount++;
                thumbnail.url = thumbnail.url.split('?')[0];
            }
        }

        info(blurredThumbnailCount + '/' + thumbnails.length + ' thumbnails detected as blurred.');
    }

    function isThumbnailBlurred(thumbnail) {
        const hasSQPParam = thumbnail.url.indexOf('?sqp=') !== -1;

        if (!hasSQPParam) {
            return false;
        }

        const SQPLength = new URL(thumbnail.url).searchParams.get('sqp').length;
        const isBlurred = BLURRED_THUMBNAIL_SQP_LENGTHS.includes(SQPLength);

        return isBlurred;
    }

    function findObjectsByInnerKeys(object, keys) {
        const result = [];
        const stack = [object];

        for (const obj of stack) {
            // Check current object in the stack for keys
            if (keys.every((key) => typeof obj[key] !== 'undefined')) {
                result.push(obj);
            }

            // Put nested objects in the stack
            for (const key in obj) {
                if (obj[key] && typeof object[key] === 'object') {
                    stack.push(obj[key]);
                }
            }
        }

        return result;
    }

    const nativeJSONParse = JSON.parse;

    const isDesktop = location.host !== 'm.youtube.com';
    const isMusic = location.host === 'music.youtube.com';
    const isEmbed = location.pathname.indexOf('/embed/') === 0;
    const isConfirmed = location.search.includes('unlock_confirmed');

    // Some Innertube bypass methods require the following authentication headers of the currently logged in user.
    const GOOGLE_AUTH_HEADER_NAMES = ['Authorization', 'X-Goog-AuthUser', 'X-Origin'];

    // WORKAROUND: TypeError: Failed to set the 'innerHTML' property on 'Element': This document requires 'TrustedHTML' assignment.
    if (window.trustedTypes) {
        if (!window.trustedTypes.defaultPolicy) {
            const passThroughFn = (x) => x;
            window.trustedTypes.createPolicy('default', {
                createHTML: passThroughFn,
                createScriptURL: passThroughFn,
                createScript: passThroughFn,
            });
        }
    }

    function createElement(tagName, options) {
        const node = document.createElement(tagName);
        options && Object.assign(node, options);
        return node;
    }

    function pageLoaded() {
        if (document.readyState === 'complete') return Promise.resolve();

        const { promise, resolve } = Promise.withResolvers();

        window.addEventListener('load', resolve, { once: true });

        return promise;
    }

    function createDeepCopy(obj) {
        return nativeJSONParse(JSON.stringify(obj));
    }

    function getYtcfgValue(name) {
        var _window$ytcfg;
        return (_window$ytcfg = window.ytcfg) === null || _window$ytcfg === void 0 ? void 0 : _window$ytcfg.get(name);
    }

    function getSignatureTimestamp() {
        return (
            getYtcfgValue('STS')
            || ((_document$querySelect) => {
                // STS is missing on embedded player. Retrieve from player base script as fallback...
                const playerBaseJsPath = (_document$querySelect = document.querySelector('script[src*="/base.js"]')) === null || _document$querySelect === void 0
                    ? void 0
                    : _document$querySelect.src;

                if (!playerBaseJsPath) return;

                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open('GET', playerBaseJsPath, false);
                xmlhttp.send(null);

                return parseInt(xmlhttp.responseText.match(/signatureTimestamp:([0-9]*)/)[1]);
            })()
        );
    }

    function isUserLoggedIn() {
        // LOGGED_IN doesn't exist on embedded page, use DELEGATED_SESSION_ID or SESSION_INDEX as fallback
        if (typeof getYtcfgValue('LOGGED_IN') === 'boolean') return getYtcfgValue('LOGGED_IN');
        if (typeof getYtcfgValue('DELEGATED_SESSION_ID') === 'string') return true;
        if (parseInt(getYtcfgValue('SESSION_INDEX')) >= 0) return true;

        return false;
    }

    function waitForElement(elementSelector, timeout) {
        const { promise, resolve, reject } = Promise.withResolvers();

        const checkDomInterval = setInterval(() => {
            const elem = document.querySelector(elementSelector);
            if (elem) {
                clearInterval(checkDomInterval);
                resolve(elem);
            }
        }, 100);

        {
            setTimeout(() => {
                clearInterval(checkDomInterval);
                reject();
            }, timeout);
        }

        return promise;
    }

    const getPlayer = sendInnertubeRequest.bind(null, 'v1/player');
    const getNext = sendInnertubeRequest.bind(null, 'v1/next');

    function sendInnertubeRequest(endpoint, payload, useAuth) {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', `/youtubei/${endpoint}?key=${getYtcfgValue('INNERTUBE_API_KEY')}&prettyPrint=false`, false);

        if (useAuth && isUserLoggedIn()) {
            xmlhttp.withCredentials = true;
            GOOGLE_AUTH_HEADER_NAMES.forEach((headerName) => {
                const value = localStorage.getItem('SYARB_' + headerName);
                if (value) {
                    xmlhttp.setRequestHeader(headerName, JSON.parse(value));
                }
            });
        }

        xmlhttp.send(JSON.stringify(payload));
        return nativeJSONParse(xmlhttp.responseText);
    }

    var innertube = {
        getPlayer,
        getNext,
    };

    const confirmationButtonId = 'confirmButton';
    const confirmationButtonText = 'Click to unlock';

    const buttons = {};

    const buttonTemplate = `
<div style="margin-top: 15px !important; padding: 3px 10px 3px 10px; margin: 0px auto; background-color: #4d4d4d; width: fit-content; font-size: 1.2em; text-transform: uppercase; border-radius: 3px; cursor: pointer;">
    <div class="button-text"></div>
</div>
`;

    function isConfirmationRequired() {
        return !isConfirmed && isEmbed && ENABLE_UNLOCK_CONFIRMATION_EMBED;
    }

    async function requestConfirmation() {
        const errorScreenElement = await waitForElement('.ytp-error', 2000);
        const buttonElement = createElement('div', { class: 'button-container', innerHTML: buttonTemplate });
        buttonElement.getElementsByClassName('button-text')[0].innerText = confirmationButtonText;
        buttonElement.addEventListener('click', () => {
            removeButton(confirmationButtonId);
            confirm();
        });

        // Button already attached?
        if (buttons[confirmationButtonId] && buttons[confirmationButtonId].isConnected) {
            return;
        }

        buttons[confirmationButtonId] = buttonElement;
        errorScreenElement.append(buttonElement);
    }

    function confirm() {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('unlock_confirmed', '1');
        urlParams.set('autoplay', '1');
        location.search = urlParams.toString();
    }

    function removeButton(id) {
        if (buttons[id] && buttons[id].isConnected) {
            buttons[id].remove();
        }
    }

    const tDesktop = `<tp-yt-paper-toast></tp-yt-paper-toast>`;

    const tMobile = `
<c3-toast>
    <ytm-notification-action-renderer>
        <div class="notification-action-response-text"></div>
    </ytm-notification-action-renderer>
</c3-toast>
`;

    const template = isDesktop ? tDesktop : tMobile;

    const nToastContainer = createElement('div', { id: 'toast-container', innerHTML: template });
    const nToast = nToastContainer.querySelector(':scope > *');

    // On YT Music show the toast above the player controls
    if (isMusic) {
        nToast.style['margin-bottom'] = '85px';
    }

    if (!isDesktop) {
        nToast.nMessage = nToast.querySelector('.notification-action-response-text');
        nToast.show = (message) => {
            nToast.nMessage.innerText = message;
            nToast.setAttribute('dir', 'in');
            setTimeout(() => {
                nToast.setAttribute('dir', 'out');
            }, nToast.duration + 225);
        };
    }

    async function show(message) {
        let duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;
        if (isEmbed) return;

        await pageLoaded();

        // Do not show notification when tab is in background
        if (document.visibilityState === 'hidden') return;

        // Append toast container to DOM, if not already done
        if (!nToastContainer.isConnected) document.documentElement.append(nToastContainer);

        nToast.duration = duration * 1000;
        nToast.show(message);
    }

    var Toast = { show };

    const messagesMap = {
        success: 'Age-restricted video successfully unlocked!',
        fail: 'Unable to unlock this video 🙁 - More information in the developer console',
    };

    const UNLOCKABLE_PLAYABILITY_STATUSES = ['AGE_VERIFICATION_REQUIRED', 'AGE_CHECK_REQUIRED', 'CONTENT_CHECK_REQUIRED', 'LOGIN_REQUIRED'];
    const VALID_PLAYABILITY_STATUSES = ['OK', 'LIVE_STREAM_OFFLINE'];

    let lastPlayerUnlockVideoId = null;
    let lastPlayerUnlockReason = null;
    let cachedPlayerResponse = {};

    function unlockResponse$1(playerResponse) {
        var _playerResponse$video, _playerResponse$playa, _playerResponse$previ, _unlockedPlayerRespon;
        // Check if the user has to confirm the unlock first
        if (isConfirmationRequired()) {
            info('Unlock confirmation required.');
            requestConfirmation();
            return;
        }

        const videoId = ((_playerResponse$video = playerResponse.videoDetails) === null || _playerResponse$video === void 0 ? void 0 : _playerResponse$video.videoId)
            || getYtcfgValue('PLAYER_VARS').video_id;
        const reason = ((_playerResponse$playa = playerResponse.playabilityStatus) === null || _playerResponse$playa === void 0 ? void 0 : _playerResponse$playa.status)
            || ((_playerResponse$previ = playerResponse.previewPlayabilityStatus) === null || _playerResponse$previ === void 0 ? void 0 : _playerResponse$previ.status);

        lastPlayerUnlockVideoId = videoId;
        lastPlayerUnlockReason = reason;

        const unlockedPlayerResponse = getUnlockedPlayerResponse(videoId, reason);

        // check if the unlocked response isn't playable
        if (
            !VALID_PLAYABILITY_STATUSES.includes(
                (_unlockedPlayerRespon = unlockedPlayerResponse.playabilityStatus) === null || _unlockedPlayerRespon === void 0 ? void 0 : _unlockedPlayerRespon.status,
            )
        ) {
            var _unlockedPlayerRespon2;
            Toast.show(`${messagesMap.fail} (PlayabilityError)`, 10);
            throw new Error(
                `Player Unlock Failed, playabilityStatus: ${
                    (_unlockedPlayerRespon2 = unlockedPlayerResponse.playabilityStatus) === null || _unlockedPlayerRespon2 === void 0 ? void 0 : _unlockedPlayerRespon2.status
                }`,
            );
        }

        // Overwrite the embedded (preview) playabilityStatus with the unlocked one
        if (playerResponse.previewPlayabilityStatus) {
            playerResponse.previewPlayabilityStatus = unlockedPlayerResponse.playabilityStatus;
        }

        // Transfer all unlocked properties to the original player response
        Object.assign(playerResponse, unlockedPlayerResponse);

        Toast.show(messagesMap.success);

        return true;
    }

    function getUnlockedPlayerResponse(videoId, reason) {
        // Check if response is cached
        if (cachedPlayerResponse.videoId === videoId) return createDeepCopy(cachedPlayerResponse);

        const unlockStrategies = getUnlockStrategies$1(videoId, reason);

        let unlockedPlayerResponse = {};

        for (const strategy of unlockStrategies) {
            var _unlockedPlayerRespon3;
            if (strategy.skip) continue;

            // Skip strategy if authentication is required and the user is not logged in
            if (strategy.requiresAuth && !isUserLoggedIn()) continue;

            info(`Trying Player Unlock Method ${strategy.name}`);

            try {
                unlockedPlayerResponse = strategy.endpoint.getPlayer(strategy.payload, strategy.requiresAuth || strategy.optionalAuth);
            } catch (err) {
                error(`Player unlock Method "${strategy.name}" failed with exception:`, err);
            }

            const isStatusValid = VALID_PLAYABILITY_STATUSES.includes(
                (_unlockedPlayerRespon3 = unlockedPlayerResponse) === null || _unlockedPlayerRespon3 === void 0
                    || (_unlockedPlayerRespon3 = _unlockedPlayerRespon3.playabilityStatus) === null || _unlockedPlayerRespon3 === void 0
                    ? void 0
                    : _unlockedPlayerRespon3.status,
            );

            if (isStatusValid) {
                var _unlockedPlayerRespon4;
                /**
                 * Workaround: https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues/191
                 *
                 * YouTube checks if the `trackingParams` in the response matches the decoded `trackingParam` in `responseContext.mainAppWebResponseContext`.
                 * However, sometimes the response does not include the `trackingParam` in the `responseContext`, causing the check to fail.
                 *
                 * This workaround addresses the issue by hardcoding the `trackingParams` in the response context.
                 */
                if (
                    !unlockedPlayerResponse.trackingParams
                    || !((_unlockedPlayerRespon4 = unlockedPlayerResponse.responseContext) !== null && _unlockedPlayerRespon4 !== void 0
                        && (_unlockedPlayerRespon4 = _unlockedPlayerRespon4.mainAppWebResponseContext) !== null && _unlockedPlayerRespon4 !== void 0
                        && _unlockedPlayerRespon4.trackingParam)
                ) {
                    unlockedPlayerResponse.trackingParams = 'CAAQu2kiEwjor8uHyOL_AhWOvd4KHavXCKw=';
                    unlockedPlayerResponse.responseContext = {
                        mainAppWebResponseContext: {
                            trackingParam: 'kx_fmPxhoPZRzgL8kzOwANUdQh8ZwHTREkw2UqmBAwpBYrzRgkuMsNLBwOcCE59TDtslLKPQ-SS',
                        },
                    };
                }

                // Cache response to prevent a flood of requests in case youtube processes a blocked response mutiple times.
                cachedPlayerResponse = { videoId, ...createDeepCopy(unlockedPlayerResponse) };

                return unlockedPlayerResponse;
            }
        }
    }

    function isPlayerObject(parsedData) {
        return (parsedData === null || parsedData === void 0 ? void 0 : parsedData.videoDetails)
                && (parsedData === null || parsedData === void 0 ? void 0 : parsedData.playabilityStatus)
            || typeof (parsedData === null || parsedData === void 0 ? void 0 : parsedData.previewPlayabilityStatus) === 'object';
    }

    function isAgeRestricted(ytData) {
        var _playabilityStatus$er;
        const playabilityStatus = ytData.previewPlayabilityStatus ?? ytData.playabilityStatus;

        if (!(playabilityStatus !== null && playabilityStatus !== void 0 && playabilityStatus.status)) return false;
        if (playabilityStatus.desktopLegacyAgeGateReason) return true;
        if (UNLOCKABLE_PLAYABILITY_STATUSES.includes(playabilityStatus.status)) return true;

        // Fix to detect age restrictions on embed player
        // see https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues/85#issuecomment-946853553
        return (
            isEmbed
            && ((_playabilityStatus$er = playabilityStatus.errorScreen) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.playerErrorMessageRenderer) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.reason) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.runs) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.find((x) => x.navigationEndpoint)) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.navigationEndpoint) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.urlEndpoint) === null || _playabilityStatus$er === void 0
                    || (_playabilityStatus$er = _playabilityStatus$er.url) === null || _playabilityStatus$er === void 0
                ? void 0
                : _playabilityStatus$er.includes('/2802167'))
        );
    }

    function getCurrentVideoStartTime(currentVideoId) {
        // Check if the URL corresponds to the requested video
        // This is not the case when the player gets preloaded for the next video in a playlist.
        if (window.location.href.includes(currentVideoId)) {
            var _ref;
            // "t"-param on youtu.be urls
            // "start"-param on embed player
            // "time_continue" when clicking "watch on youtube" on embedded player
            const urlParams = new URLSearchParams(window.location.search);
            const startTimeString = (_ref = urlParams.get('t') || urlParams.get('start') || urlParams.get('time_continue')) === null || _ref === void 0
                ? void 0
                : _ref.replace('s', '');

            if (startTimeString && !isNaN(startTimeString)) {
                return parseInt(startTimeString);
            }
        }

        return 0;
    }

    function getUnlockStrategies$1(videoId, reason) {
        const clientName = getYtcfgValue('INNERTUBE_CLIENT_NAME') || 'WEB';
        const clientVersion = getYtcfgValue('INNERTUBE_CLIENT_VERSION') || '2.20220203.04.00';
        const signatureTimestamp = getSignatureTimestamp();
        const startTimeSecs = getCurrentVideoStartTime(videoId);
        const hl = getYtcfgValue('HL');

        return [
            /**
             * Retrieve the video info by just adding `racyCheckOk` and `contentCheckOk` params
             * This strategy can be used to bypass content warnings
             */
            {
                name: 'Content Warning Bypass',
                skip: !reason || !reason.includes('CHECK_REQUIRED'),
                optionalAuth: true,
                payload: {
                    context: {
                        client: {
                            clientName: clientName,
                            clientVersion: clientVersion,
                            hl,
                        },
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp,
                        },
                    },
                    videoId,
                    startTimeSecs,
                    racyCheckOk: true,
                    contentCheckOk: true,
                },
                endpoint: innertube,
            },
            /**
             * Retrieve the video info by using the TVHTML5 Embedded client
             * This client has no age restrictions in place (2022-03-28)
             * See https://github.com/zerodytrash/YouTube-Internal-Clients
             */
            {
                name: 'TV Embedded Player',
                requiresAuth: false,
                payload: {
                    context: {
                        client: {
                            clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                            clientVersion: '2.0',
                            clientScreen: 'WATCH',
                            hl,
                        },
                        thirdParty: {
                            embedUrl: 'https://www.youtube.com/',
                        },
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp,
                        },
                    },
                    videoId,
                    startTimeSecs,
                    racyCheckOk: true,
                    contentCheckOk: true,
                },
                endpoint: innertube,
            },
            /**
             * Retrieve the video info by using the WEB_CREATOR client in combination with user authentication
             * Requires that the user is logged in. Can bypass the tightened age verification in the EU.
             * See https://github.com/yt-dlp/yt-dlp/pull/600
             */
            {
                name: 'Creator + Auth',
                requiresAuth: true,
                payload: {
                    context: {
                        client: {
                            clientName: 'WEB_CREATOR',
                            clientVersion: '1.20210909.07.00',
                            hl,
                        },
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp,
                        },
                    },
                    videoId,
                    startTimeSecs,
                    racyCheckOk: true,
                    contentCheckOk: true,
                },
                endpoint: innertube,
            },
        ];
    }

    let cachedNextResponse = {};

    function unlockResponse(ytData) {
        const response = ytData.response ?? ytData;

        const videoId = response.currentVideoEndpoint.watchEndpoint.videoId;

        if (!videoId) {
            throw new Error(`Missing videoId in nextResponse`);
        }

        // Only unlock the /next response when the player has been unlocked as well
        if (videoId !== lastPlayerUnlockVideoId) {
            return;
        }

        const unlockedNextResponse = getUnlockedNextResponse(videoId);

        // check if the sidebar of the unlocked response is still empty
        if (isWatchNextSidebarEmpty(unlockedNextResponse)) {
            throw new Error(`Sidebar Unlock Failed`);
        }

        // Transfer some parts of the unlocked response to the original response
        mergeNextResponse(response, unlockedNextResponse);
    }

    function getUnlockedNextResponse(videoId) {
        // Check if response is cached
        if (cachedNextResponse.videoId === videoId) return createDeepCopy(cachedNextResponse);

        const unlockStrategies = getUnlockStrategies(videoId, lastPlayerUnlockReason);

        let unlockedNextResponse = {};

        for (const strategy of unlockStrategies) {
            if (strategy.skip) continue;

            info(`Trying Next Unlock Method ${strategy.name}`);

            try {
                unlockedNextResponse = strategy.endpoint.getNext(strategy.payload, strategy.optionalAuth);
            } catch (err) {
                error(`Next unlock Method "${strategy.name}" failed with exception:`, err);
            }

            if (!isWatchNextSidebarEmpty(unlockedNextResponse)) {
                // Cache response to prevent a flood of requests in case youtube processes a blocked response mutiple times.
                cachedNextResponse = { videoId, ...createDeepCopy(unlockedNextResponse) };
                return unlockedNextResponse;
            }
        }
    }

    function mergeNextResponse(originalNextResponse, unlockedNextResponse) {
        var _unlockedNextResponse;
        if (isDesktop) {
            // Transfer WatchNextResults to original response
            originalNextResponse.contents.twoColumnWatchNextResults.secondaryResults = unlockedNextResponse.contents.twoColumnWatchNextResults.secondaryResults;

            // Transfer video description to original response
            const originalVideoSecondaryInfoRenderer = originalNextResponse.contents.twoColumnWatchNextResults.results.results.contents.find(
                (x) => x.videoSecondaryInfoRenderer,
            ).videoSecondaryInfoRenderer;
            const unlockedVideoSecondaryInfoRenderer = unlockedNextResponse.contents.twoColumnWatchNextResults.results.results.contents.find(
                (x) => x.videoSecondaryInfoRenderer,
            ).videoSecondaryInfoRenderer;

            // TODO: Throw if description not found?
            if (unlockedVideoSecondaryInfoRenderer.description) {
                originalVideoSecondaryInfoRenderer.description = unlockedVideoSecondaryInfoRenderer.description;
            } else if (unlockedVideoSecondaryInfoRenderer.attributedDescription) {
                originalVideoSecondaryInfoRenderer.attributedDescription = unlockedVideoSecondaryInfoRenderer.attributedDescription;
            }

            return;
        }

        // Transfer WatchNextResults to original response
        const unlockedWatchNextFeed = (_unlockedNextResponse = unlockedNextResponse.contents) === null || _unlockedNextResponse === void 0
                || (_unlockedNextResponse = _unlockedNextResponse.singleColumnWatchNextResults) === null || _unlockedNextResponse === void 0
                || (_unlockedNextResponse = _unlockedNextResponse.results) === null || _unlockedNextResponse === void 0
                || (_unlockedNextResponse = _unlockedNextResponse.results) === null || _unlockedNextResponse === void 0
                || (_unlockedNextResponse = _unlockedNextResponse.contents) === null || _unlockedNextResponse === void 0
            ? void 0
            : _unlockedNextResponse.find(
                (x) => {
                    var _x$itemSectionRendere;
                    return ((_x$itemSectionRendere = x.itemSectionRenderer) === null || _x$itemSectionRendere === void 0 ? void 0 : _x$itemSectionRendere.targetId)
                        === 'watch-next-feed';
                },
            );

        if (unlockedWatchNextFeed) originalNextResponse.contents.singleColumnWatchNextResults.results.results.contents.push(unlockedWatchNextFeed);

        // Transfer video description to original response
        const originalStructuredDescriptionContentRenderer = originalNextResponse.engagementPanels
            .find((x) => x.engagementPanelSectionListRenderer)
            .engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.find((x) => x.expandableVideoDescriptionBodyRenderer);
        const unlockedStructuredDescriptionContentRenderer = unlockedNextResponse.engagementPanels
            .find((x) => x.engagementPanelSectionListRenderer)
            .engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.find((x) => x.expandableVideoDescriptionBodyRenderer);

        if (unlockedStructuredDescriptionContentRenderer.expandableVideoDescriptionBodyRenderer) {
            originalStructuredDescriptionContentRenderer.expandableVideoDescriptionBodyRenderer =
                unlockedStructuredDescriptionContentRenderer.expandableVideoDescriptionBodyRenderer;
        }
    }

    function getUnlockStrategies(videoId, lastPlayerUnlockReason) {
        const clientName = getYtcfgValue('INNERTUBE_CLIENT_NAME') || 'WEB';
        const clientVersion = getYtcfgValue('INNERTUBE_CLIENT_VERSION') || '2.20220203.04.00';
        const hl = getYtcfgValue('HL');
        const userInterfaceTheme = getYtcfgValue('INNERTUBE_CONTEXT').client.userInterfaceTheme ?? (
            document.documentElement.hasAttribute('dark') ? 'USER_INTERFACE_THEME_DARK' : 'USER_INTERFACE_THEME_LIGHT'
        );

        return [
            /**
             * Retrieve the sidebar and video description by just adding `racyCheckOk` and `contentCheckOk` params
             * This strategy can be used to bypass content warnings
             */
            {
                name: 'Content Warning Bypass',
                skip: !lastPlayerUnlockReason || !lastPlayerUnlockReason.includes('CHECK_REQUIRED'),
                optionalAuth: true,
                payload: {
                    context: {
                        client: {
                            clientName,
                            clientVersion,
                            hl,
                            userInterfaceTheme,
                        },
                    },
                    videoId,
                    racyCheckOk: true,
                    contentCheckOk: true,
                },
                endpoint: innertube,
            },
        ];
    }

    function isWatchNextObject(ytData) {
        var _response$currentVide;
        const response = ytData.response ?? ytData;
        if (
            !(response !== null && response !== void 0 && response.contents)
            || !(response !== null && response !== void 0 && (_response$currentVide = response.currentVideoEndpoint) !== null && _response$currentVide !== void 0
                && (_response$currentVide = _response$currentVide.watchEndpoint) !== null && _response$currentVide !== void 0 && _response$currentVide.videoId)
        ) return false;
        return !!response.contents.twoColumnWatchNextResults || !!response.contents.singleColumnWatchNextResults;
    }

    function isWatchNextSidebarEmpty(ytData) {
        var _response$contents2, _content$find;
        const response = ytData.response ?? ytData;

        if (isDesktop) {
            var _response$contents;
            // WEB response layout
            const result =
                (_response$contents = response.contents) === null || _response$contents === void 0 || (_response$contents = _response$contents.twoColumnWatchNextResults) === null
                    || _response$contents === void 0 || (_response$contents = _response$contents.secondaryResults) === null || _response$contents === void 0
                    || (_response$contents = _response$contents.secondaryResults) === null || _response$contents === void 0
                    ? void 0
                    : _response$contents.results;
            return !result;
        }

        // MWEB response layout
        const content = (_response$contents2 = response.contents) === null || _response$contents2 === void 0
                || (_response$contents2 = _response$contents2.singleColumnWatchNextResults) === null || _response$contents2 === void 0
                || (_response$contents2 = _response$contents2.results) === null || _response$contents2 === void 0 || (_response$contents2 = _response$contents2.results) === null
                || _response$contents2 === void 0
            ? void 0
            : _response$contents2.contents;
        const result = content === null || content === void 0 || (_content$find = content.find((e) => {
                    var _e$itemSectionRendere;
                    return ((_e$itemSectionRendere = e.itemSectionRenderer) === null || _e$itemSectionRendere === void 0 ? void 0 : _e$itemSectionRendere.targetId)
                        === 'watch-next-feed';
                })) === null
                || _content$find === void 0
            ? void 0
            : _content$find.itemSectionRenderer;
        return typeof result !== 'object';
    }

    // Leave config on top

    /**
     * And here we deal with YouTube's crappy initial data (present in page source) and the problems that occur when intercepting that data.
     * YouTube has some protections in place that make it difficult to intercept and modify the global ytInitialPlayerResponse variable.
     * The easiest way would be to set a descriptor on that variable to change the value directly on declaration.
     * But some adblockers define their own descriptors on the ytInitialPlayerResponse variable, which makes it hard to register another descriptor on it.
     * As a workaround only the relevant playerResponse property of the ytInitialPlayerResponse variable will be intercepted.
     * This is achieved by defining a descriptor on the object prototype for that property, which affects any object with a `playerResponse` property.
     */
    interceptObjectProperty('playerResponse', (obj, playerResponse) => {
        info(`playerResponse property set, contains sidebar: ${!!obj.response}`);

        // The same object also contains the sidebar data and video description
        if (obj.response) processYtData(obj.response);

        // If the script is executed too late and the bootstrap data has already been processed,
        // a reload of the player can be forced by creating a deep copy of the object.
        // This is especially relevant if the userscript manager does not handle the `@run-at document-start` correctly.
        return processYtData(playerResponse) ? createDeepCopy(playerResponse) : playerResponse;
    });

    // The global `ytInitialData` variable can be modified on the fly.
    // It contains search results, sidebar data and meta information
    // Not really important but fixes https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues/127
    window.addEventListener('DOMContentLoaded', () => {
        if (window.ytInitialData) {
            processYtData(window.ytInitialData);
        }
    });

    JSON.parse = new Proxy(JSON.parse, {
        construct(target, args) {
            const data = Reflect.construct(target, args);
            processYtData(data);
            return data;
        },
    });

    XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
        construct(target, args) {
            const [method, url] = args;
            try {
                if (typeof url === 'string' && url.indexOf('https://') !== -1) {
                    handleXhrOpen(method, url, this);
                }
            } catch (err) {
                error(err, `Failed to intercept XMLHttpRequest.open()`);
            }

            return Reflect.construct(target, args);
        },
    });

    Request = new Proxy(Request, {
        construct(target, args) {
            const [url, options] = args;
            try {
                if (typeof url === 'string' && url.indexOf('https://') !== -1) {
                    handleFetchRequest(url, options);
                }
            } catch (err) {
                error(err, `Failed to intercept Request()`);
            }

            return Reflect.construct(target, args);
        },
    });

    function processYtData(ytData) {
        try {
            if (isPlayerObject(ytData) && isAgeRestricted(ytData)) {
                return unlockResponse$1(ytData);
            }
        } catch (err) {
            error(err, 'Video unlock failed');
        }

        try {
            if (isWatchNextObject(ytData) && isWatchNextSidebarEmpty(ytData)) {
                unlockResponse(ytData);
            }
        } catch (err) {
            error(err, 'Sidebar unlock failed');
        }

        try {
            // Unlock blurry video thumbnails in search results
            if (isSearchResult(ytData)) {
                processThumbnails(ytData);
            }
        } catch (err) {
            error(err, 'Thumbnail unlock failed');
        }
    }

    function interceptObjectProperty(prop, onSet) {
        // Allow other userscripts to decorate this descriptor, if they do something similar
        const dataKey = '__SYARB_' + prop;
        const { get: getter, set: setter } = Object.getOwnPropertyDescriptor(Object.prototype, prop) ?? {
            set(value) {
                this[dataKey] = value;
            },
            get() {
                return this[dataKey];
            },
        };

        // Intercept the given property on any object
        // The assigned attribute value and the context (enclosing object) are passed to the onSet function.
        Object.defineProperty(Object.prototype, prop, {
            set(value) {
                setter.call(this, value ? onSet(this, value) : value);
            },
            get() {
                return getter.call(this);
            },
            configurable: true,
        });
    }

    function isSearchResult(parsedData) {
        var _parsedData$contents, _parsedData$contents2, _parsedData$onRespons;
        return (
            typeof (parsedData === null || parsedData === void 0 || (_parsedData$contents = parsedData.contents) === null || _parsedData$contents === void 0
                    ? void 0
                    : _parsedData$contents.twoColumnSearchResultsRenderer) === 'object' // Desktop initial results
            || (parsedData === null || parsedData === void 0 || (_parsedData$contents2 = parsedData.contents) === null || _parsedData$contents2 === void 0
                        || (_parsedData$contents2 = _parsedData$contents2.sectionListRenderer) === null || _parsedData$contents2 === void 0
                    ? void 0
                    : _parsedData$contents2.targetId) === 'search-feed' // Mobile initial results
            || (parsedData === null || parsedData === void 0 || (_parsedData$onRespons = parsedData.onResponseReceivedCommands) === null || _parsedData$onRespons === void 0
                        || (_parsedData$onRespons = _parsedData$onRespons.find((x) => x.appendContinuationItemsAction)) === null || _parsedData$onRespons === void 0
                        || (_parsedData$onRespons = _parsedData$onRespons.appendContinuationItemsAction) === null || _parsedData$onRespons === void 0
                    ? void 0
                    : _parsedData$onRespons.targetId) === 'search-feed' // Desktop & Mobile scroll continuation
        );
    }

    function attachGenericInterceptor(obj, prop, onCall) {
        if (!obj || typeof obj[prop] !== 'function') {
            return;
        }

        const original = obj[prop];

        obj[prop] = function() {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
            try {
                onCall(args);
            } catch {}
            original.apply(this, args);
        };
    }

    /**
     *  Handles XMLHttpRequests and
     * - Rewrite Googlevideo URLs to Proxy URLs (if necessary)
     * - Store auth headers for the authentication of further unlock requests.
     * - Add "content check ok" flags to request bodys
     */
    function handleXhrOpen(method, url, xhr) {
        const url_obj = new URL(url);

        if (url_obj.pathname.startsWith('/youtubei/')) {
            // Store auth headers in storage for further usage.
            attachGenericInterceptor(xhr, 'setRequestHeader', (_ref2) => {
                let [key, value] = _ref2;
                if (GOOGLE_AUTH_HEADER_NAMES.includes(key)) {
                    localStorage.setItem('SYARB_' + key, JSON.stringify(value));
                }
            });
        }

        if (method === 'POST' && ['/youtubei/v1/player', '/youtubei/v1/next'].includes(url_obj.pathname)) {
            // Add content check flags to player and next request (this will skip content warnings)
            attachGenericInterceptor(xhr, 'send', (args) => {
                if (typeof args[0] === 'string') {
                    args[0] = setContentCheckOk(args[0]);
                }
            });
        }
    }

    /**
     *  Handles Fetch requests and
     * - Rewrite Googlevideo URLs to Proxy URLs (if necessary)
     * - Store auth headers for the authentication of further unlock requests.
     * - Add "content check ok" flags to request bodys
     */
    function handleFetchRequest(url, requestOptions) {
        const url_obj = new URL(url);

        if (url_obj.pathname.startsWith('/youtubei/') && requestOptions.headers) {
            // Store auth headers in authStorage for further usage.
            for (const key in requestOptions.headers) {
                if (GOOGLE_AUTH_HEADER_NAMES.includes(key)) {
                    localStorage.setItem('SYARB_' + key, JSON.stringify(requestOptions.headers[key]));
                }
            }
        }

        if (['/youtubei/v1/player', '/youtubei/v1/next'].includes(url_obj.pathname)) {
            // Add content check flags to player and next request (this will skip content warnings)
            requestOptions.body = setContentCheckOk(requestOptions.body);
        }
    }

    /**
     * Adds `contentCheckOk` and `racyCheckOk` to the given json data (if the data contains a video id)
     * @returns {string} The modified json
     */
    function setContentCheckOk(bodyJson) {
        try {
            const parsedBody = JSON.parse(bodyJson);
            if (parsedBody.videoId) {
                parsedBody.contentCheckOk = true;
                parsedBody.racyCheckOk = true;
                return JSON.stringify(parsedBody);
            }
        } catch {}
        return bodyJson;
    }
})();
