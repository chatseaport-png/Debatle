# 🚀 Deploy Debatel to Railway - Step by Step

## ✅ Your code is ready! Follow these steps:

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `Debatel`
3. Make it **Public** or **Private** (your choice)
4. **Do NOT** add README, .gitignore, or license (we already have them)
5. Click "Create repository"

### Step 2: Push Code to GitHub

Copy and run these commands in your terminal:

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/Debatel.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (it's free)
4. Click "Deploy from GitHub repo"
5. Select your `Debatel` repository
6. Railway will automatically detect it's a Node.js app and start deploying!

### Step 4: Configure Environment Variables

1. In Railway dashboard, click on your deployed project
2. Go to **Variables** tab
3. Click "Add Variable"
4. Add these:
   - Variable: `OPENAI_API_KEY`
   - Value: `your_openai_api_key_here`
5. Add another:
   - Variable: `NODE_ENV`
   - Value: `production`
6. Click "Deploy" to restart with new variables

### Step 5: Get Your Public URL

1. In Railway dashboard, go to **Settings** tab
2. Scroll to "Domains" section
3. Click "Generate Domain"
4. You'll get a URL like: `https://debatel-production.up.railway.app`
5. **This is your public URL!** Share it with anyone!

---

## 🎉 Your Site is Live!

Anyone can now access your debate platform from anywhere in the world using the Railway URL!

Example: `https://debatel-production.up.railway.app`

---

## 🔧 If You Get Stuck

**Error: "Build failed"**
- Check the build logs in Railway dashboard
- Make sure all dependencies are in package.json

**Error: "Application failed to respond"**
- Check the deployment logs
- Verify PORT environment variable (Railway sets this automatically)

**WebSockets not working?**
- Railway supports WebSockets by default, should work automatically

---

## 💡 Alternative: Quick Test with Ngrok (No GitHub needed)

If you just want to test quickly without deploying:

1. Install ngrok: `brew install ngrok`
2. Make sure your server is running: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Share the ngrok URL (like `https://abc123.ngrok.io`)

**Note**: Ngrok URLs are temporary and change each restart.

---

## Need Help?

1. Make sure your dev server works locally first: `npm run dev`
2. Test at http://localhost:3000
3. If local works but deployment doesn't, check Railway logs
4. Common issue: Missing environment variables (OPENAI_API_KEY)

Let me know if you get stuck at any step!
