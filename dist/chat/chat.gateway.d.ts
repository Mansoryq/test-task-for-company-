import { OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
export declare class ChatGateway implements OnGatewayInit {
    server: Server;
    afterInit(): void;
    broadcastMessage(message: any): void;
}
