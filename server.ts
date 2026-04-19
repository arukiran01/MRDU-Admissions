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

// Validate table existence on startup
if (supabase) {
  supabase.from('students').select('id').limit(1).then(({ error }) => {
    if (error) {
      console.error("CRITICAL: Supabase 'students' table check failed!", error.message);
      console.error("Please run the supabase-schema.sql script in your Supabase SQL Editor.");
    } else {
      console.log("Supabase: 'students' table verified successfully.");
    }
  });
}

let fallbackMemoryStudents: any[] = [];

// --- API ROUTES ---

// 0. Health check / Heartbeat
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: supabase ? (SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_publishable') ? 'connected-as-anon' : 'connected-as-service-role') : 'disconnected',
    config: {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_ROLE_KEY
    }
  });
});

// 1. Fetch All Students
app.get('/api/students', async (req, res) => {
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

app.post('/api/students', async (req, res) => {
  const student = req.body;
  console.log("Supabase: Attempting to insert student:", student.name);
  try {
    if (supabase) {
      const { data, error } = await supabase.from('students').insert([student]).select();
      if (error) {
        console.error("Supabase Insert Error:", error);
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

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { id: _id, ...updates } = req.body;
  console.log(`Supabase: Attempting to update student ID ${id} with status: ${updates.status}`);
  try {
    if (supabase) {
      const { data, error } = await supabase.from('students').update(updates).eq('id', id).select();
      if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
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
