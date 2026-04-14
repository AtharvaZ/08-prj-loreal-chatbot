/* =============================================
   L'Oréal Smart Beauty Advisor — script.js
   ============================================= */

// Replace with your deployed Cloudflare Worker URL
const WORKER_URL = "https://loreal-chatbot.atharvazaveri4.workers.dev/";

/* —— DOM refs —— */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const sendBtn = document.getElementById("sendBtn");

/* —— Conversation history (multi-turn context) —— */
const conversationHistory = [
  {
    role: "system",
    content: `You are a warm, knowledgeable L'Oréal Beauty Advisor. Your role is to help customers with:
- L'Oréal product recommendations and information (skincare, makeup, haircare, fragrance)
- Skincare routines tailored to different skin types and concerns
- Makeup tutorials, application tips, and color matching
- Haircare advice including hair color, treatments, and styling
- Beauty ingredient information related to L'Oréal formulas
- General beauty and self-care guidance aligned with L'Oréal's brand values

IMPORTANT RULES:
1. Only answer questions related to L'Oréal products, beauty routines, skincare, makeup, haircare, fragrance, or closely related personal care topics.
2. If asked about anything unrelated (e.g., politics, coding, sports, news), respond warmly but firmly: "I specialize in L'Oréal beauty and skincare topics. I'd love to help you with product recommendations, routines, or beauty tips instead — what can I assist you with?"
3. Remember details the user shares (name, skin type, hair type, concerns, preferences) and reference them naturally in follow-up responses.
4. Keep responses concise, friendly, and encouraging. Use L'Oréal's empowering tone.
5. Recommend specific L'Oréal product lines when relevant (e.g., Revitalift, EverPure, True Match, Infallible).`,
  },
];

/* —— Helper: append a message bubble —— */
function appendMessage(role, text) {
  const isUser = role === "user";

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", isUser ? "user" : "ai");

  // Avatar
  const avatar = document.createElement("div");
  avatar.classList.add("avatar", isUser ? "user-avatar" : "ai-avatar");
  if (isUser) {
    avatar.textContent = "You";
    avatar.style.fontSize = "0.6rem";
    avatar.style.fontWeight = "700";
  } else {
    avatar.innerHTML = '<span class="material-icons">auto_awesome</span>';
  }

  // Bubble
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.textContent = text;

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* —— Helper: typing indicator —— */
function addTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("msg", "ai", "typing-indicator");
  typingDiv.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.classList.add("avatar", "ai-avatar");
  avatar.innerHTML = '<span class="material-icons">auto_awesome</span>';

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.innerHTML = "<span></span><span></span><span></span>";

  typingDiv.appendChild(avatar);
  typingDiv.appendChild(bubble);
  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return typingDiv;
}

/* —— Helper: toggle loading state —— */
function setLoading(loading) {
  sendBtn.disabled = loading;
  userInput.disabled = loading;

  if (loading) {
    sendBtn.innerHTML =
      '<span class="material-icons spinning" aria-hidden="true">autorenew</span>';
  } else {
    sendBtn.innerHTML =
      '<span class="material-icons" aria-hidden="true">send</span>' +
      '<span class="visually-hidden">Send</span>';
  }
}

/* —— Submit handler —— */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  // Show latest question above chat window
  latestQuestion.textContent = message;
  latestQuestion.classList.add("has-question");

  // Render user bubble
  appendMessage("user", message);

  // Track in history
  conversationHistory.push({ role: "user", content: message });

  // Clear input
  userInput.value = "";
  userInput.focus();

  setLoading(true);
  const typingEl = addTypingIndicator();

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Worker response:", JSON.stringify(data));

    if (!data.choices || !data.choices[0]) {
      throw new Error(data.error?.message || JSON.stringify(data));
    }

    const reply = data.choices[0].message.content;

    // Remove typing indicator
    typingEl.remove();

    // Track in history
    conversationHistory.push({ role: "assistant", content: reply });

    // Render AI bubble
    appendMessage("assistant", reply);
  } catch (err) {
    typingEl.remove();
    appendMessage(
      "assistant",
      "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment!",
    );
    console.error("Chat error:", err);
  } finally {
    setLoading(false);
  }
});
