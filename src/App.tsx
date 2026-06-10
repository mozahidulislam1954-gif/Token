import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Keyboard, Send, Trash2, Monitor, MonitorOff, Camera, CameraOff, MessageSquare, X, Brain, UserCircle, Sparkles } from "lucide-react";
import { getTokenResponse, getTokenAudio, resetTokenSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager, PERSONA_CONFIGS } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "token" | "system";
  text: string;
  timestamp?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ScreenPreviewProps {
  stream: MediaStream;
}

function ScreenPreview({ stream }: ScreenPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.play().catch((err) => {
        // Safe check for pause/play interruptions or browser navigation aborts
        if (err.name !== "AbortError") {
          console.error("Screen preview playback error:", err);
        }
      });
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-contain"
      muted
      autoPlay
      playsInline
    />
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("token_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("token_chat_history", JSON.stringify(messages));
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);



  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showBrain, setShowBrain] = useState(false);
  const [showPersonas, setShowPersonas] = useState(false);
  const [activePersona, setActivePersona] = useState(() => {
    return localStorage.getItem("openhuman_persona") || "token";
  });
  const [brainNotes, setBrainNotes] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("openhuman_second_brain") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleBrainUpdate = () => {
      try {
        setBrainNotes(JSON.parse(localStorage.getItem("openhuman_second_brain") || "[]"));
      } catch {}
    };
    const handleScrape = ((e: CustomEvent) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: `Scraping: ${e.detail.url}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;
    
    const handleMarketData = ((e: CustomEvent) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: `Fetching market data for: ${e.detail.ticker}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;

    const handleKronosAnalysis = ((e: CustomEvent) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: `Initializing Kronos TSFM analysis for: ${e.detail.ticker} (${e.detail.timeframe})`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;

    const handleWikiEvent = ((e: CustomEvent) => {
      let text = "";
      if (e.detail.type === "ingest") text = `Wiki Maintainer: Ingesting source '${e.detail.title}'`;
      else if (e.detail.type === "query") text = `Wiki Maintainer: Querying index for '${e.detail.title}'`;
      else if (e.detail.type === "lint") text = `Wiki Maintainer: Running health-check lint pass...`;
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: text,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;

    const handleAgentSkillEvent = ((e: CustomEvent) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: `Staff Engineer: Executing Agent Skill '${e.detail.skill}' on ${e.detail.target}...`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;
    
    const handleHermesTaskEvent = ((e: CustomEvent) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: `Hermes Agent: Dispatching '${e.detail.type}' background task: ${e.detail.concept}...`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;
    
    const handleGodmodeEvent = ((e: CustomEvent) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "system",
        text: `⚡ PLINY G0DM0D3: ${e.detail.action} -> ${e.detail.content}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }) as EventListener;
    
    window.addEventListener("brain_note_added", handleBrainUpdate as EventListener);
    window.addEventListener("web_scrape_initiated", handleScrape);
    window.addEventListener("market_data_fetched", handleMarketData);
    window.addEventListener("kronos_analysis_started", handleKronosAnalysis);
    window.addEventListener("wiki_event", handleWikiEvent);
    window.addEventListener("agent_skill_event", handleAgentSkillEvent);
    window.addEventListener("hermes_task_event", handleHermesTaskEvent);
    window.addEventListener("godmode_event", handleGodmodeEvent);
    return () => {
      window.removeEventListener("brain_note_added", handleBrainUpdate as EventListener);
      window.removeEventListener("web_scrape_initiated", handleScrape);
      window.removeEventListener("market_data_fetched", handleMarketData);
      window.removeEventListener("kronos_analysis_started", handleKronosAnalysis);
      window.removeEventListener("wiki_event", handleWikiEvent);
      window.removeEventListener("agent_skill_event", handleAgentSkillEvent);
      window.removeEventListener("hermes_task_event", handleHermesTaskEvent);
      window.removeEventListener("godmode_event", handleGodmodeEvent);
    };
  }, []);

  const changePersona = (key: string) => {
    setActivePersona(key);
    localStorage.setItem("openhuman_persona", key);
    setShowPersonas(false);
    if (isSessionActive && liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
        setIsSessionActive(false);
        setAppState("idle");
        setTimeout(() => {
           toggleListening();
        }, 500);
    }
  };

  const deleteNote = (id: string) => {
    const newNotes = brainNotes.filter(n => n.id !== id);
    setBrainNotes(newNotes);
    localStorage.setItem("openhuman_second_brain", JSON.stringify(newNotes));
  };

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenIntervalRef = useRef<any>(null);

  const [isCameraSharing, setIsCameraSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<any>(null);

  const stopCameraShare = useCallback(() => {
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraSharing(false);
  }, []);

  const startScreenShare = async () => {
    if (isCameraSharing) {
      stopCameraShare();
    }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== "function") {
      alert(
        "Boss, the browser is blocking screen sharing inside the preview window because of iframe security rules.\n\n" +
        "Please open the app in a new tab using the 'Open in new tab' button at the top-right of your screen, then screen sharing will work perfectly!"
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
          frameRate: { max: 5 }
        },
        audio: false
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      screenStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (err: any) {
      if (err?.message?.includes("Permission denied") || err?.name === 'NotAllowedError') {
        // User cancelled or permission denied
        return;
      }
      console.error("Error starting screen share", err);
      alert(
        "Boss, the browser is blocking screen sharing inside the preview window because of iframe security rules.\n\n" +
        "Please open the app in a new tab using the 'Open in new tab' button at the top-right of your screen, then screen sharing will work perfectly!"
      );
    }
  };

  const stopScreenShare = useCallback(() => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  const startCameraShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      alert(
        "Boss, camera access is not supported by your current browser or is blocked because the app is running in an iframe.\n\n" +
        "Please open the app in a new tab or check your browser/iframe permissions!"
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
          frameRate: { max: 5 }
        },
        audio: false
      });
      
      setCameraStream(stream);
      setIsCameraSharing(true);
      cameraStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopCameraShare();
        };
      }
    } catch (err: any) {
      if (err?.message?.includes("Permission denied") || err?.name === 'NotAllowedError') {
        // User cancelled or permission denied
        return;
      }
      console.error("Error starting camera share", err);
      alert(
        "Boss, please ensure you allow video/camera permissions in your browser. If you are inside the preview iframe, or blocked, please open the app in a new tab."
      );
    }
  };

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  useEffect(() => {
    if (isScreenSharing && isSessionActive && screenStream) {
      const videoElement = document.createElement("video");
      videoElement.srcObject = screenStream;
      videoElement.muted = true;
      videoElement.play().catch(err => console.error("Video play error in capture", err));

      const sendFrame = () => {
        if (!liveSessionRef.current || !isSessionActive) return;
        
        const canvas = document.createElement("canvas");
        const width = 480;
        const height = (videoElement.videoHeight / videoElement.videoWidth) * width || 360;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          const base64Data = dataUrl.split(",")[1];
          if (base64Data) {
            liveSessionRef.current.sendVideoFrame(base64Data);
          }
        }
      };

      const handleLoadedMetadata = () => {
        setTimeout(sendFrame, 1000);
      };
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

      const interval = setInterval(sendFrame, 2000);
      screenIntervalRef.current = interval;

      return () => {
        clearInterval(interval);
        screenIntervalRef.current = null;
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    } else {
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
        screenIntervalRef.current = null;
      }
    }
  }, [isScreenSharing, isSessionActive, screenStream]);

  useEffect(() => {
    if (isCameraSharing && isSessionActive && cameraStream) {
      const videoElement = document.createElement("video");
      videoElement.srcObject = cameraStream;
      videoElement.muted = true;
      videoElement.play().catch(err => console.error("Video play error in camera capture", err));

      const sendFrame = () => {
        if (!liveSessionRef.current || !isSessionActive) return;
        
        const canvas = document.createElement("canvas");
        const width = 480;
        const height = (videoElement.videoHeight / videoElement.videoWidth) * width || 360;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          const base64Data = dataUrl.split(",")[1];
          if (base64Data) {
            liveSessionRef.current.sendVideoFrame(base64Data);
          }
        }
      };

      const handleLoadedMetadata = () => {
        setTimeout(sendFrame, 1000);
      };
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

      const interval = setInterval(sendFrame, 2000);
      cameraIntervalRef.current = interval;

      return () => {
        clearInterval(interval);
        cameraIntervalRef.current = null;
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    } else {
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
        cameraIntervalRef.current = null;
      }
    }
  }, [isCameraSharing, isSessionActive, cameraStream]);

  useEffect(() => {
    return () => {
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Check for browser commands
    const commandResult = processCommand(finalTranscript);

    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "token", text: responseText }]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getTokenAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          window.open(commandResult.url, "_blank");
        }
      }, 1500);
    } else {
      // 2. General Chit-Chat via Gemini
      responseText = await getTokenResponse(finalTranscript, messagesRef.current);
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "token", text: responseText }]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getTokenAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetTokenSession();
      stopScreenShare();
      stopCameraShare();
    } else {
      try {
        setIsSessionActive(true);
        resetTokenSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          setMessages((prev) => {
            if (prev.length === 0) {
              return [{ id: Date.now().toString() + "-" + sender, sender, text }];
            }
            const lastMsg = prev[prev.length - 1];
            const isSameSender = lastMsg.sender === sender;
            const lastMsgTime = parseInt(lastMsg.id.split("-")[0]);
            const isRecent = Date.now() - lastMsgTime < 10000; // 10 seconds group window

            if (isSameSender && isRecent) {
              // Intelligently append spacing if needed, preventing duplicated chunks
              const cleanText = text.trim();
              if (lastMsg.text.endsWith(cleanText)) {
                return prev;
              }
              const lastTextEndsWithSpace = lastMsg.text.endsWith(" ");
              const currentTextStartsWithSpace = text.startsWith(" ");
              const joiner = (lastTextEndsWithSpace || currentTextStartsWithSpace) ? "" : " ";
              const updatedText = (lastMsg.text + joiner + text).replace(/\s+/g, " ");

              return [
                ...prev.slice(0, -1),
                { ...lastMsg, text: updatedText }
              ];
            } else {
              return [...prev, { id: Date.now().toString() + "-" + sender, sender, text }];
            }
          });
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        session.onError = (err) => {
          console.error("Live API Session Error:", err);
          alert("The Live Session API is currently unavailable or experienced an error. Please try again later.");
          setIsSessionActive(false);
          setAppState("idle");
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#050505] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0">
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-6 py-4 md:px-12 md:py-6">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-violet-500/15 border border-white/10 hover:border-violet-500/30 text-white/80 hover:text-white transition-all duration-300 shadow-md cursor-pointer pointer-events-auto"
            title="Open Conversation & Command History"
          >
            <MessageSquare size={16} className="text-violet-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase hidden md:inline">Logs</span>
          </button>

          <button
            onClick={() => setShowBrain(!showBrain)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-pink-500/15 border border-white/10 hover:border-pink-500/30 text-white/80 hover:text-white transition-all duration-300 shadow-md cursor-pointer pointer-events-auto"
            title="Open Second Brain Memory"
          >
            <Brain size={16} className="text-pink-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase hidden md:inline">Memory</span>
          </button>

          <button
            onClick={() => setShowPersonas(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white/80 hover:text-white transition-all duration-300 shadow-md cursor-pointer pointer-events-auto relative overflow-hidden group"
            title="Change AI Persona"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${PERSONA_CONFIGS[activePersona]?.accentColor} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <UserCircle size={16} className="text-cyan-400 relative z-10" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase hidden md:inline relative z-10">{PERSONA_CONFIGS[activePersona]?.label}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear the chat history?")) {
                  setMessages([]);
                  resetTokenSession();
                }
              }}
              className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10"
              title="Clear Chat History"
            >
              <Trash2 size={18} className="opacity-70" />
            </button>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={18} className="opacity-70" />
            ) : (
              <Volume2 size={18} className="opacity-70" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Visualizer & Chat */}
      <main className="absolute inset-0 flex flex-row items-center justify-between w-full h-full z-10 overflow-hidden pt-20 pb-24 px-4 md:px-12 pointer-events-none">
        
        {/* Left Column: Token Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-6 z-10 pl-2 lg:pl-0">
          {/* Status Indicator */}
          <div className="h-6">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 text-cyan-300/80 text-sm md:text-base italic font-serif"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Replying...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Visualizer (Fixed Full Screen Background) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} />
        </div>

        {/* Right Column: User Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6 flex justify-end">
            <AnimatePresence>
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-violet-300/80 text-sm md:text-base italic"
                >
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  Listening...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-6 md:pb-8 z-20 shrink-0 gap-4">
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-md flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-4 backdrop-blur-md shadow-2xl"
            >
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message to Token..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!textInput.trim()}
                className="p-2 rounded-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:hover:bg-violet-500 transition-colors"
              >
                <Send size={16} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-2xl
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span>End Session</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce" />
                <span>Start Session</span>
              </>
            )}
          </button>

          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`
              p-4 rounded-full transition-all duration-300 shadow-2xl border
              ${
                isScreenSharing
                  ? "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }
            `}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
          >
            {isScreenSharing ? (
              <MonitorOff size={20} />
            ) : (
              <Monitor size={20} />
            )}
          </button>

          <button
            onClick={isCameraSharing ? stopCameraShare : startCameraShare}
            className={`
              p-4 rounded-full transition-all duration-300 shadow-2xl border
              ${
                isCameraSharing
                  ? "bg-violet-500/20 text-violet-400 border-violet-500/40 hover:bg-violet-500/30"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }
            `}
            title={isCameraSharing ? "Stop Camera Sharing" : "Share Camera"}
          >
            {isCameraSharing ? (
              <CameraOff size={20} />
            ) : (
              <Camera size={20} />
            )}
          </button>
          
          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-2xl"
              title="Type instead"
            >
              <Keyboard size={20} className="opacity-70" />
            </button>
          )}
        </div>
      </footer>

      {/* Screen Sharing Live Preview Overlay */}
      <AnimatePresence>
        {isScreenSharing && screenStream && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="absolute bottom-28 right-4 md:right-12 w-64 h-40 bg-zinc-900/95 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-40 pointer-events-auto flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/80 border-b border-white/10 text-xs text-white/70 font-mono">
              <div className="flex items-center gap-1.5 font-bold text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>BOSS'S SCREEN</span>
              </div>
              <button 
                onClick={stopScreenShare}
                className="hover:text-red-400 font-bold transition-colors cursor-pointer"
                title="Stop Sharing"
              >
                Exit
              </button>
            </div>
            <div className="flex-1 bg-black relative flex items-center justify-center">
              <ScreenPreview stream={screenStream} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Sharing Live Preview Overlay */}
      <AnimatePresence>
        {isCameraSharing && cameraStream && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="absolute bottom-28 right-4 md:right-12 w-64 h-40 bg-zinc-900/95 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-40 pointer-events-auto flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/80 border-b border-white/10 text-xs text-white/70 font-mono">
              <div className="flex items-center gap-1.5 font-bold text-violet-400">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span>BOSS'S CAMERA</span>
              </div>
              <button 
                onClick={stopCameraShare}
                className="hover:text-red-400 font-bold transition-colors cursor-pointer"
                title="Stop Camera"
              >
                Exit
              </button>
            </div>
            <div className="flex-1 bg-black relative flex items-center justify-center">
              <ScreenPreview stream={cameraStream} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persona Selection Modal */}
      <AnimatePresence>
        {showPersonas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto"
            onClick={() => setShowPersonas(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <UserCircle size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-wide">AI Personas</h2>
                    <p className="text-xs font-mono text-zinc-400">SELECT YOUR COMPANION</p>
                  </div>
                </div>
                <button onClick={() => setShowPersonas(false)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 bg-gradient-to-br from-zinc-950 to-black overflow-y-auto">
                {Object.entries(PERSONA_CONFIGS).map(([key, config]) => {
                  const isActive = activePersona === key;
                  return (
                    <button
                      key={key}
                      onClick={() => changePersona(key)}
                      className={`relative flex flex-col text-left p-4 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer group hover:scale-[1.02] ${
                        isActive 
                          ? "border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white/10" 
                          : "border-white/10 hover:border-white/30 bg-zinc-900/50 hover:bg-zinc-800/80"
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.accentColor} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                      {isActive && (
                        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${config.accentColor} rounded-full blur-[30px] opacity-20`}></div>
                      )}
                      
                      <div className="relative z-10 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className={isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"} />
                          <h3 className={`text-base font-bold tracking-wide ${isActive ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>{config.label}</h3>
                        </div>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">Active</span>
                        )}
                      </div>
                      <p className={`relative z-10 text-sm leading-relaxed ${isActive ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                        {config.description}
                      </p>
                      <div className="relative z-10 mt-4 flex items-center gap-1.5 text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest">
                        <Volume2 size={12} /> Voice: {config.voiceName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding Second Brain Drawer */}
      <AnimatePresence>
        {showBrain && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrain(false)}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute top-0 right-0 h-full w-[85vw] sm:w-[420px] bg-[#0c0c0e]/95 border-l border-white/10 z-50 shadow-2xl flex flex-col pointer-events-auto backdrop-blur-xl"
            >
              {/* Drawer Title header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <Brain size={16} className="text-pink-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-mono font-bold tracking-wider text-white uppercase">Second Brain</span>
                    <span className="text-[10px] font-mono text-zinc-500 font-medium">YOUR AI MEMORY CORE</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowBrain(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Dynamic scrollable notes logs */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 scrollbar-none">
                {brainNotes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 self-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                      <Brain size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-zinc-300 font-bold uppercase">Memory Empty</p>
                      <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                        Say "Save a note" or "Remember that..." to the AI to add concepts, ideas, rules, or facts here.
                      </p>
                    </div>
                  </div>
                ) : (
                  brainNotes.map((note) => (
                    <div
                      key={note.id}
                      className="group relative flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{note.date}</span>
                        <button 
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sliding Conversation Deck Drawer */}
      <AnimatePresence>
        {showChatHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatHistory(false)}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm pointer-events-auto sm:hidden"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "-100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute top-0 left-0 h-full w-[85vw] sm:w-[480px] bg-[#0c0c0e]/95 border-r border-white/10 z-50 shadow-2xl flex flex-col pointer-events-auto backdrop-blur-xl"
            >
              {/* Drawer Title header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <MessageSquare size={16} className="text-violet-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-mono font-bold tracking-wider text-white uppercase">Conversation Deck</span>
                    <span className="text-[10px] font-mono text-zinc-500 font-medium">REAL-TIME INTERACTION STREAM</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to clear the entire chat history?")) {
                          setMessages([]);
                          resetTokenSession();
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all font-mono text-[10px] tracking-wider uppercase cursor-pointer mr-1"
                      title="Clear History"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowChatHistory(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Dynamic scrollable message logs */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scrollbar-none">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 self-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 animate-pulse">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-zinc-300 font-bold">DECK EMPTY</p>
                      <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                        Start a voice session or write a command to view real-time prompt logs and builds here!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isUser = msg.sender === "user";
                    const isSystem = msg.sender === "system";
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id || index} className="w-full flex justify-center my-2">
                          <div className="bg-black/40 border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase">
                              {msg.text}
                            </span>
                            {msg.timestamp && <span className="text-[9px] text-emerald-500/60 font-mono ml-2">{msg.timestamp}</span>}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
                      >
                        {/* Sender Label */}
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${isUser ? "text-violet-400" : "text-cyan-400"}`}>
                          {isUser ? "◆ BOSS (USER)" : `◇ ${PERSONA_CONFIGS[activePersona]?.label.toUpperCase() || 'AI'}`}
                        </span>
                        
                        {/* Bubble Style container */}
                        <div
                          className={`max-w-[90%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-sans
                            ${
                              isUser
                                ? "bg-violet-600/10 border border-violet-500/30 text-violet-100 rounded-tr-sm"
                                : "bg-white/5 border border-white/10 text-zinc-100 rounded-tl-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                            }
                          `}
                        >
                          <div className="whitespace-pre-wrap select-text">{msg.text}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Console Live session status footing */}
              <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                  <span>{isSessionActive ? "SESSION COMPILING STREAM" : "STATE IDLE"}</span>
                </div>
                <span>{messages.length} LOGS REGISTERED</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
