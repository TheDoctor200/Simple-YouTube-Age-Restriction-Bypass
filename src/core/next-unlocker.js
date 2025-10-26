import { Logger } from '../utils/logger.js';
import { YouTubeUtils } from '../utils/youtube.js';
import { UnlockStrategies } from './unlock-strategies.js';

const logger = new Logger('NextUnlocker');

export class NextUnlocker {
    constructor() {
        this.cache = new Map();
        this.lastUnlockedVideoId = null;
    }

    process(data) {
        const response = data.response || data;

        if (!this.isWatchNextResponse(response)) return false;
        if (!this.isSidebarEmpty(response)) return false;

        const videoId = response.currentVideoEndpoint?.watchEndpoint?.videoId;
        if (!videoId) return false;

        // Only unlock if player was unlocked for this video
        if (videoId !== this.lastUnlockedVideoId) return false;

        try {
            const unlockedData = this.unlock(videoId);

            if (unlockedData && !this.isSidebarEmpty(unlockedData)) {
                this.mergeSidebar(response, unlockedData);
                logger.info(`✅ Sidebar unlocked: ${videoId}`);
                return true;
            }
        } catch (error) {
            logger.error('Failed to unlock sidebar', error);
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

            logger.info(`Trying next strategy: ${strategy.name}`);

            try {
                const response = this.sendRequest(strategy.payload, strategy.optionalAuth);

                if (!this.isSidebarEmpty(response)) {
                    this.cache.set(videoId, response);
                    return response;
                }
            } catch (error) {
                logger.warn(`Next strategy failed: ${strategy.name}`, error);
            }
        }

        return null;
    }

    sendRequest(payload, useAuth = false) {
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
        return data?.contents?.twoColumnWatchNextResults ||
               data?.contents?.singleColumnWatchNextResults;
    }

    isSidebarEmpty(data) {
        if (data.IS_DESKTOP) {
            const results = data.contents?.twoColumnWatchNextResults
                ?.secondaryResults?.secondaryResults?.results;
            return !results;
        }

        // Mobile
        const contents = data.contents?.singleColumnWatchNextResults
            ?.results?.results?.contents;
        const feed = contents?.find(x =>
            x.itemSectionRenderer?.targetId === 'watch-next-feed'
        );
        return !feed?.itemSectionRenderer;
    }

    mergeSidebar(original, unlocked) {
        // Implementation for merging sidebar data
        // Desktop vs Mobile layouts
        if (original.contents?.twoColumnWatchNextResults) {
            original.contents.twoColumnWatchNextResults.secondaryResults =
                unlocked.contents.twoColumnWatchNextResults.secondaryResults;
        } else if (original.contents?.singleColumnWatchNextResults) {
            // Mobile merge logic
            const unlockedFeed = unlocked.contents.singleColumnWatchNextResults
                ?.results?.results?.contents?.find(x =>
                    x.itemSectionRenderer?.targetId === 'watch-next-feed'
                );

            if (unlockedFeed) {
                original.contents.singleColumnWatchNextResults.results.results.contents
                    .push(unlockedFeed);
            }
        }
    }
}
