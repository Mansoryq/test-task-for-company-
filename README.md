# Messenger Real-Time Proxy

<div align="center">
  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJoZGFnczBoNjc5cWt4NXowbmJ5emlmbHoxN2x0YndpbXQ2N21qciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Go92bfjFjYvdQvVsry/giphy.gif" width="270"/>

</div>

<h6 align="center">
  <a href="#-architecture">Architecture</a>
  ·
  <a href="#-setup">Setup</a>
  ·
  <a href="#-deployment">Deployment</a>
  ·
  <a href="#-troubleshooting">Troubleshooting</a>
  ·
  <a href="#-contributing">Contributing</a>
</h6>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3%2B-orange.svg)](https://nestjs.com/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-21.5%2B-green.svg)](https://pptr.dev/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-red.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Cloudflared](https://img.shields.io/badge/Cloudflared-Tunnel-blue.svg)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/installation/)

> A Nest.js backend that automates message monitoring in **Avito Personal Cabinet** for user **Рушан Натфуллин** (or **Рушан**), captures new messages via Puppeteer, and streams them in real-time to a frontend via WebSocket.

---

## 🚀 Architecture

This system is built with a clean Nest.js architecture and follows these key patterns:

- **WebSocket Gateway**: `ChatGateway` handles real-time message broadcasting to connected clients.
- **Service Layer**: `AvitoService` manages Puppeteer automation — login, message polling, and DOM parsing.
- **Dependency Injection**: Services are injected via Nest’s IoC container for testability and modularity.
- **Graceful Shutdown**: SIGINT handler ensures Puppeteer browser closes cleanly on termination.
- **Error Handling**: Robust logging and retry logic for auth failures, page changes, or network interruptions.
- **Frontend**: Simple React/HTML client connects to WebSocket and displays incoming messages.

### Flow

[Avito Web] ←(Puppeteer)→ [Nest.js Backend] →(WebSocket)→ [Frontend UI] <br>
↑ <br>
(Cloudflared tunnel) <br>
↓ <br>
[External Access] <br>


---

## 🔧 Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome/Chromium installed (Puppeteer downloads it automatically by default)
- Cloudflared CLI ([Install guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/installation/))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/avito-messenger-proxy.git
cd avito-messenger-proxy
```
2. Install Dependencies
```
npm install
# or
yarn install
```

3. Configure Avito Credentials
Create .env file in the root:
```
AVITO_USERNAME=your_avito_email@example.com
AVITO_PASSWORD=your_avito_password
AVITO_TARGET_NAME=USERNAME
# or if you prefer short form:
# AVITO_TARGET_NAME=USERNAME
```

🔐 Security Note: Never commit .env to version control. Add it to .gitignore. 

4. Start the Backend
```
npm run start:dev
```
he server starts on http://localhost:3000 and WebSocket on ws://localhost:3000/chat. 

5. Start the Frontend (Optional)
Navigate to /frontend and run:
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 to see real-time messages.

🌐 Deployment (Cloudflared Tunnel)
To expose your local server publicly:

1. Authenticate Cloudflared
```
cloudflared tunnel login
```
Follow the browser prompt to authenticate with your Cloudflare account.

2. Create a Tunnel
```
cloudflared tunnel create avito-messenger
```
his generates a config.yml and a tunnel ID.

3. Configure Tunnel
Edit ~/.cloudflared/<tunnel-id>.yaml:
```
url: http://localhost:3000
hostname: avito.yourdomain.com  
no-tls-verify: true
```
Replace avito.yourdomain.com with any available subdomain from your Cloudflare zone. 

4. Run the Tunnel
```
cloudflared tunnel run --config ~/.cloudflared/<tunnel-id>.yaml
```
5. Connect Frontend to Public Endpoint
Update the WebSocket URL in /frontend/src/App.jsx (or equivalent):
```
const ws = new WebSocket('wss://avito.yourdomain.com/chat');
```
Use wss:// (WebSocket Secure) when connecting via Cloudflared. 

✅ Demo
🔗 Live Demo (Cloudflared): https://avito.yourdomain.com
(Replace with your actual tunnel URL)

💡 Tip: Open DevTools → Network → WS to see raw WebSocket messages. 

🤝 Contributing
Contributions welcome! Please:

Fork the repo
Create your feature branch (git checkout -b feature/your-feature)
Commit your changes (git commit -m 'feat: add message parsing')
Push to the branch (git push origin feature/your-feature)
Open a Pull Request
See CONTRIBUTING.md for guidelines.

📄 License
This project is licensed under the MIT License — see LICENSE for details.


> **Note**: Replace `https://github.com/Mansoryq/test-task-for-company-.git` and `https://avito.yourdomain.com` with your actual GitHub repo and Cloudflared tunnel URL before sharing.


