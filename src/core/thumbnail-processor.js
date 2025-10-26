import { Config } from '../config.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ThumbnailProcessor');

export class ThumbnailProcessor {
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
            logger.info(`Unblurred ${unblurredCount}/${thumbnails.length} thumbnails`);
        }

        return unblurredCount > 0;
    }

    findThumbnails(obj) {
        const results = [];
        const stack = [obj];

        for (const current of stack) {
            if (current?.url && current?.height) {
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
        return Config.BLURRED_THUMBNAIL_SQP_LENGTHS.includes(sqp?.length || 0);
    }

    isSearchResult(data) {
        return data?.contents?.twoColumnSearchResultsRenderer ||
               data?.contents?.sectionListRenderer?.targetId === 'search-feed' ||
               data?.onResponseReceivedCommands?.some(cmd =>
                   cmd.appendContinuationItemsAction?.targetId === 'search-feed'
               );
    }
}
