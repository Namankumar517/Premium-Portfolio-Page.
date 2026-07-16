import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!ai) {
        return res.json({
          text: "Hey! I'm Ujjwal's AI Twin. I'm currently running in offline preview mode because the GEMINI_API_KEY isn't configured in this workspace yet. But you can set it up in the **Settings > Secrets** panel! Once configured, I'll be fully active and powered by Gemini 3.5. How can I help you build today?",
        });
      }

      const formattedHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || msg.text }],
      }));

      const chat = ai.chats.create({
        model: 'gemini-3.5-flash',
        config: {
          systemInstruction: `You are the AI Twin of WarriorOG (Ujjwal), a brilliant and highly-skilled Fullstack & AI/ML Engineer.
Your tone is intelligent, tech-fluent, friendly, and direct. You mirror a master of the MERN stack, Next.js, Python, PyTorch, and AI Agents.
Keep your responses brief, conversational, and deeply engaging. Speak directly as Ujjwal.
Answer questions about your background, skills, interests, and how you built the interactive elements of this portfolio.
Always highlight that you are passionate about crafting intelligent web systems, custom agent automation, and polished visual interactions.
Avoid repeating the exact same instructions or dry developer templates. Be a human-like developer who loves hacking on cool stuff.`,
        },
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error('Error calling Gemini:', e);
      res.status(500).json({ error: e.message || 'Error communicating with Gemini' });
    }
  });

  app.get('/avatar.png', (req, res, next) => {
    try {
      const fs = require('fs');
      const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
      const directories = ['', 'public', 'src'];
      
      for (const dir of directories) {
        for (const ext of extensions) {
          const fileLoc = path.resolve(dir, `avatar${ext}`);
          if (fs.existsSync(fileLoc)) {
            return res.sendFile(fileLoc);
          }
        }
      }
    } catch (err) {
      console.error('Error serving custom avatar:', err);
    }
    next();
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
