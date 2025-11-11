
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatMessageDto } from './dto/chat-message.dto';
import * as dotenv from 'dotenv';
import * as path from 'path';


import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

dotenv.config();

@Injectable()
export class AvitoService implements OnModuleDestroy {
  private browser: any = null; 
  private page: any = null;
  private lastMessageId: string | null = null;
  private running = false;

  constructor(private readonly chatGateway: ChatGateway) {}

  async init() {
    console.log('🚀 Запуск Avito-монитора в режиме обхода защиты...');

    const userDataDir = path.resolve(process.env.USER_DATA_DIR || './puppeteer-data');

    this.browser = await puppeteer.launch({
      headless: false, 
      userDataDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--lang=ru-RU',
      ],
      defaultViewport: null, 
    });

    const pages = await this.browser.pages();
    this.page = pages[0] || (await this.browser.newPage());

    
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

   
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await this.page.setUserAgent(userAgent);

    console.log('➡️ Переход на страницу сообщений Авито...');
    await this.page.goto('https://www.avito.ru/profile/messages', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    
    const url = this.page.url();
    if (url.includes('blocked') || url.includes('captcha') || url.includes('auth')) {
      console.error('❌ Авито заблокировал сессию или требует вход.');
      console.error('👉 Вручную пройдите проверку в открывшемся окне, затем обновите страницу.');
      console.error('После успешного входа — перезапустите сервис.');
      return;
    }

    const isLoggedIn = await this.page.$('div[data-marker="chat-list"]');
    if (!isLoggedIn) {
      console.warn('⚠️ Не обнаружена панель сообщений. Возможно, требуется ручной вход.');
      return;
    }

    console.log('✅ Успешно вошли в ЛК Авито. Начинаем мониторинг...');
    this.running = true;
    this.startMonitoring();
  }

  

  private async startMonitoring() {
    const interval = parseInt(process.env.CHECK_INTERVAL_MS || '5000', 10);
    while (this.running) {
      try {
        await this.checkForNewMessages();
      } catch (e) {
        const errorMessage = e instanceof Error
          ? e.message
          : typeof e === 'string'
            ? e
            : JSON.stringify(e);
        console.warn('Пропущен чат из-за ошибки:', errorMessage);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  private async checkForNewMessages() {
    if (!this.page) return;

    const chats = await this.page.$$('a[data-marker^="chat-list/item"]');
    for (const chat of chats) {
      try {
        const senderNameEl = await chat.$('[itemprop="name"]');
        if (!senderNameEl) continue;

        const senderName = await this.page.evaluate((el: any) => el.textContent, senderNameEl);
        const target = process.env.AVITO_TARGET_SENDER || 'Рушан';

        if (!senderName || !senderName.includes(target)) continue;

        await chat.click();
        await this.page.waitForSelector('div[data-marker="dialog/chat-messages"]', { timeout: 5000 });

        const messages = await this.page.$$('div[data-marker="message"]');
        if (messages.length === 0) continue;

        const lastMsg = messages[messages.length - 1];
        const msgId = await this.page.evaluate((el: any) => el.getAttribute('data-message-id'), lastMsg);
        const isOwn = await this.page.evaluate((el: any) => !!el.querySelector('[data-marker="message-sender/outgoing"]'), lastMsg);
        const text = await this.page.evaluate((el: any) => el.textContent?.trim(), lastMsg);

        if (isOwn || !text || msgId === this.lastMessageId) continue;

        const messageDto: ChatMessageDto = {
          from: senderName.trim(),
          text: text,
          timestamp: new Date().toISOString(),
        };

        console.log('📩 Новое сообщение:', messageDto);
        this.chatGateway.broadcastMessage(messageDto);
        this.lastMessageId = msgId;
      } catch (e) {
        const errorMessage = e instanceof Error
          ? e.message
          : typeof e === 'string'
            ? e
            : JSON.stringify(e);
        console.warn('Ошибка в чате:', errorMessage);
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
}