# MRDU Admissions ERP - Deployment Guide

This application is built with React (Vite) and connects directly to Supabase for high availability and real-time syncing.

## 🚀 Beginner's Guide: Hosting on Vercel

### 1. Push your code to GitHub
- Create a new repository on GitHub (e.g., `mrdu-admissions`).
- Push your current project files to that repository.

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
- Click **"Add New"** > **"Project"**.
- Import your `mrdu-admissions` repository.

### 3. Important: Set Environment Variables
Vercel should automatically detect the **Framework Preset** as **Vite**.
Before clicking "Deploy", scroll down to **Environment Variables** and add these:

| Key | Value (Example) |
|-----|-----------------|
| `VITE_SUPABASE_URL` | `https://your-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `VITE_GOOGLE_SHEETS_WEBHOOK_URL` | (Optional) Your Sheets URL |

### 4. Click "Deploy"
Vercel will build your app. Once finished, you will get a live URL.

## 🛠 Features Enabled
- **Direct Database Access**: No middleman server needed—faster and more reliable.
- **Real-time Sync**: Ensure "Realtime" is enabled on the `students` table in Supabase (Database > Replication).
- **Auto-Sync**: Google Sheets sync happens automatically on student registration.

## 🌍 Custom Domain
Go to **Settings > Domains** in Vercel to add `mrdu.edu.in` or similar. Vercel will guide you through the DNS setup.
