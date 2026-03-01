# Quick Start: Deploy to Render

## 🚀 Fast Deployment (5 Steps)

### Step 1: Push to GitHub
```bash
cd /Users/zubairishaq/variation
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Create PostgreSQL Database
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Name: `pharmacy-revenue-db`
4. Click **"Create Database"**
5. **Copy the Internal Database URL** (starts with `postgresql://`)

### Step 3: Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `pharmacy-revenue-backend`
   - **Root Directory**: `BABL-WORK/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main_complete:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`
4. Environment Variables:
   - `DATABASE_URL`: (paste Internal Database URL from Step 2)
   - `PYTHON_VERSION`: `3.11.0`
   - `CORS_ORIGINS`: `https://your-frontend.onrender.com` (update after frontend deploys)
5. Click **"Create Web Service"**
6. **Copy the backend URL** (e.g., `https://pharmacy-revenue-backend.onrender.com`)

### Step 4: Deploy Frontend
1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `pharmacy-revenue-frontend`
   - **Root Directory**: `BABL-WORK/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Environment Variables:
   - `REACT_APP_API_URL`: (paste backend URL from Step 3)
5. Click **"Create Static Site"**
6. **Copy the frontend URL**

### Step 5: Update CORS
1. Go to Backend Service → **Environment**
2. Update `CORS_ORIGINS` with your frontend URL
3. Save and wait for redeploy

## ✅ Done!

Visit your frontend URL and log in:
- Username: `admin`
- Password: `admin123`

## 📋 Checklist

- [ ] Database created
- [ ] Backend deployed and healthy
- [ ] Frontend deployed
- [ ] CORS updated
- [ ] Can log in successfully

## 🆘 Troubleshooting

**Backend won't start?**
- Check logs in Render Dashboard
- Verify `DATABASE_URL` is correct
- Ensure it's the **Internal Database URL**

**Frontend can't connect?**
- Verify `REACT_APP_API_URL` matches backend URL exactly
- Check CORS settings include frontend URL
- No trailing slashes in URLs

**Database errors?**
- Use Internal Database URL (not External)
- Wait for database to fully initialize
- Check database is running in Render Dashboard

## 📚 Full Documentation

See `RENDER_DEPLOYMENT.md` for detailed instructions.
