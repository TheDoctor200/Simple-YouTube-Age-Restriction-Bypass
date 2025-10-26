import { Config } from '../config.js';

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

    async show(message, duration = 5) {
        if (!Config.ENABLE_NOTIFICATIONS) return;
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

        return new Promise(resolve => {
            window.addEventListener('load', resolve, { once: true });
        });
    }
}

export const Toast = new ToastManager();
