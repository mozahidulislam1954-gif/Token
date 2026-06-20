export function resetTokenSession() {
  // Stateless connection reset is handled on the server or on the consumer
}

export async function getTokenResponse(prompt: string, history: { sender: "user" | "token", text: string }[] = []): Promise<string> {
  try {
    const response = await fetch("/api/gemini/response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, history }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.text || "Uff, mera dimaag kharab ho gaya hai. Try again later, Ashwani.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Ashwani.";
  }
}

export async function getTokenAudio(text: string): Promise<string | null> {
  try {
    const response = await fetch("/api/gemini/audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.audio;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
