import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, RotateCcw } from "lucide-react";

// ─── Flow definitions ────────────────────────────────────────────────────────

const FLOWS = {
  foundItem: [
    "📦 Here's the step-by-step flow for reporting a Found Item:",
    "1️⃣  Go to the Found Items page from the navigation menu.",
    "2️⃣  Click the 'Report Found Item' button.",
    "3️⃣  Fill in the item title, category, location where you found it, and the date.",
    "4️⃣  Add a brief description (keep it vague to protect privacy).",
    "5️⃣  Upload a photo of the item if you have one.",
    "6️⃣  Enter your name and email so the owner can contact you.",
    "7️⃣  Submit the form — the item will be listed as 'Claimable' immediately.",
    "✅  Done! The rightful owner can now find and claim the item.",
  ],
  lostItem: [
    "🔍 Here's the step-by-step flow for finding a Lost Item:",
    "1️⃣  Go to the Found Items page from the navigation menu.",
    "2️⃣  Browse the list or use the search bar to look for your item.",
    "3️⃣  Filter by category or status to narrow down results.",
    "4️⃣  Click 'View Details' on an item that looks like yours.",
    "5️⃣  If it matches, click 'Claim This Item'.",
    "6️⃣  Fill in your name, email, phone, and a detailed description proving ownership.",
    "7️⃣  Optionally upload a proof image (e.g. a photo of you with the item).",
    "8️⃣  Submit your claim — the finder will review it.",
    "9️⃣  If approved, the item status changes to 'Returned' and you'll be contacted.",
    "✅  Done! Stay in touch with the finder via the contact details provided.",
  ],
  claimProcess: [
    "📋 Here's how the Claim Process works:",
    "1️⃣  A finder reports an item — it becomes 'Claimable'.",
    "2️⃣  You (the owner) submit a claim with proof of ownership.",
    "3️⃣  The finder reviews all submitted claims.",
    "4️⃣  The finder approves the correct claim — all others are rejected.",
    "5️⃣  The item status changes to 'Returned'.",
    "6️⃣  You contact the finder using the details on the item page to collect it.",
    "✅  The system ensures only verified owners receive their items.",
  ],
  aboutUs: [
    "ℹ️  About Back2U:",
    "Back2U is a campus-based Lost & Found platform built for university students.",
    "🎯  Our mission: make sure nothing stays lost for long.",
    "👥  Built by students, for students — community-driven and trust-based.",
    "🔒  All accounts are verified student accounts for accountability.",
    "🏆  Students earn points for helping return lost items.",
    "📍  Covers all campus buildings and common areas.",
    "✅  Back2U connects finders and owners quickly and securely.",
  ],
  contactUs: [
    "📞 Contact & Support:",
    "📧  Email: support@back2u.lk",
    "🏫  Campus Office: Faculty of Computing, Block A",
    "🕐  Office Hours: Monday – Friday, 8:00 AM – 5:00 PM",
    "💬  You can also reach us through the campus student portal.",
    "🚨  For urgent lost item emergencies, contact campus security directly.",
    "✅  We typically respond within 24 hours.",
  ],
};

const MAIN_MENU_OPTIONS = [
  { label: "📦 Report a Found Item", key: "foundItem" },
  { label: "🔍 Find a Lost Item", key: "lostItem" },
  { label: "📋 Claim Process", key: "claimProcess" },
  { label: "ℹ️ About Us", key: "aboutUs" },
  { label: "📞 Contact Us", key: "contactUs" },
];

