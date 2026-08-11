import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initialSignals, mockEntities, mockBehaviorInsights, promptResponses, Signal } from './src/lib/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for live persistence during container lifetime
  let liveSignals: Signal[] = [...initialSignals];

  // Initialize Gemini AI lazily
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  // --- API ROUTES ---

  // Auth Endpoints
  app.get('/api/v1/auth/google/login', (req, res) => {
    res.json({
      url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=signal-app&redirect_uri=http://localhost:3000/api/v1/auth/google/callback&response_type=code&scope=email%20profile%20https://www.googleapis.com/auth/gmail.readonly'
    });
  });

  app.get('/api/v1/auth/google/callback', (req, res) => {
    res.json({
      status: 'success',
      token: 'jwt_mock_token_signal_mahesh',
      user: {
        id: 'usr_mahesh_01',
        name: 'Mahesh',
        email: 'mahesh@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      }
    });
  });

  app.get('/api/v1/auth/me', (req, res) => {
    res.json({
      id: 'usr_mahesh_01',
      name: 'Mahesh',
      email: 'mahesh@example.com',
      last_visit_at: '2026-08-10T18:00:00Z',
      preferences: {
        theme: 'dark',
        auto_archive_newsletters: true,
        priority_threshold: 80
      }
    });
  });

  // Overview Endpoint
  app.get('/api/v1/overview', (req, res) => {
    const needs_action = liveSignals.filter(s => s.bucket === 'do-now');
    const changed = liveSignals.filter(s => s.status === 'changed');
    const due_soon = liveSignals.filter(s => s.deadlineText?.includes('Due') || s.actionType === 'pay');

    res.json({
      greeting: 'hey, Mahesh.',
      summary: 'Since your last visit, 3 things need your attention.',
      stats: {
        new: liveSignals.filter(s => s.status === 'new').length,
        changed: changed.length,
        archived: 31,
        total_signals: 147,
        decisions: 4
      },
      needs_action,
      changed,
      due_soon,
      handled_automatically: {
        newsletters_summarized: 34,
        marketing_archived: 12,
        github_notifications: 6,
        flipkart_offers_archived: 3
      }
    });
  });

  // Focus Endpoints
  app.get('/api/v1/focus', (req, res) => {
    const buckets = ['do-now', 'today', 'this-week', 'waiting', 'completed', 'ignored'];
    const counts = buckets.map(bucket => ({
      bucket,
      count: liveSignals.filter(s => s.bucket === bucket).length
    }));

    res.json({ buckets: counts });
  });

  app.get('/api/v1/focus/:bucket', (req, res) => {
    const bucket = req.params.bucket;
    const filtered = liveSignals.filter(s => s.bucket === bucket);
    res.json({ bucket, signals: filtered });
  });

  app.patch('/api/v1/focus/:signal_id/move', (req, res) => {
    const signalId = req.params.signal_id;
    const { new_bucket, reason } = req.body;

    const signalIndex = liveSignals.findIndex(s => s.id === signalId);
    if (signalIndex !== -1) {
      liveSignals[signalIndex] = {
        ...liveSignals[signalIndex],
        bucket: new_bucket,
        updatedAt: new Date().toISOString()
      };
      res.json({ status: 'success', signal: liveSignals[signalIndex], reason });
    } else {
      res.status(404).json({ error: 'Signal not found' });
    }
  });

  // Timeline Endpoints
  app.get('/api/v1/timeline', (req, res) => {
    res.json({ entities: mockEntities });
  });

  app.get('/api/v1/timeline/entities/:id', (req, res) => {
    const entity = mockEntities.find(e => e.id === req.params.id);
    if (entity) {
      res.json(entity);
    } else {
      res.status(404).json({ error: 'Entity not found' });
    }
  });

  // Ask Signal Endpoint
  app.post('/api/v1/ask', async (req, res) => {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    // Check predefined prompt answers
    if (promptResponses[query]) {
      res.json({
        query,
        answer: promptResponses[query],
        referenced_signals: liveSignals.slice(0, 2)
      });
      return;
    }

    // Try Gemini API if available
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are Signal, an AI Executive Assistant for Mahesh.
Here is the current state of Mahesh's emails & signals:
${JSON.stringify(liveSignals, null, 2)}

User Query: "${query}"

Provide a concise, helpful executive assistant response addressing the query based on his current signals and deadlines.`
        });

        res.json({
          query,
          answer: response.text || `Processed query regarding "${query}".`,
          referenced_signals: liveSignals.slice(0, 2)
        });
        return;
      } catch (err) {
        console.error('Gemini API Error:', err);
      }
    }

    // Default fallback intelligent response
    res.json({
      query,
      answer: `I searched across your 147 signals and found relevant information about "${query}".\n\nBased on your current state, the most relevant items are your Google assessment (due today at 6 PM) and Stripe interview scheduling. Would you like me to take action on these?`,
      referenced_signals: liveSignals.slice(0, 2)
    });
  });

  // Signals CRUD Endpoints
  app.get('/api/v1/signals', (req, res) => {
    res.json({ signals: liveSignals, total: liveSignals.length });
  });

  app.get('/api/v1/signals/:id', (req, res) => {
    const signal = liveSignals.find(s => s.id === req.params.id);
    if (signal) {
      res.json(signal);
    } else {
      res.status(404).json({ error: 'Signal not found' });
    }
  });

  app.post('/api/v1/signals/:id/archive', (req, res) => {
    const signalIndex = liveSignals.findIndex(s => s.id === req.params.id);
    if (signalIndex !== -1) {
      liveSignals[signalIndex].bucket = 'ignored';
      res.json({ status: 'archived', signal: liveSignals[signalIndex] });
    } else {
      res.status(404).json({ error: 'Signal not found' });
    }
  });

  app.post('/api/v1/signals/sync', (req, res) => {
    res.json({
      status: 'synced',
      timestamp: new Date().toISOString(),
      new_signals_count: 0,
      updated_signals_count: 0
    });
  });

  // Vite Middleware integration for SPA rendering
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Signal server running on http://localhost:${PORT}`);
  });
}

startServer();
