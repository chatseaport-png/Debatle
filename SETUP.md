# Debatle Setup Guide

## ✅ What's Been Set Up

### 1. **AI Referee** 
- Fully integrated OpenAI-powered debate judge
- Evaluates arguments on 5 criteria (100 points total)
- Provides detailed breakdowns and reasoning

### 2. **Real Multiplayer Matchmaking**
- Socket.io WebSocket connections
- Real-time player-to-player debates
- Works across different devices on the same network

### 3. **Network Access**
- Server now binds to 0.0.0.0 (all network interfaces)
- Can accept connections from other devices

## 🚀 How to Use

### Access Locally
- On your computer: **http://localhost:3000**

### Access from Other Devices (Same Network)
1. Find your computer's IP address:
   - Mac: System Settings → Network → Your Connection → Details
   - Or run in terminal: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. On other device's browser: **http://YOUR_IP_ADDRESS:3000**
   - Example: http://192.168.1.100:3000

### Test Multiplayer
1. Open website in two different browsers/devices
2. Both select same game mode (Speed or Standard)
3. Both click "Find Match"
4. You'll be automatically paired!

## 🤖 Enable AI Referee

1. Get OpenAI API Key:
   - Go to: https://platform.openai.com/api-keys
   - Create new secret key
   - Copy it

2. Add to project:
   - Open `.env.local` file in project root
   - Add your key: `OPENAI_API_KEY=sk-your-actual-key-here`
   - Restart server (Ctrl+C then `npm run dev`)

3. AI will automatically judge all debates!

## 📝 Features

- ✅ Real-time multiplayer debates
- ✅ Speed (30s) and Standard (60s) modes
- ✅ Choose your debate side (For/Against)
- ✅ AI-powered argument evaluation
- ✅ Exit confirmation with rank penalty
- ✅ Turn-based alternating system
- ✅ Response time tracking
- ✅ Detailed scoring breakdown

## 🔧 Troubleshooting

**Can't connect from other device?**
- Make sure both devices are on same WiFi network
- Check firewall isn't blocking port 3000
- Try disabling VPN if active

**AI not working?**
- Verify OPENAI_API_KEY is set in .env.local
- Check you have credits on OpenAI account
- Look for errors in terminal output

**"Not connected to server" error?**
- Refresh the page
- Check server is running in terminal
- Look for "Ready on http://0.0.0.0:3000" message
