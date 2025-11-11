import { OnModuleDestroy } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
export declare class AvitoService implements OnModuleDestroy {
    private readonly chatGateway;
    private browser;
    private page;
    private lastMessageId;
    private running;
    constructor(chatGateway: ChatGateway);
    init(): Promise<void>;
    private startMonitoring;
    private checkForNewMessages;
    close(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
