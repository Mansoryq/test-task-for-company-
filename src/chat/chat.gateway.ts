import {WebSocketGateway,WebSocketServer,OnGatewayInit,} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  afterInit() {
    console.log('WebSocket gateway initialized');
  }

  broadcastMessage(message: any) {
    this.server.emit('newMessage', message);
  }
}