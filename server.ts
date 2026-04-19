import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import 'dotenv/config';

const app = express();
const PORT = 3000;

// Make sure to parse JSON bodies
app.use(express.json());

// === SUPABASE (AND DATABASE) SETUP ===
const MANUAL_SUPABASE_URL = "https://laaholzwfjahuugaqzfh.supabase.co";
const MANUAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYWhvbHp3ZmphaHV1Z2FxemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTgyNjAsImV4cCI6MjA5MjA3NDI2MH0._qdq6eFs1pnYUQ5mCMqbVbIql7IX60Qsax8Te5W6JC8";

const SUPABASE_URL = process.env.SUPABASE_URL || MANUAL_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || MANUAL_SUPABASE_KEY;

// Initialize Supabase Client
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.startsWith('http')) 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 
  : null;

if (!supabase) {
  console.warn("Backend: Supabase client FAILED to initialize.");
  console.warn(` - URL exists: ${!!SUPABASE_URL} (${SUPABASE_URL?.substring(0, 10)}...)`);
  console.warn(` - Key exists: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
  console.warn(` - URL starts with http: ${SUPABASE_URL?.startsWith('http')}`);
} else {
  console.log("Backend: Supabase client initialized successfully.");
}
if (SUPABASE_SERVICE_ROLE_KEY === MANUAL_SUPABASE_KEY) {
  console.warn("Backend: WARNING - Using hardcoded FALLBACK Supabase key.");
} else {
  console.log("Backend: Using CUSTOM Supabase Service Role Key from environment.");
}

let fallbackMemoryStudents: any[] = [];

// --- GLOBAL MIDDLEWARE ---
app.use((req, res, next) => {
  // Ensure we don't return HTML for API routes if something fails early
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// --- API ROUTES ---
const apiRouter = express.Router();

// Middleware to log all API requests
apiRouter.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// 0. Health check / Heartbeat
apiRouter.get('/health', (req, res) => {
  const isAnon = (SUPABASE_SERVICE_ROLE_KEY || "").includes('anon') || (SUPABASE_SERVICE_ROLE_KEY || "").includes('publishable');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: supabase ? (isAnon ? 'connected-as-anon' : 'connected-as-service-role') : 'disconnected',
    env: {
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV
    },
    config: {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_ROLE_KEY
    }
  });
});

// 1. Fetch All Students
apiRouter.get('/students', async (req, res) => {
  try {
    if (supabase) {
      console.log("Supabase: Fetching all students...");
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) {
        console.error("Supabase Select Error:", error);
        throw error;
      }
      console.log(`Supabase: Successfully fetched ${data?.length || 0} students.`);
      return res.json(data);
    }
    console.warn("Supabase: Client not initialized. Using memory fallback.");
    res.json(fallbackMemoryStudents);
  } catch (error: any) {
    console.error("Fetch Students Route Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

apiRouter.post('/students', async (req, res) => {
  const student = req.body;
  
  // Server-side validation
  const requiredFields = ['name', 'admissionNo', 'fatherName', 'branch', 'parentPhone', 'interHallTicket', 'academicYear'];
  const missingFields = requiredFields.filter(field => !student[field] || (typeof student[field] === 'string' && !student[field].trim()));
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: "Missing Required Fields", 
      details: `Please provide all required fields: ${missingFields.join(', ')}` 
    });
  }

  // Phone validation (10 digits)
  if (!/^[6-9]\d{9}$/.test(student.parentPhone)) {
    return res.status(400).json({ 
      error: "Invalid Phone Number", 
      details: "Parent phone must be a valid 10-digit mobile number." 
    });
  }

  console.log("Supabase: Attempting to insert student:", student.name);
  try {
    if (supabase) {
      const { data, error } = await supabase.from('students').insert([student]).select();
      if (error) {
        console.error("Supabase Insert Response Error:", JSON.stringify(error, null, 2));
        if (error.code === '23505') {
          return res.status(409).json({ 
            error: "Duplicate Student Record", 
            details: "A student with this Inter Hall Ticket already exists in the system." 
          });
        }
        throw error;
      }
      console.log("Supabase: Successfully inserted student.");
    } else {
      console.warn("Supabase: Client missing. Saving to local memory.");
      fallbackMemoryStudents = [student, ...fallbackMemoryStudents];
    }
    const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (sheetsWebhookUrl) {
      fetch(sheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      }).catch(err => console.error("Sheets sync failed:", err));
    }
    res.status(201).json({ success: true, student });
  } catch (error: any) {
    console.error("Create Student Route Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

apiRouter.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { id: _id, ...updates } = req.body;
  console.log(`Supabase: Attempting to update student ID ${id} with status: ${updates.status}`);
  try {
    if (supabase) {
      const { data, error } = await supabase.from('students').update(updates).eq('id', id).select();
      if (error) {
        console.error("Supabase Update Response Error:", JSON.stringify(error, null, 2));
        return res.status(400).json({ 
          error: "Supabase update rejected", 
          details: error.message,
          code: error.code 
        });
      }
      console.log(`Supabase: Successfully updated student ${id}.`);
    } else {
      console.warn("Supabase: Client missing. Updating local memory.");
      fallbackMemoryStudents = fallbackMemoryStudents.map((s) => s.id === id ? { ...s, ...updates } : s);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Update Student Route Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

apiRouter.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (supabase) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    } else {
      fallbackMemoryStudents = fallbackMemoryStudents.filter((s) => s.id !== id);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete Student Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for API routes that don't match
apiRouter.all('*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
});

// Mount the API router
app.use('/api', apiRouter);

// --- GLOBAL ERROR HANDLER ---
app.use((err: any, req: any, res: any, next: any) => {
  console.error("UNHANDLED ERROR:", err);
  const status = err.status || 500;
  // If it's an API route, always return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ 
      error: err.message || "Internal Server Error",
      path: req.path
    });
  }
  next(err);
});

// === VITE FRONTEND MIDDLEWARE ===
async function setupFrontend() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      // Use dynamic import to avoid bundling vite in production/Vercel
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load Vite Dev Server:", e);
    }
  } else if (!process.env.VERCEL) {
    // On Vercel, static files are handled by the vercel.json rewrites, 
    // so we don't need to serve them here. 
    // This block only runs if we are in production but NOT on Vercel.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// === STARTUP (LOCAL & PREVIEW) ===
// In AI Studio and local development, we MUST listen on port 3000.
// On Vercel (Production), the function is managed by their runtime.
const isVercelProduction = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

async function startServer() {
  console.log("Backend: Starting initialization...");
  try {
    await setupFrontend();
    
    // Always listen unless we are strictly in Vercel Production
    if (!isVercelProduction) {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend Ready: Listening on http://0.0.0.0:${PORT}`);
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Backend: Port ${PORT} already in use. Skipping listen.`);
        } else {
          console.error("Backend: Server error:", err);
        }
      });
    } else {
      console.log("Backend: Running in Vercel Production mode. Skipping explicit listen.");
    }
  } catch (err) {
    console.error("Backend: Initialization failed:", err);
  }
}

// Start the server
startServer();

export default app;
