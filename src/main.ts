import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AvitoService } from './chat/avito.service';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  const avitoService = app.get(AvitoService);
  await avitoService.init();

  await app.listen(3000);
  console.log('HTTP server running on http://localhost:3000');
  console.log('WebSocket server running on ws://localhost:3000');

  
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await avitoService.close();
    await app.close();
    process.exit(0);
  });
}

bootstrap();