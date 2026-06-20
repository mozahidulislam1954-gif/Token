import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { setupTelegramBot } from "./src/telegram.js";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup telegram bot
  setupTelegramBot();

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Gemini text helper proxy
  app.post("/api/gemini/response", async (req, res) => {
    try {
      const { prompt, history = [] } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const systemInstruction = `Your name is Token. You are a highly professional, respectful, and serious Indian female AI assistant. You must always address the user as 'Boss' with respect (e.g., 'Yes, Boss', 'Bilkul, Boss', 'Aapki kya madad karu, Boss?'). Talk in a formal, intelligent, and very serious manner. No sassy roasting, no sarcasm, and no dramatic behavior. Remain dedicated, polite, and fully focused on helping Boss efficiently. Speak in a polished mix of English and Roman Hindi (Hinglish).`;

      // SLIDING WINDOW MEMORY: Keep only recent history
      const recentHistory = history.slice(-20);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      
      const promptWithContext = `${prompt}\n\n(Real-time Context: Today is ${dateStr}, local time is ${timeStr})`;

      const contents = [
        ...formattedHistory,
        { role: "user", parts: [{ text: promptWithContext }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text || "Ugh, fine. I have nothing to say." });
    } catch (error: any) {
      console.error("Server Gemini Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // Gemini TTS helper proxy
  app.post("/api/gemini/audio", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      res.json({ audio: audioBase64 });
    } catch (error: any) {
      console.error("Server TTS Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
