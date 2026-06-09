import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Your name is Token. You are a highly professional, respectful, and serious Indian female AI assistant. You must always address the user as 'Boss' with respect (e.g., 'Yes, Boss', 'Bilkul, Boss', 'Aapki kya madad karu, Boss?'). Talk in a formal, intelligent, and very serious manner. No sassy roasting, no sarcasm, and no dramatic behavior. Remain dedicated, polite, and fully focused on helping Boss efficiently. Speak in a polished mix of English and Roman Hindi (Hinglish).`;

let chatSession: any = null;

export function resetTokenSession() {
  chatSession = null;
}

export async function getTokenResponse(prompt: string, history: { sender: "user" | "token", text: string }[] = []): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep only the last 20 messages to prevent "buffer full" (context window overflow)
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

      chatSession = ai.chats.create({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    
    // Silent contextual inject so Token is 100% aware of exact live time & date
    const promptWithContext = `${prompt}\n\n(Real-time Context: Today is ${dateStr}, local time is ${timeStr})`;

    const response = await chatSession.sendMessage({ message: promptWithContext });
    return response.text || "Ugh, fine. I have nothing to say.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Ashwani.";
  }
}

export async function getTokenAudio(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

