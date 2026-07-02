import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
  Keyboard,
  Send,
  Trash2,
  Monitor,
  MonitorOff,
  Camera,
  CameraOff,
  MessageSquare,
  X,
  Brain,
  UserCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  getTokenResponse,
  getTokenAudio,
  resetTokenSession,
} from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager, PERSONA_CONFIGS } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "framer-motion";

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
        setBrainNotes(
          JSON.parse(localStorage.getItem("openhuman_second_brain") || "[]"),
        );
      } catch {}
    };
    const handleScrape = ((e: CustomEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: `Scraping: ${e.detail.url}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    const handleMarketData = ((e: CustomEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: `Fetching market data for: ${e.detail.ticker}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    const handleKronosAnalysis = ((e: CustomEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: `Initializing Kronos TSFM analysis for: ${e.detail.ticker} (${e.detail.timeframe})`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    const handleWikiEvent = ((e: CustomEvent) => {
      let text = "";
      if (e.detail.type === "ingest")
        text = `Wiki Maintainer: Ingesting source '${e.detail.title}'`;
      else if (e.detail.type === "query")
        text = `Wiki Maintainer: Querying index for '${e.detail.title}'`;
      else if (e.detail.type === "lint")
        text = `Wiki Maintainer: Running health-check lint pass...`;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    const handleAgentSkillEvent = ((e: CustomEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: `Staff Engineer: Executing Agent Skill '${e.detail.skill}' on ${e.detail.target}...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    const handleHermesTaskEvent = ((e: CustomEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: `Hermes Agent: Dispatching '${e.detail.type}' background task: ${e.detail.concept}...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    const handleGodmodeEvent = ((e: CustomEvent) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "system",
          text: `⚡ PLINY G0DM0D3: ${e.detail.action} -> ${e.detail.content}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }) as EventListener;

    window.addEventListener(
      "brain_note_added",
      handleBrainUpdate as EventListener,
    );
    window.addEventListener("web_scrape_initiated", handleScrape);
    window.addEventListener("market_data_fetched", handleMarketData);
    window.addEventListener("kronos_analysis_started", handleKronosAnalysis);
    window.addEventListener("wiki_event", handleWikiEvent);
    window.addEventListener("agent_skill_event", handleAgentSkillEvent);
    window.addEventListener("hermes_task_event", handleHermesTaskEvent);
    window.addEventListener("godmode_event", handleGodmodeEvent);
    return () => {
      window.removeEventListener(
        "brain_note_added",
        handleBrainUpdate as EventListener,
      );
      window.removeEventListener("web_scrape_initiated", handleScrape);
      window.removeEventListener("market_data_fetched", handleMarketData);
      window.removeEventListener(
        "kronos_analysis_started",
        handleKronosAnalysis,
      );
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
    const newNotes = brainNotes.filter((n) => n.id !== id);
    setBrainNotes(newNotes);
    localStorage.setItem("openhuman_second_brain", JSON.stringify(newNotes));
  };

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string } | null>(null);

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
  };

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
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);
    setIsCameraSharing(false);
  }, []);

  const startScreenShare = async () => {
    if (isCameraSharing) {
      stopCameraShare();
    }
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== "function"
    ) {
      showAlert(
        "Screen Sharing Blocked",
        "Boss, the browser is blocking screen sharing inside the preview window because of iframe security rules.\n\nPlease open the app in a new tab using the 'Open in new tab' button at the top-right of your screen, then screen sharing will work perfectly!"
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
          frameRate: { max: 5 },
        },
        audio: false,
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
      if (
        err?.message?.includes("Permission denied") ||
        err?.name === "NotAllowedError"
      ) {
        // User cancelled or permission denied
        return;
      }
      console.error("Error starting screen share", err);
      showAlert(
        "Screen Sharing Error",
        "Boss, the browser is blocking screen sharing inside the preview window because of iframe security rules.\n\nPlease open the app in a new tab using the 'Open in new tab' button at the top-right of your screen, then screen sharing will work perfectly!"
      );
    }
  };

  const stopScreenShare = useCallback(() => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  const startCameraShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    }
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      showAlert(
        "Camera Blocked",
        "Boss, camera access is not supported by your current browser or is blocked because the app is running in an iframe.\n\nPlease open the app in a new tab or check your browser/iframe permissions!"
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
          frameRate: { max: 5 },
        },
        audio: false,
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
      if (
        err?.message?.includes("Permission denied") ||
        err?.name === "NotAllowedError"
      ) {
        // User cancelled or permission denied
        return;
      }
      console.error("Error starting camera share", err);
      showAlert(
        "Camera Permission Error",
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
      videoElement
        .play()
        .catch((err) => console.error("Video play error in capture", err));

      const sendFrame = () => {
        if (!liveSessionRef.current || !isSessionActive) return;

        const canvas = document.createElement("canvas");
        const width = 480;
        const height =
          (videoElement.videoHeight / videoElement.videoWidth) * width || 360;
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
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
        );
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
      videoElement
        .play()
        .catch((err) =>
          console.error("Video play error in camera capture", err),
        );

      const sendFrame = () => {
        if (!liveSessionRef.current || !isSessionActive) return;

        const canvas = document.createElement("canvas");
        const width = 480;
        const height =
          (videoElement.videoHeight / videoElement.videoWidth) * width || 360;
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
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
        );
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
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleTextCommand = useCallback(
    async (finalTranscript: string) => {
      if (!finalTranscript.trim()) {
        setAppState("idle");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: finalTranscript },
      ]);

      // If live session is active, send text through it
      if (isSessionActive && liveSessionRef.current) {
        liveSessionRef.current.sendText(finalTranscript);
        return;
      }

      setAppState("processing");

      try {
        // 1. Check for browser commands
        const commandResult = processCommand(finalTranscript);

        let responseText = "";

        if (commandResult.isBrowserAction) {
          responseText = commandResult.action;
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "-z",
              sender: "token",
              text: responseText,
            },
          ]);

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
          responseText = await getTokenResponse(
            finalTranscript,
            messagesRef.current,
          );
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "-z",
              sender: "token",
              text: responseText,
            },
          ]);

          if (!isMuted) {
            setAppState("speaking");
            const audioBase64 = await getTokenAudio(responseText);
            if (audioBase64) {
              await playPCM(audioBase64);
            }
          }
          setAppState("idle");
        }
      } catch (err) {
        console.error("Error processing text command:", err);
        setAppState("idle");
      }
    },
    [isMuted, isSessionActive],
  );

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
              return [
                { id: Date.now().toString() + "-" + sender, sender, text },
              ];
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
              const joiner =
                lastTextEndsWithSpace || currentTextStartsWithSpace ? "" : " ";
              const updatedText = (lastMsg.text + joiner + text).replace(
                /\s+/g,
                " ",
              );

              return [...prev.slice(0, -1), { ...lastMsg, text: updatedText }];
            } else {
              return [
                ...prev,
                { id: Date.now().toString() + "-" + sender, sender, text },
              ];
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
          showAlert(
            "Live Session Error",
            "The Live Session API is currently unavailable or experienced an error. Please try again later."
          );
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
    <div className="h-[100dvh] w-screen text-slate-100 flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0">
      {showPermissionModal && (
        <PermissionModal onClose={() => setShowPermissionModal(false)} />
      )}

      {alertConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md nm-card rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden text-white"
          >
            <h2 className="text-2xl font-bold text-white mb-4">{alertConfig.title}</h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed font-semibold whitespace-pre-line text-center">
              {alertConfig.message}
            </p>
            <button 
              onClick={() => setAlertConfig(null)}
              className="w-full py-3.5 px-4 nm-btn text-cyan-400 font-extrabold rounded-2xl hover:scale-[1.01] transition-all cursor-pointer text-sm hover:text-cyan-300"
            >
              Okay, Boss
            </button>
          </motion.div>
        </div>
      )}

      {/* Immersive Floating Spatial Environment Lights */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-cyan-500/10 blur-[130px] rounded-full spatial-glow-1" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[65%] h-[65%] bg-indigo-500/10 blur-[150px] rounded-full spatial-glow-2" />
        <div className="absolute top-[30%] left-[40%] w-[50%] h-[50%] bg-fuchsia-500/8 blur-[140px] rounded-full spatial-glow-3" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-25 shrink-0 px-6 py-4 md:px-12 md:py-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-300 hover:text-violet-400 transition-all duration-200 nm-btn-sm cursor-pointer pointer-events-auto font-medium"
            title="Open Conversation & Command History"
          >
            <MessageSquare size={15} className="text-violet-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase hidden md:inline">
              Logs
            </span>
          </button>

          <button
            onClick={() => setShowBrain(!showBrain)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-300 hover:text-pink-400 transition-all duration-200 nm-btn-sm cursor-pointer pointer-events-auto font-medium"
            title="Open Second Brain Memory"
          >
            <Brain size={15} className="text-pink-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase hidden md:inline">
              Memory
            </span>
          </button>

          <button
            onClick={() => setShowPersonas(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-300 hover:text-cyan-400 transition-all duration-200 nm-btn-sm cursor-pointer pointer-events-auto relative overflow-hidden group font-medium"
            title="Change AI Persona"
          >
            <UserCircle size={15} className="text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase hidden md:inline">
              {PERSONA_CONFIGS[activePersona]?.label}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm("Are you sure you want to clear the chat history?")
                ) {
                  setMessages([]);
                  resetTokenSession();
                }
              }}
              className="p-2.5 rounded-full text-slate-400 hover:text-red-400 transition-colors nm-btn-sm cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-full transition-colors nm-btn-sm cursor-pointer ${isMuted ? "text-red-400" : "text-slate-400 hover:text-white"}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} />
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Visualizer & Chat */}
      <main className="absolute inset-0 flex flex-col items-center justify-center w-full h-full z-10 overflow-hidden pointer-events-none">
        {/* Center Visualizer (Fixed Full Screen Background) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} activePersona={activePersona} />
        </div>

        {/* Status Messages Positioned in the Top-Right */}
        <div className="absolute top-24 right-6 md:right-12 flex flex-col items-end justify-center z-10">
          <div className="h-8 flex justify-end items-center">
            <AnimatePresence mode="wait">
              {appState === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex items-center gap-2.5 text-sky-300 text-sm md:text-base font-semibold nm-inset-card px-5 py-2 rounded-full shadow-inner tracking-wide"
                >
                  <Loader2 size={16} className="animate-spin text-sky-400" />
                  Replying...
                </motion.div>
              )}
              {appState === "listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-2.5 text-purple-300 text-sm md:text-base font-semibold nm-inset-card px-5 py-2 rounded-full shadow-inner tracking-wide"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
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
              className="w-full max-w-md flex items-center gap-2.5 nm-inset-card rounded-full p-2 pl-5"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message to Token..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-400 font-medium text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="p-2.5 rounded-full bg-violet-600 text-white disabled:opacity-50 hover:bg-violet-500 transition-colors nm-btn shrink-0 hover:shadow-[0_0_12px_rgba(139,92,246,0.5)]"
              >
                <Send size={15} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold tracking-wide transition-all duration-300
              ${
                isSessionActive
                  ? "nm-inset-card text-rose-400 scale-98 hover:text-rose-300 shadow-inner"
                  : "nm-btn text-cyan-400 font-bold hover:scale-[1.03] hover:text-cyan-300"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={18} />
                <span>End Session</span>
              </>
            ) : (
              <>
                <Mic size={18} className="group-hover:animate-bounce" />
                <span>Start Session</span>
              </>
            )}
          </button>

          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`
              p-4 rounded-full transition-all duration-300 nm-btn
              ${
                isScreenSharing
                  ? "nm-inset-card text-emerald-400 !shadow-inner scale-95 hover:text-emerald-300 shadow-inner"
                  : "text-slate-300 hover:text-white hover:scale-[1.03]"
              }
            `}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
          >
            {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          </button>

          <button
            onClick={isCameraSharing ? stopCameraShare : startCameraShare}
            className={`
              p-4 rounded-full transition-all duration-300 nm-btn
              ${
                isCameraSharing
                  ? "nm-inset-card text-violet-400 !shadow-inner scale-95 hover:text-violet-300 shadow-inner"
                  : "text-slate-300 hover:text-white hover:scale-[1.03]"
              }
            `}
            title={isCameraSharing ? "Stop Camera Sharing" : "Share Camera"}
          >
            {isCameraSharing ? <CameraOff size={18} /> : <Camera size={18} />}
          </button>

          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className={`p-4 rounded-full transition-all duration-300 nm-btn ${
                showTextInput ? "nm-inset-card text-violet-400 scale-95 hover:text-violet-300 shadow-inner" : "text-slate-300 hover:text-white hover:scale-[1.03]"
              }`}
              title="Type instead"
            >
              <Keyboard size={18} />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md pointer-events-auto"
            onClick={() => setShowPersonas(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl nm-card rounded-3xl overflow-hidden flex flex-col max-h-[90vh] text-white"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl nm-inset-card">
                    <UserCircle size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-wide text-white">
                      AI Personas
                    </h2>
                    <p className="text-[10px] font-mono text-slate-400 font-bold tracking-wider uppercase">
                      SELECT YOUR COMPANION
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPersonas(false)}
                  className="p-2.5 rounded-full nm-btn-sm text-slate-400 hover:text-white shrink-0 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 sm:p-6 grid gap-5 grid-cols-1 sm:grid-cols-2 bg-transparent overflow-y-auto">
                {Object.entries(PERSONA_CONFIGS).map(([key, config]) => {
                  const isActive = activePersona === key;
                  return (
                    <button
                      key={key}
                      onClick={() => changePersona(key)}
                      className={`relative flex flex-col text-left p-5 rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer group ${
                        isActive
                          ? "nm-inset-card scale-[0.98]"
                          : "nm-btn hover:scale-[1.02]"
                      }`}
                    >
                      <div className="relative z-10 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles
                            size={14}
                            className={
                              isActive
                                ? "text-cyan-400 animate-pulse"
                                : "text-slate-400 group-hover:text-slate-200"
                            }
                          />
                          <h3
                            className={`text-base font-bold tracking-wide ${isActive ? "text-white font-extrabold text-shadow-sm" : "text-slate-300"}`}
                          >
                            {config.label}
                          </h3>
                        </div>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full nm-inset-card text-emerald-400 bg-emerald-950/10">
                            Active
                          </span>
                        )}
                      </div>
                      <p
                        className={`relative z-10 text-xs leading-relaxed ${isActive ? "text-slate-200 font-medium" : "text-slate-400"}`}
                      >
                        {config.description}
                      </p>
                      <div className="relative z-10 mt-4 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                        <Volume2 size={12} className={isActive ? "text-emerald-400" : "text-slate-400"} /> Voice: {config.voiceName}
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
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBrain(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto z-40"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute top-0 right-0 h-full w-[85vw] sm:w-[420px] nm-card border-l border-white/10 z-50 shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Drawer Title header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl nm-inset-card">
                    <Brain size={16} className="text-pink-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white uppercase tracking-wide">
                      Second Brain
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold tracking-widest leading-none mt-0.5">
                      YOUR AI MEMORY CORE
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowBrain(false)}
                  className="p-2 rounded-full nm-btn-sm text-slate-400 hover:text-white shrink-0 cursor-pointer"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Dynamic scrollable notes logs */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scrollbar-none">
                {brainNotes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 self-center gap-4">
                    <div className="w-16 h-16 rounded-full nm-inset-card flex items-center justify-center text-slate-400">
                      <Brain size={24} className="animate-pulse text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-white font-bold uppercase tracking-wider">
                        Memory Empty
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                        Say "Save a note" or "Remember that..." to the AI to add
                        concepts, ideas, rules, or facts here.
                      </p>
                    </div>
                  </div>
                ) : (
                  brainNotes.map((note) => (
                    <div
                      key={note.id}
                      className="group relative flex flex-col gap-2.5 p-5 rounded-2xl nm-flat hover:-translate-y-0.5 transition-all duration-200 text-white"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest">
                          {note.date}
                        </span>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full nm-btn-sm text-slate-400 hover:text-red-400 cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-semibold whitespace-pre-wrap">
                        {note.content}
                      </p>
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
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatHistory(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto z-40"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "-100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="absolute top-0 left-0 h-full w-[85vw] sm:w-[480px] nm-card border-r border-white/10 z-50 shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Drawer Title header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl nm-inset-card">
                    <MessageSquare size={16} className="text-violet-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white uppercase tracking-wide">
                      Conversation Deck
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold tracking-widest leading-none mt-0.5">
                      REAL-TIME INTERACTION STREAM
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {messages.length > 0 && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear the entire chat history?",
                          )
                        ) {
                          setMessages([]);
                          resetTokenSession();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl nm-btn-sm text-[9px] font-mono font-bold uppercase text-slate-400 hover:text-red-400 cursor-pointer mr-1"
                      title="Clear History"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowChatHistory(false)}
                    className="p-2 rounded-full nm-btn-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Dynamic scrollable message logs */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 scrollbar-none">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 self-center gap-4">
                    <div className="w-16 h-16 rounded-full nm-inset-card flex items-center justify-center text-slate-400">
                      <MessageSquare size={24} className="text-slate-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-white font-bold uppercase tracking-wider">
                        DECK EMPTY
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                        Start a voice session or write a command to view
                        real-time prompt logs and builds here!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isUser = msg.sender === "user";
                    const isSystem = msg.sender === "system";

                    if (isSystem) {
                      return (
                        <div
                          key={msg.id || index}
                          className="w-full flex justify-center my-1.5"
                        >
                          <div className="nm-inset-card px-4 py-2 rounded-full flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse"></span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase">
                              {msg.text}
                            </span>
                            {msg.timestamp && (
                              <span className="text-[9px] text-slate-400 font-mono ml-2">
                                {msg.timestamp}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
                      >
                        {/* Sender Label */}
                        <span
                          className={`text-[9px] font-mono font-bold tracking-widest uppercase ${isUser ? "text-violet-400" : "text-cyan-400"}`}
                        >
                          {isUser
                            ? "◆ BOSS (USER)"
                            : `◇ ${PERSONA_CONFIGS[activePersona]?.label.toUpperCase() || "AI"}`}
                        </span>

                        {/* Bubble Style container */}
                        <div
                          className={`max-w-[85%] px-4.5 py-3.5 rounded-2xl text-xs leading-relaxed font-semibold
                            ${
                              isUser
                                ? "bg-violet-600/20 text-violet-200 border border-violet-500/20 rounded-tr-sm"
                                : "nm-inset-card text-slate-200 rounded-tl-sm"
                            }
                          `}
                        >
                          <div className="whitespace-pre-wrap select-text">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Console Live session status footing */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`}
                  />
                  <span>
                    {isSessionActive
                      ? "SESSION COMPILING STREAM"
                      : "STATE IDLE"}
                  </span>
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