const botMsg = (text, options = null) => ({
  from: "bot", text, options, id: Date.now() + Math.random(),
});
const userMsg = (text) => ({
  from: "user", text, options: null, id: Date.now() + Math.random(),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("greeting");
  const [userName, setUserName] = useState("");
  const [activeFlow, setActiveFlow] = useState(null);
  const bottomRef = useRef(null);

  const push = (msg) => setMessages((prev) => [...prev, msg]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Greet on first open
  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;
    const t1 = setTimeout(() => {
      push(botMsg("👋 Hi there! I'm the Back2U assistant. I'm here to guide you through the system."));
      const t2 = setTimeout(() => {
        push(botMsg("What's your name?"));
        setStage("greeting");
      }, 700);
      return () => clearTimeout(t2);
    }, 300);
    return () => clearTimeout(t1);
  }, [open, messages.length]);

  const showMainMenu = (name) => {
    const n = name || userName;
    push(botMsg(`Great to meet you, ${n}! 😊 How can I help you today?`, MAIN_MENU_OPTIONS));
    setStage("menu");
  };

  const handleOption = (key) => {
    push(userMsg(MAIN_MENU_OPTIONS.find((o) => o.key === key)?.label || key));
    setActiveFlow(key);
    setTimeout(() => {
      push(botMsg("Would you like me to walk you through the step-by-step process?", [
        { label: "✅ Yes, show me", key: "yes" },
        { label: "🔙 Back to menu", key: "no" },
      ]));
      setStage("flow_confirm");
    }, 300);
  };

  const handleFlowConfirm = (answer) => {
    push(userMsg(answer === "yes" ? "✅ Yes, show me" : "🔙 Back to menu"));
    if (answer === "no") {
      setTimeout(() => showMainMenu(), 300);
      return;
    }
    const steps = FLOWS[activeFlow];
    setStage("flowing");

    // About Us & Contact Us — show all lines together in one message
    const staticFlows = ["aboutUs", "contactUs"];
    if (staticFlows.includes(activeFlow)) {
      setTimeout(() => {
        push(botMsg(steps.join("\n"), [
          { label: "🔙 Back to menu", key: "menu" },
          { label: "🔄 Restart chat", key: "restart" },
        ]));
        setStage("done");
      }, 400);
      return;
    }

    // Step-by-step for process flows
    let delay = 400;
    steps.forEach((step, i) => {
      setTimeout(() => {
        const isLast = i === steps.length - 1;
        push(botMsg(step, isLast ? [
          { label: "🔙 Back to menu", key: "menu" },
          { label: "🔄 Restart chat", key: "restart" },
        ] : null));
        if (isLast) setStage("done");
      }, delay);
      delay += 550;
    });
  };

  const handleButtonClick = (key) => {
    if (stage === "menu") {
      handleOption(key);
    } else if (stage === "flow_confirm") {
      handleFlowConfirm(key);
    } else if (stage === "done") {
      if (key === "menu") setTimeout(() => showMainMenu(), 300);
      else if (key === "restart") handleRestart();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    // Only allow free text during greeting (name entry)
    if (stage === "greeting") {
      push(userMsg(text));
      setUserName(text);
      setTimeout(() => showMainMenu(text), 300);
      return;
    }

    // All other stages — block free text, redirect to buttons
    push(userMsg(text));
    setTimeout(() => {
      push(botMsg(
        "⚠️ I can only help with Back2U topics. Please use the buttons below to navigate.",
        stage === "menu" ? MAIN_MENU_OPTIONS : null
      ));
    }, 300);
  };

  const handleRestart = () => {
    setMessages([]);
    setStage("greeting");
    setUserName("");
    setActiveFlow(null);
    setTimeout(() => push(botMsg("👋 Hi again! What's your name?")), 300);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
      {/* Chat window */}
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-[360px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-120px)] flex flex-col pointer-events-auto transition-all duration-300 transform origin-bottom-right ${
          open ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Bot className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">Back2U Assistant</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-white/80 text-[10px] font-medium uppercase tracking-wider text-green-100">Always Active</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
              title="Restart session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm ${
                  msg.from === "bot" ? "bg-gradient-to-br from-primary-500 to-accent-500" : "bg-gray-400"
                }`}>
                  {msg.from === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm border ${
                    msg.from === "user"
                      ? "bg-primary-500 text-white rounded-tr-none border-primary-400"
                      : "bg-white text-gray-800 rounded-tl-none border-gray-100"
                  }`}>
                    {msg.text.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                    ))}
                  </div>

                  {/* Options */}
                  {msg.options && (
                    <div className="flex flex-col gap-2 mt-2 w-full">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => handleButtonClick(opt.key)}
                          className="w-full text-left px-4 py-2.5 bg-white border border-primary-100 rounded-xl text-[13px] font-medium text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all duration-200 shadow-sm"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 pl-3 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => stage === "greeting" && setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && stage === "greeting" && handleSend()}
              placeholder={stage === "greeting" ? "What's your name?" : "Use options above..."}
              disabled={stage !== "greeting"}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || stage !== "greeting"}
              className={`p-2 rounded-xl transition-all ${
                input.trim() && stage === "greeting"
                  ? "bg-primary-500 text-white shadow-md hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto transition-all duration-500 hover:scale-110 active:scale-95 group ${
          open ? "bg-red-500" : "bg-gradient-to-br from-primary-500 to-accent-600"
        }`}
        aria-label="Toggle assistant"
      >
        <div className="relative w-6 h-6">
          <MessageCircle className={`absolute inset-0 transition-all duration-500 ${open ? "opacity-0 scale-0" : "opacity-100 scale-100"}`} />
          <X className={`absolute inset-0 transition-all duration-500 ${open ? "opacity-100 scale-100" : "opacity-0 scale-0"}`} />
        </div>
        
        {/* Tooltip */}
        {!open && (
          <div className="absolute right-16 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap hidden sm:block">
            Need Help?
          </div>
        )}
      </button>
    </div>
  );
}
