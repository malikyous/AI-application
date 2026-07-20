# AI Chat Application - Deployment Guide

This guide will help you deploy the AI Chat application to production.

## Architecture

- **Frontend**: React + Vite (deployed to Vercel)
- **Backend**: Flask + SocketIO (deployed to Render)

## Step 1: Deploy Backend to Render

### Prerequisites
- Render account (free tier available)
- GitHub account

### Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create new Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder or configure root directory

4. **Configure Build & Deploy Settings**
   ```
   Name: ai-chat-backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python app.py
   ```

5. **Add Environment Variables**
   - `SECRET_KEY`: Generate a random key (use: `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `GOOGLE_AI_API_KEY`: Your Google AI API key
   - `DATABASE_URL`: Render will provide PostgreSQL URL (or use SQLite for free)
   - `PORT`: 5000 (Render sets this automatically)

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the backend URL (e.g., `https://ai-chat-backend.onrender.com`)

## Step 2: Deploy Frontend to Vercel

### Prerequisites
- Vercel account (free)
- GitHub account

### Steps

1. **Create Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

3. **Configure Project Settings**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables**
   - `VITE_API_URL`: Your Render backend URL + `/api`
     - Example: `https://ai-chat-backend.onrender.com/api`

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy the frontend URL

## Step 3: Update Frontend Environment (if needed)

If you need to change the backend URL after deployment:

1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Update `VITE_API_URL`
4. Redeploy the project

## Free Tier Limits

### Render (Backend)
- Free tier available
- 512MB RAM
- Shared CPU
- Spins down after 15 minutes of inactivity (cold starts)
- PostgreSQL database available on free tier

### Vercel (Frontend)
- Free tier available
- Unlimited bandwidth
- 100GB bandwidth per month
- Automatic SSL
- Global CDN

## Alternative Deployment Options

### Railway (Alternative to Render)
1. Create Railway account
2. Import repository
3. Railway auto-detects Python
4. Add environment variables
5. Deploy

### Heroku (Paid)
1. Create Heroku account
2. Install Heroku CLI
3. `heroku create`
4. `heroku config:set GOOGLE_AI_API_KEY=your_key`
5. `git push heroku main`

## Troubleshooting

### Backend Issues
- **Database errors**: Ensure DATABASE_URL is set correctly
- **API key errors**: Verify GOOGLE_AI_API_KEY is set
- **Port issues**: Render sets PORT automatically

### Frontend Issues
- **API connection errors**: Check VITE_API_URL matches backend URL
- **CORS errors**: Backend CORS is set to allow all origins
- **Build errors**: Check Node.js version compatibility

### WebSocket Issues
- Render supports WebSockets on free tier
- Ensure SocketIO is properly configured
- Check firewall settings

## Post-Deployment Checklist

- [ ] Backend is accessible at its URL
- [ ] Frontend loads without errors
- [ ] API calls work (check browser console)
- [ ] WebSocket connection is established
- [ ] File uploads work
- [ ] PDF processing works
- [ ] Templates feature works
- [ ] Search feature works
- [ ] Export feature works
- [ ] Theme switcher works

## Local Development

After deployment, you can still run locally:

```bash
# Backend
cd backend
venv\Scripts\activate
python app.py

# Frontend
cd frontend
npm run dev
```

## Support

For issues:
- Check Render logs
- Check Vercel logs
- Verify environment variables
- Check browser console for errors
