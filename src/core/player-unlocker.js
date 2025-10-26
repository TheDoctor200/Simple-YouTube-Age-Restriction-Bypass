import { Config } from '../config.js';
import { Logger } from '../utils/logger.js';
import { YouTubeUtils } from '../utils/youtube.js';
import { Toast } from '../ui/toast.js';
import { UnlockStrategies } from './unlock-strategies.js';

const logger = new Logger('PlayerUnlocker');

export class PlayerUnlocker {
    constructor() {
        this.cache = new Map();
        this.lastUnlockedVideoId = null;
    }

    process(data) {
        if (!this.isPlayerResponse(data)) return false;

        const playabilityStatus = data.previewPlayabilityStatus || data.playabilityStatus;
        if (!this.isAgeRestricted(playabilityStatus)) return false;

        logger.info('Age-restricted video detected');

        const videoId = data.videoDetails?.videoId || YouTubeUtils.getYtcfg('PLAYER_VARS')?.video_id;
        if (!videoId) {
            logger.error('Cannot unlock: no video ID found');
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

            logger.info(`✅ Video unlocked: ${videoId}`);
            Toast.show('Age-restricted video unlocked!', 5);

            return true;

        } catch (error) {
            logger.error('Failed to unlock video', error);
            Toast.show('Failed to unlock video - check console for details', 10);
            return false;
        }
    }

    unlock(videoId, reason) {
        // Check cache
        if (this.cache.has(videoId)) {
            logger.debug('Using cached response');
            return JSON.parse(JSON.stringify(this.cache.get(videoId)));
        }

        const strategies = UnlockStrategies.getPlayer(videoId, reason);

        for (const strategy of strategies) {
            if (strategy.skip) continue;
            if (strategy.requiresAuth && !YouTubeUtils.isUserLoggedIn()) continue;

            logger.info(`Trying strategy: ${strategy.name}`);

            try {
                const response = this.sendRequest(strategy.payload, strategy.requiresAuth);

                if (this.isValidResponse(response)) {
                    logger.info(`✓ Strategy succeeded: ${strategy.name}`);

                    // Add workaround for tracking params
                    this.fixTrackingParams(response);

                    // Cache successful response
                    this.cache.set(videoId, response);

                    return response;
                }

            } catch (error) {
                logger.warn(`Strategy failed: ${strategy.name}`, error);
            }
        }

        logger.error('All unlock strategies failed');
        return null;
    }

    sendRequest(payload, useAuth = false) {
        const xhr = new XMLHttpRequest();
        const apiKey = YouTubeUtils.getApiKey();

        xhr.open('POST', `/youtubei/v1/player?key=${apiKey}&prettyPrint=false`, false);
        xhr.setRequestHeader('Content-Type', 'application/json');

        if (useAuth && YouTubeUtils.isUserLoggedIn()) {
            xhr.withCredentials = true;

            Config.AUTH_HEADERS.forEach(header => {
                const value = this.getStoredHeader(header);
                if (value) xhr.setRequestHeader(header, value);
            });
        }

        xhr.send(JSON.stringify(payload));
        return JSON.parse(xhr.responseText);
    }

    isPlayerResponse(data) {
        return (data?.videoDetails && data?.playabilityStatus) ||
               data?.previewPlayabilityStatus;
    }

    isAgeRestricted(playabilityStatus) {
        if (!playabilityStatus?.status) return false;

        if (playabilityStatus.desktopLegacyAgeGateReason) return true;

        if (Config.UNLOCKABLE_STATUSES.includes(playabilityStatus.status)) return true;

        // Embed player detection
        if (Config.IS_EMBED) {
            const errorUrl = playabilityStatus.errorScreen
                ?.playerErrorMessageRenderer
                ?.reason
                ?.runs
                ?.find(x => x.navigationEndpoint)
                ?.navigationEndpoint
                ?.urlEndpoint
                ?.url;

            return errorUrl?.includes('/2802167');
        }

        return false;
    }

    isValidResponse(response) {
        return response?.playabilityStatus &&
               Config.VALID_STATUSES.includes(response.playabilityStatus.status) &&
               response.streamingData;
    }

    fixTrackingParams(response) {
        if (!response.trackingParams || !response.responseContext?.mainAppWebResponseContext?.trackingParam) {
            response.trackingParams = 'CAAQu2kiEwjor8uHyOL_AhWOvd4KHavXCKw=';
            response.responseContext = {
                mainAppWebResponseContext: {
                    trackingParam: 'kx_fmPxhoPZRzgL8kzOwANUdQh8ZwHTREkw2UqmBAwpBYrzRgkuMsNLBwOcCE59TDtslLKPQ-SS'
                }
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
