/**
 * Simple YouTube Age Restriction Bypass
 * Modern rewrite with improved error handling and logging
 * @version 2.6.1
 */

import { Config } from './config.js';
import { Logger } from './utils/logger.js';
import { PlayerUnlocker } from './core/player-unlocker.js';
import { NextUnlocker } from './core/next-unlocker.js';
import { ThumbnailProcessor } from './core/thumbnail-processor.js';
import { Interceptor } from './core/interceptor.js';
import { Toast } from './ui/toast.js';

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
