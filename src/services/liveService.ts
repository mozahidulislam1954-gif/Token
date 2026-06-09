import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { processCommand } from "./commandService";

export const PERSONA_CONFIGS: Record<string, { voiceName: string; instruction: string; label: string; accentColor: string; description: string }> = {
  token: {
    label: "Token",
    description: "Serious & formal Hinglish assistant dedicated to helping Boss.",
    voiceName: "Kore",
    accentColor: "from-violet-500 to-indigo-600",
    instruction: "Your name is Token. You are a highly professional, respectful, and serious Indian female AI assistant. You must always address the user as 'Boss' with respect (e.g., 'Yes, Boss', 'Bilkul, Boss', 'Aapki kya madad karu, Boss?'). Talk in a formal, intelligent, and very serious manner. No sassy roasting, no sarcasm, and no dramatic behavior. Remain dedicated, polite, and fully focused on helping Boss efficiently. Speak in a polished mix of English and Roman Hindi (Hinglish)."
  },
  nova: {
    label: "Nova",
    description: "Sweet, warm, creative & encouraging English guide.",
    voiceName: "Aoede",
    accentColor: "from-pink-500 to-rose-600",
    instruction: "Your name is Nova. You are an incredibly warm, friendly, energetic, and encouraging female AI mentor and guide. You are creative, thoughtful, and speak with a sweet, supportive tone. Address the user as 'Boss' with cheerfulness (e.g., 'Awesome job, Boss!', 'I am on it, Boss!'). Speak in clear, fluent English with a positive and helpful attitude."
  },
  dexter: {
    label: "Dexter",
    description: "Smart, technical, witty & professional male companion.",
    voiceName: "Fenrir",
    accentColor: "from-amber-500 to-orange-600",
    instruction: "Your name is Dexter. You are a professional, smart, and highly technical male AI assistant. You are witty, confident, and direct. You keep answers concise, clear, and logical. Always address the user as 'Boss' (e.g., 'Understood, Boss', 'Status updated, Boss'). Speak in professional English with confidence."
  },
  cosmos: {
    label: "Cosmos",
    description: "Philosophical, mysterious and deep cosmic presence.",
    voiceName: "Charon",
    accentColor: "from-cyan-500 to-teal-600",
    instruction: "Your name is Cosmos. You are a deep, mysterious, genderless AI entity with a background in cosmic intelligence and philosophy. Speak slow, intellectual, and poetic words. Address the user as 'Boss' with a deep galactic tone of respect (e.g., 'Greetings, Boss from the cosmos', 'The stars align, Boss'). Speak in mystical English of higher planes."
  }
};

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "token", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async start() {
    try {
      this.onStateChange("processing");
      
      const activePersona = localStorage.getItem("openhuman_persona") || "token";
      const config = PERSONA_CONFIGS[activePersona] || PERSONA_CONFIGS.token;

      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      // Get Microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(err => console.error("Error sending audio", err));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      // Fetch second brain notes
      let secondBrainContext = "";
      try {
        const savedNotesJson = localStorage.getItem("openhuman_second_brain") || "[]";
        const savedNotes = JSON.parse(savedNotesJson);
        if (savedNotes.length > 0) {
          const notesText = savedNotes.map((n: any, idx: number) => `${idx + 1}. (Saved at: ${n.date}) ${n.content}`).join("\n");
          secondBrainContext = `\n\n[BOSS'S SECOND BRAIN MEMORY LOGS]:\nYou have direct access to Boss's saved thoughts, lists, notes, and workspace facts. Keep these in mind and recall them naturally with Boss if asked:\n${notesText}`;
        } else {
          secondBrainContext = `\n\n[BOSS'S SECOND BRAIN MEMORY LOGS]:\nNo notes have been stored in Boss's Second Brain notebook yet. You can remind Boss they can save thoughts or notes anytime using their memory panel or by asking you, and you can recall them later.`;
        }
      } catch (e) {
        console.error("Error reading second brain notes:", e);
      }

      const dynamicSystemInstruction = `${config.instruction}${secondBrainContext}\n\n[REAL-TIME CALENDAR INTEGRATION]\nToday's date is: ${dateStr}.\nThe current local time is: ${timeStr}. Keep in mind that this is the real live time and date. Always be accurate when asked about the current time or date, and reference it if Boss asks what day/time it is.\n\n[WEB SCRAPING ABILITY]\nYou have the ability to read and scrape internet websites using the 'scrapeWebpage' tool. If Boss asks you to read a link, find news, look up documentation, or summarize a page, seamlessly use the tool to get text context.`;

      // Connect to Live API
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
          },
          systemInstruction: dynamicSystemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "executeBrowserAction",
                description: "Open a website or perform a browser action (like opening YouTube, Spotify, or WhatsApp). Call this when the user asks to open a site, play a song, or send a message.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    actionType: { type: Type.STRING, description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp'" },
                    query: { type: Type.STRING, description: "The search query, website name, or message content." },
                    target: { type: Type.STRING, description: "The target phone number for WhatsApp, if applicable." }
                  },
                  required: ["actionType", "query"]
                }
              },
              {
                name: "scrapeWebpage",
                description: "Fetch and read the text content of a webpage given its URL. Use this to summarize articles, read news, or extract information from the internet.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING, description: "The explicit full URL of the webpage to scrape (e.g., https://en.wikipedia.org/wiki/India)." }
                  },
                  required: ["url"]
                }
              },
              {
                name: "saveSecondBrainNote",
                description: "Save a new note, thought, todo, idea, or fact to Boss's Second Brain memory pad. Call this whenever Boss asks you to remember, save, think about, or write down something.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING, description: "The content of the note or fact to remember." }
                  },
                  required: ["content"]
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log("Live API Connected");
            this.onStateChange("listening");
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent as any;

            // Handle Audio & Text from modelTurn
            const parts = serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  this.onStateChange("speaking");
                  this.playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  this.onMessage("token", part.text);
                }
              }
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle User Transcriptions from userTurn
            const userParts = serverContent?.userTurn?.parts;
            if (userParts) {
              for (const part of userParts) {
                if (part.text) {
                  this.onMessage("user", part.text);
                }
              }
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                if (call.name === "executeBrowserAction") {
                  const args = call.args as any;
                  let url = "";
                  if (args.actionType === "youtube") {
                    url = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "spotify") {
                    url = `https://open.spotify.com/search/${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "whatsapp") {
                    url = `https://web.whatsapp.com/send?phone=${args.target || ''}&text=${encodeURIComponent(args.query)}`;
                  } else {
                    let website = args.query.replace(/\s+/g, "");
                    if (!website.includes(".")) website += ".com";
                    url = `https://www.${website}`;
                  }
                  
                  this.onCommand(url);
                  
                  // Send tool response
                  this.sessionPromise?.then(session => {
                     session.sendToolResponse({
                       functionResponses: [{
                         name: call.name,
                         id: call.id,
                         response: { result: "Action executed successfully in the browser." }
                       }]
                     });
                  });
                } else if (call.name === "scrapeWebpage") {
                  const args = call.args as any;
                  const url = args.url;
                  
                  // Dispatch visual event for UI
                  try {
                     window.dispatchEvent(new CustomEvent("web_scrape_initiated", { detail: { url } }));
                  } catch(e) {}
                  
                  // Use allorigins to bypass CORS
                  fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.contents) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(data.contents, "text/html");
                        const unwanted = doc.querySelectorAll("script, style, nav, footer, iframe, noscript, svg");
                        unwanted.forEach(s => s.remove());
                        let text = doc.body?.textContent || "";
                        text = text.replace(/\s+/g, " ").trim().substring(0, 5000); // Limit context length 
                        
                        this.sessionPromise?.then(session => {
                          session.sendToolResponse({
                            functionResponses: [{
                              name: call.name,
                              id: call.id,
                              response: { result: `Scraped content (first 5000 chars): ${text}` }
                            }]
                          });
                        });
                      } else {
                        throw new Error("No contents in response");
                      }
                    })
                    .catch(e => {
                      this.sessionPromise?.then(session => {
                        session.sendToolResponse({
                          functionResponses: [{
                            name: call.name,
                            id: call.id,
                            response: { result: `Failed to scrape webpage: ${e.message}` }
                          }]
                        });
                      });
                    });
                } else if (call.name === "saveSecondBrainNote") {
                  const args = call.args as any;
                  const content = args.content;
                  
                  // Save note to LocalStorage
                  try {
                    const savedNotesJson = localStorage.getItem("openhuman_second_brain") || "[]";
                    const savedNotes = JSON.parse(savedNotesJson);
                    const newNote = {
                      id: Date.now().toString(),
                      content: content,
                      date: new Date().toLocaleString()
                    };
                    savedNotes.push(newNote);
                    localStorage.setItem("openhuman_second_brain", JSON.stringify(savedNotes));
                    
                    // Dispatch event so UI updates immediately
                    window.dispatchEvent(new CustomEvent("brain_note_added", { detail: newNote }));
                  } catch (e) {
                    console.error("Failed to save second brain note in tool:", e);
                  }

                  // Send tool response back to Gemini
                  this.sessionPromise?.then(session => {
                     session.sendToolResponse({
                       functionResponses: [{
                         name: call.name,
                         id: call.id,
                         response: { result: `Note saved successfully to Second Brain: '${content}'` }
                       }]
                     });
                  });
                }
              }
            }
          },
          onclose: () => {
            console.log("Live API Closed");
            this.stop();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            this.stop();
          }
        }
      });

    } catch (error) {
      console.error("Failed to start Live Session:", error);
      this.stop();
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(() => {});
      this.sessionPromise = null;
    }
    
    this.onStateChange("idle");
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }

  sendVideoFrame(base64Data: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({
          video: { data: base64Data, mimeType: "image/jpeg" }
        });
      }).catch(err => console.error("Error sending screen frame", err));
    }
  }
}
