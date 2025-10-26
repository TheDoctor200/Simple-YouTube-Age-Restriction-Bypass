/**
 * Centralized logging system
 */
export class Logger {
    constructor(context = 'SYARB') {
        this.context = context;
        this.prefix = '%c[YouTube Age Bypass]';
        this.style = 'background: #1e5c85; color: #fff; padding: 2px 6px; border-radius: 3px;';
    }

    info(message, ...args) {
        console.info(this.prefix, this.style, `[${this.context}]`, message, ...args);
    }

    warn(message, ...args) {
        console.warn(this.prefix, this.style, `[${this.context}]`, message, ...args);
    }

    error(message, error, ...args) {
        console.error(
            this.prefix,
            this.style,
            `[${this.context}]`,
            message,
            error,
            ...args,
            '\n\n📝 Report issues: https://github.com/TheDoctor200/Simple-YouTube-Age-Restriction-Bypass/issues'
        );
    }

    debug(message, ...args) {
        if (window.SYARB_DEBUG) {
            console.debug(this.prefix, this.style, `[${this.context}]`, message, ...args);
        }
    }
}
