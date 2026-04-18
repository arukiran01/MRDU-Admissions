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

  const SUPABASE_URL = process.env.SUPABASE_URL || (MANUAL_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' ? MANUAL_SUPABASE_URL : '');
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || (MANUAL_SUPABASE_KEY !== 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE' ? MANUAL_SUPABASE_KEY : '');

  // Initialize Supabase Client ONLY if credentials exist
  const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 
    : null;

  // Memory fallback if no supabase
  let fallbackMemoryStudents: any[] = [];
  let fallbackMemoryLogs: any[] = [];

  // --- HELPER: Create Audit Log ---
  const createAuditLog = async (action: string, details: string, studentId?: string) => {
    const log = { action, details, studentId, createdAt: new Date().toISOString() };
    if (supabase) {
      await supabase.from('audit_logs').insert([log]);
    } else {
      fallbackMemoryLogs = [{ id: Date.now().toString(), ...log }, ...fallbackMemoryLogs];
    }
  };

  // --- API ROUTES ---

  // 1. Fetch All Students
  app.get('/api/students', async (req, res) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    res.json(fallbackMemoryStudents);
  });

  // 2. Create Student
  app.post('/api/students', async (req, res) => {
    const student = req.body;
    
    if (supabase) {
      const { error } = await supabase.from('students').insert([student]);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      fallbackMemoryStudents = [student, ...fallbackMemoryStudents];
    }

    // Log the action
    await createAuditLog('Registration', `Student ${student.name} (Adm: ${student.admissionNo}) was registered.`, student.id);

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
  });

  // 3. Update Student
  app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (supabase) {
      const { error } = await supabase.from('students').update(updates).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      fallbackMemoryStudents = fallbackMemoryStudents.map((s) => s.id === id ? { ...s, ...updates } : s);
    }

    await createAuditLog('Verification Update', `Updated document status for student ID: ${id}.`, id);
    res.json({ success: true });
  });

  // 4. Delete Student
  app.delete('/api/students/:id', async (req, res) => {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      fallbackMemoryStudents = fallbackMemoryStudents.filter((s) => s.id !== id);
    }

    await createAuditLog('Student Deletion', `Student with ID ${id} was deleted.`, id);
    res.json({ success: true });
  });

  // 5. Fetch Audit Logs
  app.get('/api/audit-logs', async (req, res) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(20);
        
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    res.json(fallbackMemoryLogs.slice(0, 20));
  });

  // 5. Explicitly Add manual log
  app.post('/api/audit-logs', async (req, res) => {
    const { action, details, studentId } = req.body;
    await createAuditLog(action, details, studentId);
    res.json({ success: true });
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
