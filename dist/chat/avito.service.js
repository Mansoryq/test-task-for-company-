"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvitoService = void 0;
const common_1 = require("@nestjs/common");
const chat_gateway_1 = require("./chat.gateway");
const puppeteer = __importStar(require("puppeteer"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config();
let AvitoService = class AvitoService {
    constructor(chatGateway) {
        this.chatGateway = chatGateway;
        this.browser = null;
        this.page = null;
        this.lastMessageId = null;
        this.running = false;
    }
    async init() {
        console.log('Initializing Avito message monitor...');
        const headless = process.env.PUPPETEER_HEADLESS === 'true';
        const userDataDir = path.resolve(process.env.USER_DATA_DIR || './puppeteer-data');
        this.browser = await puppeteer.launch({
            headless,
            userDataDir,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const pages = await this.browser.pages();
        this.page = pages[0] || (await this.browser.newPage());
        await this.page.goto('https://www.avito.ru/profile/messages', {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });
        const isLoggedIn = await this.page.$('div[data-marker="chat-list"]');
        if (!isLoggedIn) {
            console.warn('⚠️ Не обнаружена панель сообщений. Пожалуйста, вручную войдите в Авито в открывшемся окне браузера, затем перезапустите сервис.');
            await this.close();
            process.exit(1);
        }
        console.log('✅ Успешно загружена страница сообщений Авито.');
        this.running = true;
        this.startMonitoring();
    }
    async startMonitoring() {
        const interval = parseInt(process.env.CHECK_INTERVAL_MS || '5000', 10);
        while (this.running) {
            try {
                await this.checkForNewMessages();
            }
            catch (error) {
                console.error('Ошибка при проверке сообщений:', error);
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }
    async checkForNewMessages() {
        if (!this.page)
            return;
        const chats = await this.page.$$('a[data-marker^="chat-list/item"]');
        for (const chat of chats) {
            try {
                const senderNameEl = await chat.$('[itemprop="name"]');
                if (!senderNameEl)
                    continue;
                const senderName = await this.page.evaluate((el) => el.textContent, senderNameEl);
                const target = process.env.AVITO_TARGET_SENDER || 'Рушан';
                if (!senderName || !senderName.includes(target))
                    continue;
                await chat.click();
                await this.page.waitForSelector('div[data-marker="dialog/chat-messages"]', { timeout: 5000 });
                const messages = await this.page.$$('div[data-marker="message"]');
                if (messages.length === 0)
                    continue;
                const lastMsg = messages[messages.length - 1];
                const msgId = await this.page.evaluate((el) => el.getAttribute('data-message-id'), lastMsg);
                const isOwn = await this.page.evaluate((el) => el.querySelector('[data-marker="message-sender/outgoing"]'), lastMsg);
                const text = await this.page.evaluate((el) => el.textContent?.trim(), lastMsg);
                if (isOwn || !text || msgId === this.lastMessageId)
                    continue;
                const messageDto = {
                    from: senderName.trim(),
                    text: text,
                    timestamp: new Date().toISOString(),
                };
                console.log('📩 Новое сообщение:', messageDto);
                this.chatGateway.broadcastMessage(messageDto);
                this.lastMessageId = msgId;
            }
            catch (e) {
                const errorMessage = e instanceof Error
                    ? e.message
                    : typeof e === 'string'
                        ? e
                        : JSON.stringify(e);
                console.warn('Пропущен чат из-за ошибки:', errorMessage);
            }
        }
    }
    async close() {
        this.running = false;
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    onModuleDestroy() {
        return this.close();
    }
};
exports.AvitoService = AvitoService;
exports.AvitoService = AvitoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_gateway_1.ChatGateway])
], AvitoService);
//# sourceMappingURL=avito.service.js.map