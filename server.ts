import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

const app = express();
const PORT = 3000;

// Make sure to parse JSON bodies
app.use(express.json());

// === SUPABASE (AND DATABASE) SETUP ===
const MANUAL_SUPABASE_URL = "https://laaholzwfjahuugaqzfh.supabase.co";
const MANUAL_SUPABASE_KEY = "sb_publishable_jyfddtLDeyAYEM15IxqjEg_pku83Toq";

const SUPABASE_URL = process.env.SUPABASE_URL || MANUAL_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || MANUAL_SUPABASE_KEY;

// Initialize Supabase Client
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 
  : null;

let fallbackMemoryStudents: any[] = [];

// --- API ROUTES ---

// 0. Health check / Heartbeat
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: supabase ? 'connected' : 'memory-fallback'
  });
});

// 1. Fetch All Students
app.get('/api/students', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) throw error;
      return res.json(data);
    }
    res.json(fallbackMemoryStudents);
  } catch (error: any) {
    console.error("Fetch Students Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  const student = req.body;
  try {
    if (supabase) {
      const { error } = await supabase.from('students').insert([student]);
      if (error) throw error;
    } else {
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
    console.error("Create Student Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { id: _id, ...updates } = req.body;
  try {
    if (supabase) {
      const { error } = await supabase.from('students').update(updates).eq('id', id);
      if (error) throw error;
    } else {
      fallbackMemoryStudents = fallbackMemoryStudents.map((s) => s.id === id ? { ...s, ...updates } : s);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Update Student Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
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

// === VITE FRONTEND MIDDLEWARE ===
async function setupFrontend() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (!process.env.VERCEL) {
  setupFrontend().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
