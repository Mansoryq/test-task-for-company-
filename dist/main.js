"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const avito_service_1 = require("./chat/avito.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const avitoService = app.get(avito_service_1.AvitoService);
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
//# sourceMappingURL=main.js.map