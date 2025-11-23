# Debatel Setup Guide

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

### ⚠️ IMPORTANT: If you cloned from GitHub

The `.env.local` file is **NOT** included in the GitHub repository for security reasons. You MUST create it manually:

1. **Create the file:**
   ```bash
   cd /Users/sawyerbrotman/Debatle
   touch .env.local
   ```

2. **Add your OpenAI API key:**
   - Open `.env.local` in any text editor
   - Add this line:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Get your API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Sign in/create account
   - Click "Create new secret key"
   - Copy the key (starts with `sk-proj-...`)
   - Replace `sk-your-actual-key-here` with your actual key

4. **Restart the server:**
   ```bash
   # Stop server (Ctrl+C in terminal)
   npm run dev
   ```

5. AI will now judge all debates!

## 📝 Features

- ✅ Real-time multiplayer debates (human vs human)
- ✅ Ranked and Practice game modes
- ✅ Speed (30s) and Standard (60s) modes
- ✅ Choose your debate side (For/Against)
- ✅ AI-powered debate judge (GPT-4)
- ✅ User authentication system
- ✅ Exit confirmation with rank penalty
- ✅ Turn-based alternating system
- ✅ Response time tracking
- ✅ Detailed scoring breakdown

**Note:** This is a **multiplayer-only** platform. You can only debate against real people online. There is no AI opponent - the AI only serves as the judge.

## 🔧 Troubleshooting

**Can't connect from other device?**
- Make sure both devices are on same WiFi network
- Check firewall isn't blocking port 3000
- Try disabling VPN if active

**AI not working?**
- **Most common issue**: `.env.local` file missing (see above if you cloned from GitHub)
- Verify OPENAI_API_KEY is set in .env.local
- Check you have credits on OpenAI account
- Look for errors in terminal output
- The API key should start with `sk-proj-` or `sk-`

**Judge scores seem random?**
- AI judge IS being called, but scores are based on actual argument quality
- The judge uses GPT-4 to analyze your specific arguments
- Check terminal for "Judging debate with AI..." message
- If API call fails, it falls back to simple score comparison

**"Not connected to server" error?**
- Refresh the page
- Check server is running in terminal
- Look for "Ready on http://0.0.0.0:3000" message
