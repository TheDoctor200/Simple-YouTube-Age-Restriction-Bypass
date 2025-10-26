import { Config } from '../config.js';
import { YouTubeUtils } from '../utils/youtube.js';

export class UnlockStrategies {
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
                            hl
                        },
                        thirdParty: {
                            embedUrl: 'https://www.youtube.com/'
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: sts,
                            referer: 'https://www.youtube.com/',
                            html5Preference: 'HTML5_PREF_WANTS'
                        }
                    },
                    videoId,
                    startTimeSecs: startTime,
                    contentCheckOk: true,
                    racyCheckOk: true
                }
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
                            hl
                        },
                        thirdParty: {
                            embedUrl: 'https://www.youtube.com/'
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: sts,
                            referer: 'https://www.youtube.com/'
                        }
                    },
                    videoId,
                    startTimeSecs: startTime,
                    contentCheckOk: true,
                    racyCheckOk: true
                }
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
                            hl
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: sts
                        }
                    },
                    videoId,
                    startTimeSecs: startTime,
                    contentCheckOk: true,
                    racyCheckOk: true,
                    params: 'CgIQBg=='
                }
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
                            hl
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: sts
                        }
                    },
                    videoId,
                    startTimeSecs: startTime,
                    contentCheckOk: true,
                    racyCheckOk: true
                }
            },
            {
                name: 'Content Warning Bypass',
                skip: !reason?.includes('CHECK_REQUIRED'),
                requiresAuth: false,
                payload: {
                    context: {
                        client: {
                            clientName: YouTubeUtils.getClientName(),
                            clientVersion: YouTubeUtils.getClientVersion(),
                            hl
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: sts
                        }
                    },
                    videoId,
                    startTimeSecs: startTime,
                    contentCheckOk: true,
                    racyCheckOk: true
                }
            }
        ];
    }

    static getNext(videoId, reason) {
        const hl = YouTubeUtils.getLanguage();
        const theme = YouTubeUtils.getYtcfg('INNERTUBE_CONTEXT')?.client?.userInterfaceTheme ||
                     (document.documentElement.hasAttribute('dark') ? 'USER_INTERFACE_THEME_DARK' : 'USER_INTERFACE_THEME_LIGHT');

        return [
            {
                name: 'Content Warning Bypass',
                skip: !reason?.includes('CHECK_REQUIRED'),
                payload: {
                    context: {
                        client: {
                            clientName: YouTubeUtils.getClientName(),
                            clientVersion: YouTubeUtils.getClientVersion(),
                            hl,
                            userInterfaceTheme: theme
                        }
                    },
                    videoId,
                    contentCheckOk: true,
                    racyCheckOk: true
                }
            }
        ];
    }
}
