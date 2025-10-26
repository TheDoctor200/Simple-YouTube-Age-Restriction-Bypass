import { Logger } from '../utils/logger.js';

const logger = new Logger('Interceptor');

export class Interceptor {
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

        JSON.parse = function(...args) {
            const data = self.nativeJSON.apply(this, args);

            if (typeof data === 'object' && data !== null) {
                self.processData(data);
            }

            return data;
        };
    }

    attachXHRInterceptor() {
        const self = this;

        XMLHttpRequest.prototype.open = function(method, url, ...args) {
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

            return self.nativeXHR.call(this, method, url, ...args);
        };
    }

    attachFetchInterceptor() {
        const self = this;

        window.fetch = function(url, options = {}) {
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
            set(value) { this[dataKey] = value; },
            get() { return this[dataKey]; }
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
            configurable: true
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
                logger.error('Callback failed', error);
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
