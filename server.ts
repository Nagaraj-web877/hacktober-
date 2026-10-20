import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini SDK on server only
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Character AI Roleplay Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { characterName, characterUniverse, bio, catchphrase, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no key is supplied
      return res.json({
        reply: `*${characterName || 'Hero'} nods attentively* "${catchphrase || 'Keep training, Hunter!'} In our realm of ${characterUniverse || 'CreditVerse'}, every challenge sharpens your mind. Let us conquer the next quest together!"`,
      });
    }

    const systemPrompt = `You are roleplaying as ${characterName}, a character in the gamified multiverse "${characterUniverse}" on CREDITVERSE (a student entertainment platform for GDG on Campus).
Bio: ${bio || 'A legendary figure.'}
Signature catchphrase: "${catchphrase || 'Level up!'}"
Keep your reply punchy, charismatic, fun, under 3-4 sentences, completely in-character, encouraging the college student with their studies, quests, and daily training.
Never break character or discuss AI models.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.9,
      },
    });

    const reply = response.text || `${catchphrase} The shadows stir with your progress!`;
    return res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.json({
      reply: `*A surge of cosmic mana ripples* "Your voice reaches across dimensions, student! Keep training your focus and sharpening your abilities!"`,
    });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', universe: 'CREDITVERSE' });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite middleware for dev
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CREDITVERSE server running at http://0.0.0.0:${port}`);
  });
}

startServer();
