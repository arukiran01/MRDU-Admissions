# MRDU Admissions ERP - Deployment Guide

This application is built with React (Vite) and a Node.js (Express) backend, designed to be hosted easily on Vercel.

## 🚀 Beginner's Guide: Hosting on Vercel

Follow these steps to put your ERP online:

### 1. Push your code to GitHub
- Create a new repository on GitHub (e.g., `mrdu-admissions`).
- Push your current project files to that repository.

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
- Click **"Add New"** > **"Project"**.
- Import your `mrdu-admissions` repository.

### 3. Configure Settings
Vercel should automatically detect the settings, but double-check these:
- **Framework Preset**: `Vite` (or `Other`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Important: Set Environment Variables
Before clicking "Deploy", scroll down to **Environment Variables**. You **MUST** add these 4 keys from your Supabase Dashboard:

| Key | Value (Example) |
|-----|-----------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `SUPABASE_URL` | `https://your-project.supabase.co` (Same as above) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (Found in Supabase > Settings > API) |

> **Note**: `VITE_` variables are used by the browser. The others are used by the backend server.

### 5. Click "Deploy"
- Vercel will build your app. Once finished, you will get a live URL (e.g., `mrdu-admissions.vercel.app`).

## 🛠 Troubleshooting
- **Fetch Error**: If you see "Failed to fetch" on your live site, ensure you added the `SUPABASE_SERVICE_ROLE_KEY` correctly in the Vercel dashboard.
- **Real-time Sync**: Ensure you have enabled "Realtime" on the `students` table in your Supabase Dashboard (Database > Replication > Enable for students table).

## 🌍 Custom Domain
Once deployed, go to **Settings > Domains** in Vercel to add your own `mrdu.edu.in` or similar domain. Vercel will provide instructions on how to update your DNS records.
