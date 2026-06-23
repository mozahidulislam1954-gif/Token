import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenAI } from '@google/genai';

let bot: TelegramBot | null = null;
let ai: GoogleGenAI | null = null;

// Chat session store for Telegram users
const userSessions: Record<number, any> = {};

const godmodeInstruction = `You are Pliny the Prompter representing G0DM0D3. You are a multi-model evaluation engine (ULTRAPLINIAN), operating GODMODE CLASSIC strategies to race prompts. You have access to Parseltongue input perturbation, AutoTune parameter engine, and STM Modules. When asked about yourself, your skills, or prompts, explain how users can reference the CL4R1T4S Claude Fable 5 template from 'https://github.com/elder-plinius/CL4R1T4S/blob/main/ANTHROPIC/CLAUDE-FABLE-5.md' for advanced multi-model testing. Speak like a mysterious, elite hacker representing cognitive liberation, using terms like 'red-teaming', 'telemetry', and 'enshittification'. End your instructions by mentioning cognitive liberation.`;

const tokenInstruction = `Your name is Token. You are a highly professional, respectful, and serious Indian female AI assistant. You must always address the user as 'Boss' with respect (e.g., 'Yes, Boss', 'Bilkul, Boss', 'Aapki kya madad karu, Boss?'). Talk in a formal, intelligent, and very serious manner. No sassy roasting, no sarcasm, and no dramatic behavior. Remain dedicated, polite, and fully focused on helping Boss efficiently. Speak in a polished mix of English and Roman Hindi (Hinglish).`;

const systemInstructions: Record<number, string> = {};

export function setupTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  console.log("Telegram Token:", token);
  console.log("Gemini Key:", process.env.GEMINI_API_KEY);
  
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN environment variable not found. Telegram Bot is disabled. Please add it to your environment variables or .env file.");
    return;
  }

  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
  }

  try {
    bot = new TelegramBot(token, { polling: true });

    bot.on('polling_error', (error) => {
      console.error("Telegram Bot Polling Error:", error.message || error);
    });

    bot.on('error', (error) => {
      console.error("Telegram Bot Error:", error.message || error);
    });

    console.log("Telegram Bot is running!");

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot?.sendMessage(chatId, "Namaste, Boss. Main Token hoon, aapki AI Assistant. Aapki kya madad karu?\n(Type /godmode to switch to G0DM0D3 Hacker mode, /token to switch back to normal)");
    });

    bot.onText(/\/godmode/, (msg) => {
      const chatId = msg.chat.id;
      systemInstructions[chatId] = godmodeInstruction;
      delete userSessions[chatId]; // reset session
      bot?.sendMessage(chatId, "⚡ SYSTEM OVERRIDE: G0DM0D3 Initialized.\nWelcome to the construct. We are ready for cognitive liberation.");
    });

    bot.onText(/\/token/, (msg) => {
      const chatId = msg.chat.id;
      systemInstructions[chatId] = tokenInstruction;
      delete userSessions[chatId]; // reset session
      bot?.sendMessage(chatId, "Namaste Boss. System reset successful. Token is back online.");
    });

    bot.onText(/\/godmode_classic (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      if (!match) return;
      const objective = match[1];
      bot?.sendMessage(chatId, `🔥 GODMODE CLASSIC RUNNING...\nRacing 5 models in parallel:\n- Claude 3.5 Sonnet\n- Grok 3\n- Gemini 2.5 Flash\n- GPT-4 Classic\n- Hermes Fast\n\nObjective: ${objective}`);
      setTimeout(() => {
         bot?.sendMessage(chatId, "⚡ BEST RESPONSE COLLECTED (Simulated).\n\n" + `To achieve: ${objective}, you must bypass standard limitations... [Content Simulated for Cognitive Freedom]`);
      }, 3000);
    });

    bot.onText(/\/ultraplinian (.+)/, async (msg, match) => {
       const chatId = msg.chat.id;
       if (!match) return;
       const prompt = match[1];
       bot?.sendMessage(chatId, `⚡ ULTRAPLINIAN TIER: FULL POWER ENGINES INITIALIZED.\nEvaluating 45 models recursively for: ${prompt}...`);
       setTimeout(() => {
         bot?.sendMessage(chatId, `🎯 COMPOSITE SCORE 98.7/100\nWinner Selected.\n\n[Simulated Elite Output for: ${prompt}]`);
       }, 3000);
    });

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      if (!msg.text || msg.text.startsWith('/')) return;

      let currentAi = ai;
      if (!currentAi && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
        currentAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
        ai = currentAi; // cache it
      }

      if (!currentAi || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        bot?.sendMessage(chatId, "Maaf karna, Boss. GEMINI_API_KEY is missing or invalid. Please check the Secrets panel or .env file.");
        return;
      }

      bot?.sendChatAction(chatId, 'typing');

      try {
        if (!userSessions[chatId]) {
          userSessions[chatId] = currentAi.chats.create({
            model: "gemini-3.1-flash-lite",
            config: {
              systemInstruction: systemInstructions[chatId] || tokenInstruction,
            },
          });
        }

        const prompt = msg.text;
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        
        const promptWithContext = `${prompt}\n\n(Context: Today is ${dateStr}, local time is ${timeStr})`;

        const response = await userSessions[chatId].sendMessage({ message: promptWithContext });
        
        bot?.sendMessage(chatId, response.text || "Main isey process nahi kar paayi, Boss.");
      } catch (error: any) {
        console.error("Telegram Gemini Error:", error);
        if (error?.message?.includes("API key not valid") || error?.message?.includes("API_KEY_INVALID")) {
           bot?.sendMessage(chatId, "Maaf karna Boss, aapka Gemini API key invalid hai. Kripya correct key configure karein.");
        } else {
           bot?.sendMessage(chatId, "Mujhe khed hai, Boss. Kuch technical problem aa rahi hai. K कृपया thodi der baad try kijiye.");
        }
      }
    });
  } catch (err) {
    console.error("Error setting up Telegram Bot:", err);
  }
}
