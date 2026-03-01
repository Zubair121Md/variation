# Render Deployment Guide

This guide will help you deploy the Pharmacy Revenue Management System to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A GitHub repository with your code
3. PostgreSQL database (Render provides this)

## Step-by-Step Deployment Instructions

### 1. Prepare Your Repository

Ensure all files are committed and pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create PostgreSQL Database on Render

1. Go to your Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `pharmacy-revenue-db`
   - **Database**: `pharmacy_revenue`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier (for testing) or paid (for production)
4. Click "Create Database"
5. **IMPORTANT**: Copy the **Internal Database URL** - you'll need this later

### 3. Deploy Backend Service

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pharmacy-revenue-backend`
   - **Environment**: `Python 3`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `BABL-WORK/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main_complete:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`
4. Add Environment Variables:
   - `DATABASE_URL`: Paste the **Internal Database URL** from step 2
   - `PYTHON_VERSION`: `3.11.0`
   - `CORS_ORIGINS`: `https://your-frontend-url.onrender.com` (you'll update this after frontend deploys)
   - `ENVIRONMENT`: `production`
5. Click "Create Web Service"
6. Wait for deployment to complete
7. **Copy the service URL** (e.g., `https://pharmacy-revenue-backend.onrender.com`)

### 4. Deploy Frontend Service

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pharmacy-revenue-frontend`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `BABL-WORK/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variables:
   - `REACT_APP_API_URL`: Paste the backend URL from step 3 (e.g., `https://pharmacy-revenue-backend.onrender.com`)
   - `NODE_VERSION`: `18.20.0`
5. Click "Create Static Site"
6. Wait for deployment to complete
7. **Copy the frontend URL** (e.g., `https://pharmacy-revenue-frontend.onrender.com`)

### 5. Update CORS Settings

1. Go back to your Backend Service settings
2. Update the `CORS_ORIGINS` environment variable:
   - Add your frontend URL: `https://pharmacy-revenue-frontend.onrender.com`
   - You can add multiple URLs separated by commas
3. Save and redeploy the backend service

### 6. Initialize Database

After the backend is deployed, you need to initialize the database:

1. Go to your Backend Service → "Shell" tab
2. Run:
```bash
cd BABL-WORK/backend
python3 -c "from app.database import init_db; init_db()"
```

Or use the Render Shell:
```bash
python3 -m app.database
```

### 7. Verify Deployment

1. Visit your frontend URL: `https://pharmacy-revenue-frontend.onrender.com`
2. Try logging in with:
   - Username: `admin`
   - Password: `admin123`
3. Check backend health: `https://pharmacy-revenue-backend.onrender.com/health`
4. Check API docs: `https://pharmacy-revenue-backend.onrender.com/docs`

## Environment Variables Reference

### Backend Service

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PYTHON_VERSION` | Python version | `3.11.0` |
| `CORS_ORIGINS` | Allowed frontend URLs | `https://your-app.onrender.com` |
| `ENVIRONMENT` | Environment type | `production` |
| `PORT` | Server port (auto-set by Render) | `10000` |

### Frontend Service

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://backend.onrender.com` |
| `NODE_VERSION` | Node.js version | `18.20.0` |

## Troubleshooting

### Backend won't start
- Check logs in Render Dashboard
- Verify `DATABASE_URL` is correct
- Ensure all dependencies are in `requirements.txt`

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend URL doesn't have trailing slash

### Database connection errors
- Verify `DATABASE_URL` uses the **Internal Database URL**
- Check database is running in Render Dashboard
- Ensure database user has proper permissions

### Build failures
- Check Node.js/Python versions match
- Verify all dependencies are listed
- Review build logs for specific errors

## Using render.yaml (Alternative Method)

If you prefer, you can use the `render.yaml` file for automated deployment:

1. Push `render.yaml` to your repository root
2. In Render Dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect and deploy all services

## Post-Deployment Checklist

- [ ] Database initialized and tables created
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] File upload works
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Custom domain configured (optional)

## Monitoring

- View logs in Render Dashboard → Your Service → Logs
- Set up alerts for service downtime
- Monitor database usage and performance
- Check error rates in logs

## Scaling

For production workloads:
- Upgrade to paid plans for better performance
- Increase worker count in gunicorn command
- Use Render's auto-scaling features
- Consider Redis for caching (add as separate service)

## Support

For issues:
1. Check Render documentation: https://render.com/docs
2. Review application logs
3. Check Render status page
4. Contact Render support if needed
