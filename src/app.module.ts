import { Module } from '@nestjs/common';
import { ChatGateway } from './chat/chat.gateway';
import { AvitoService } from './chat/avito.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ChatGateway, AvitoService],
})
export class AppModule {}