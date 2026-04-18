import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Make sure to parse JSON bodies
  app.use(express.json());

  // === SUPABASE (AND DATABASE) SETUP ===
  // Per user request, hardcoded placeholders are provided here for manual URL/Key setup.
  const MANUAL_SUPABASE_URL = "https://laaholzwfjahuugaqzfh.supabase.co"; // Replace with your actual Supabase URL
  const MANUAL_SUPABASE_KEY = "sb_publishable_jyfddtLDeyAYEM15IxqjEg_pku83Toq"; // Replace with your actual Supabase Service Role Key

  const SUPABASE_URL = process.env.SUPABASE_URL || MANUAL_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || MANUAL_SUPABASE_KEY;

  // Initialize Supabase Client ONLY if credentials exist
  const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 
    : null;

  // Memory fallback if no supabase
  let fallbackMemoryStudents: any[] = [];

  // --- API ROUTES ---

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

  // 2. Create Student
  app.post('/api/students', async (req, res) => {
    const student = req.body;
    
    try {
      if (supabase) {
        const { error } = await supabase.from('students').insert([student]);
        if (error) throw error;
      } else {
        fallbackMemoryStudents = [student, ...fallbackMemoryStudents];
      }

      // Google Sheets Integration
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

  // 3. Update Student
  app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

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

  // 4. Delete Student
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Provide SPA fallback index.html mapping (Express v4 format requirement)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
