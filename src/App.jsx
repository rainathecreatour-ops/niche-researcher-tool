import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  Package,
  DollarSign,
  Target,
  FileText,
  Loader2,
  Download,
  Plus,
  Lightbulb,
  Zap,
  HelpCircle,
  Star,
  Trash2,
  LayoutList,
  BarChart3,
} from "lucide-react";

export default function App() {
  const productName = "Niche Researcher Tool";

  // 🔐 Access codes (simple for now)
  const VALID_CODES = useMemo(() => ["TEST-123456", "ADMIN-2024"], []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [step, setStep] = useState("intake"); // intake | research
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // New: Modes (makes it feel like software, not chat)
  const [mode, setMode] = useState("Explore"); // Explore | Validate | Build | Launch

  // New: “Workspace” tab
  const [view, setView] = useState("Research"); // Research | My Niches

  const [detailLevel, setDetailLevel] = useState("beginner"); // beginner | advanced

  const [nicheData, setNicheData] = useState({
    niche: "",
    buyer: "",
    platform: "",
    productType: "",
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  // New: Parsed structured outputs
  const [scorecard, setScorecard] = useState(null);
  const [nextActions, setNextActions] = useState([]);

  // New: Saved niches
  const [savedNiches, setSavedNiches] = useState([]);
  const [toast, setToast] = useState("");

  const nicheExamples = [
    "Productivity tools for remote workers",
    "Pet accessories for anxious dogs",
    "Meal planning for busy parents",
    "Fitness tracking for seniors",
    "Budget management for college students",
  ];

  // --- Helpers ---
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  };

  const readSaved = () => {
    try {
      const raw = localStorage.getItem("savedNiches");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writeSaved = (items) => {
    localStorage.setItem("savedNiches", JSON.stringify(items));
    setSavedNiches(items);
  };

  // Persist login
  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (token) setIsAuthenticated(true);
    setSavedNiches(readSaved());
  }, []);

  const handleVerifyAccess = async () => {
    const code = accessCode.trim().toUpperCase();
    if (!code) return alert("Please enter your access code");

    setAuthLoading(true);
    try {
      if (VALID_CODES.includes(code)) {
        localStorage.setItem("sessionToken", "session-" + Date.now());
        setIsAuthenticated(true);
        alert("✅ Access granted!");
      } else {
        alert("❌ Invalid access code.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sessionToken");
    setIsAuthenticated(false);
    setStep("intake");
    setChatHistory([]);
    setScorecard(null);
    setNextActions([]);
    setNicheData({ niche: "", buyer: "", platform: "", productType: "" });
  };

  const callAI = async ({ prompt, messages }) => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, messages }),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return JSON: " + text.slice(0, 200));
    }

    const aiText =
      data?.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n") || "";

    return aiText;
  };

  // --- Parsing logic (makes results feel “tool-like”) ---
  const parseScorecard = (text) => {
    // Looks for:
    // Demand: 7/10
    // Competition: 6/10
    // Monetization: 8/10
    // Speed: 7/10
    // Overall: 78/100
    const get10 = (label) => {
      const m = text.match(new RegExp(`${label}\\s*:\\s*(\\d{1,2})\\s*/\\s*10`, "i"));
      return m ? Math.max(0, Math.min(10, parseInt(m[1], 10))) : null;
    };
    const overallM = text.match(/Overall\s*:\s*(\d{1,3})\s*\/\s*100/i);
    const overall = overallM ? Math.max(0, Math.min(100, parseInt(overallM[1], 10))) : null;

    const demand = get10("Demand");
    const competition = get10("Competition");
    const monetization = get10("Monetization");
    const speed = get10("Speed");

    if ([demand, competition, monetization, speed, overall].every((v) => v === null)) return null;

    return { demand, competition, monetization, speed, overall };
  };

  const parseNextActions = (text) => {
    // Find “NEXT 3 ACTIONS” block, then grab numbered lines 1..3
    const blockMatch =
      text.match(/NEXT\s*3\s*ACTIONS[\s\S]*?(?=\n#{1,3}\s|\n[A-Z][A-Z \-]{4,}:|\n🔍|\n$)/i) ||
      text.match(/NEXT\s*3\s*ACTIONS[\s\S]*$/i);

    if (!blockMatch) return [];

    const block = blockMatch[0];

    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const actions = [];
    for (const line of lines) {
      const m = line.match(/^(?:\d+[\).\:-])\s*(.+)$/);
      if (m && m[1]) actions.push(m[1]);
      if (actions.length >= 3) break;
    }
    return actions.slice(0, 3);
  };

  const buildInitialPrompt = () => {
    const depth = detailLevel === "advanced" ? "Advanced" : "Beginner";
    return `You are an AI niche research assistant. Be clear, structured, and action-oriented.
MODE: ${mode}
DETAIL LEVEL: ${depth}

Analyze:
Niche: ${nicheData.niche}
Buyer: ${nicheData.buyer}
Platform: ${nicheData.platform}
Product Type: ${nicheData.productType}

Return in this exact structure (keep it readable, bullets ok):

### SCORECARD
Demand: X/10
Competition: X/10
Monetization: X/10
Speed: X/10
Overall: X/100

### NEXT 3 ACTIONS
1) ...
2) ...
3) ...

### RESEARCH
🔍 3 SUB-NICHES
⚠️ TOP 3 PROBLEMS
💡 3 PRODUCT IDEAS (include best format)
📌 PRICING + POSITIONING
📢 MARKETING THAT WORKS (platform-specific)

Be honest. Avoid fluff.`;
  };

  const handleStartResearch = async () => {
    if (!nicheData.niche || !nicheData.buyer || !nicheData.platform || !nicheData.productType) {
      alert("Please fill in all fields to begin research");
      return;
    }

    setLoading(true);
    setStep("research");
    setView("Research");
    setScorecard(null);
    setNextActions([]);

    try {
      const aiResponse = await callAI({ prompt: buildInitialPrompt() });

      const sc = parseScorecard(aiResponse);
      const actions = parseNextActions(aiResponse);

      setScorecard(sc);
      setNextActions(actions);

      setChatHistory([
        { role: "user", content: `Analyzing: ${nicheData.niche}` },
        { role: "assistant", content: aiResponse },
      ]);
    } catch (e) {
      alert("Error connecting to AI: " + e.message);
      setStep("intake");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageToSend = null) => {
    const message = (messageToSend ?? currentMessage).trim();
    if (!message) return;

    const newHistory = [...chatHistory, { role: "user", content: message }];
    setChatHistory(newHistory);
    setCurrentMessage("");
    setLoading(true);

    try {
      const aiResponse = await callAI({ messages: newHistory.slice(-10) });

      // Keep parsing updated score/actions if AI returns them again
      const sc = parseScorecard(aiResponse);
      const actions = parseNextActions(aiResponse);
      if (sc) setScorecard(sc);
      if (actions.length) setNextActions(actions);

      setChatHistory([...newHistory, { role: "assistant", content: aiResponse }]);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const report = chatHistory
      .map((m) => `${m.role === "user" ? "YOU" : "AI"}:\n${m.content}\n`)
      .join("\n---\n");
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `niche-research-${Date.now()}.txt`;
    a.click();
  };

  const handleReset = () => {
    setStep("intake");
    setChatHistory([]);
    setScorecard(null);
    setNextActions([]);
    setNicheData({ niche: "", buyer: "", platform: "", productType: "" });
  };

  // --- New: Save/Load/Delete niches ---
  const handleSaveNiche = () => {
    if (!nicheData.niche) return alert("Add a niche first.");

    const item = {
      id: "n_" + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      detailLevel,
      nicheData,
      scorecard,
      nextActions,
      transcript: chatHistory,
    };

    const current = readSaved();
    writeSaved([item, ...current]);
    showToast("⭐ Saved to My Niches");
  };

  const handleLoadNiche = (item) => {
    setMode(item.mode || "Explore");
    setDetailLevel(item.detailLevel || "beginner");
    setNicheData(item.nicheData || { niche: "", buyer: "", platform: "", productType: "" });
    setScorecard(item.scorecard || null);
    setNextActions(item.nextActions || []);
    setChatHistory(item.transcript || []);
    setStep("research");
    setView("Research");
    showToast("✅ Loaded saved niche");
  };

  const handleDeleteNiche = (id) => {
    const updated = readSaved().filter((x) => x.id !== id);
    writeSaved(updated);
    showToast("🗑️ Deleted");
  };

  // --- Login screen ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
              <TrendingUp className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{productName}</h1>
            <p className="text-gray-600">Enter your access code to get started</p>
          </div>

          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyAccess()}
            placeholder="TEST-123456"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-3 focus:border-indigo-500 focus:outline-none text-lg font-mono text-center uppercase"
            disabled={authLoading}
          />

          <button
            onClick={handleVerifyAccess}
            disabled={authLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "🔓 Activate Access"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg text-sm shadow">
          {toast}
        </div>
      )}

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{productName}</h1>
              <p className="text-sm text-gray-600">A niche workspace (not just a chat)</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {/* Mode selector */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              title="Choose your workflow stage"
            >
              <option>Explore</option>
              <option>Validate</option>
              <option>Build</option>
              <option>Launch</option>
            </select>

            {/* Detail level */}
            <select
              value={detailLevel}
              onChange={(e) => setDetailLevel(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              title="How detailed should the AI be?"
            >
              <option value="beginner">Beginner</option>
              <option value="advanced">Advanced</option>
            </select>

            {step === "research" && (
              <>
                <button
                  onClick={handleSaveNiche}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  title="Save this niche to your workspace"
                >
                  <Star className="w-4 h-4" /> Save
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Download your research"
                >
                  <Download className="w-4 h-4" /> Export
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  title="Start a new niche"
                >
                  <Plus className="w-4 h-4" /> New
                </button>
              </>
            )}

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              title="How this works"
            >
              <HelpCircle className="w-4 h-4" /> Help
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              title="Log out"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Workspace tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-2">
          <button
            onClick={() => setView("Research")}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 border ${
              view === "Research" ? "bg-white" : "bg-gray-50"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Research
          </button>
          <button
            onClick={() => setView("My Niches")}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 border ${
              view === "My Niches" ? "bg-white" : "bg-gray-50"
            }`}
          >
            <LayoutList className="w-4 h-4" /> My Niches ({savedNiches.length})
          </button>
        </div>
      </header>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">How to Use</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-gray-700">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-semibold">This is a workspace</div>
                  <div className="text-sm text-gray-600">
                    Save niches, compare ideas, and build a library of research over time.
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Use <b>Modes</b> (Explore/Validate/Build/Launch) to get different kinds of outputs.
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* VIEW: My Niches */}
        {view === "My Niches" && (
          <div className="bg-white border rounded-2xl shadow p-6">
            <h2 className="text-2xl font-bold mb-2">My Niches</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your saved research sessions live here. Load one to continue where you left off.
            </p>

            {savedNiches.length === 0 ? (
              <div className="text-gray-600">
                No saved niches yet. Run a research session, then click <b>Save</b>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedNiches.map((item) => (
                  <div key={item.id} className="border rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{item.nicheData?.niche || "Untitled niche"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.mode || "Explore"} • {new Date(item.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-700 mt-2">
                          Platform: <b>{item.nicheData?.platform || "—"}</b> • Type:{" "}
                          <b>{item.nicheData?.productType || "—"}</b>
                        </div>

                        {item.scorecard?.overall != null && (
                          <div className="mt-2 text-sm">
                            Overall Score:{" "}
                            <span className="font-bold text-indigo-700">{item.scorecard.overall}/100</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadNiche(item)}
                          className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteNiche(item.id)}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {Array.isArray(item.nextActions) && item.nextActions.length > 0 && (
                      <div className="mt-3 bg-gray-50 border rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-600 mb-1">NEXT ACTIONS</div>
                        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                          {item.nextActions.slice(0, 3).map((a, idx) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Research */}
        {view === "Research" && (
          <>
            {step === "intake" && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8 border">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                      <Search className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Find Your Next Product Idea</h2>
                    <p className="text-gray-600">Answer 4 quick questions</p>
                    <p className="text-xs text-gray-500 mt-2">⚡ Most users find a viable idea in under 5 minutes.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">1. What niche?</label>
                      <input
                        type="text"
                        value={nicheData.niche}
                        onChange={(e) => setNicheData({ ...nicheData, niche: e.target.value })}
                        placeholder="e.g., productivity tools for remote workers"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {nicheExamples.map((ex, i) => (
                          <button
                            key={i}
                            onClick={() => setNicheData({ ...nicheData, niche: ex })}
                            className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-indigo-100"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">2. Target buyer?</label>
                      <input
                        type="text"
                        value={nicheData.buyer}
                        onChange={(e) => setNicheData({ ...nicheData, buyer: e.target.value })}
                        placeholder="e.g., 25–40 year old freelancers"
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">3. Where to sell?</label>
                      <select
                        value={nicheData.platform}
                        onChange={(e) => setNicheData({ ...nicheData, platform: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      >
                        <option value="">Select platform...</option>
                        <option value="Etsy">Etsy</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Shopify">Shopify</option>
                        <option value="Gumroad">Gumroad</option>
                        <option value="Fiverr">Fiverr</option>
                        <option value="Upwork">Upwork</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Own Website">Own Website</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">4. Product type?</label>
                      <select
                        value={nicheData.productType}
                        onChange={(e) => setNicheData({ ...nicheData, productType: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      >
                        <option value="">Select...</option>
                        <option value="Digital">📄 Digital Products</option>
                        <option value="Physical">📦 Physical Products</option>
                        <option value="AI Tools">🤖 AI Tools</option>
                        <option value="Automation">⚡ Automation</option>
                        <option value="All Types">✨ All Types</option>
                      </select>
                    </div>

                    <button
                      onClick={handleStartResearch}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow-lg"
                    >
                      {loading ? "Finding Opportunities..." : "Start Research →"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "research" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Scorecard + Next actions */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white rounded-lg shadow-lg p-5 border">
                    <h3 className="font-bold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Scorecard
                    </h3>

                    {!scorecard ? (
                      <p className="text-sm text-gray-600 mt-3">Run research to generate scores.</p>
                    ) : (
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Demand</span>
                          <b>{scorecard.demand ?? "—"}/10</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Competition</span>
                          <b>{scorecard.competition ?? "—"}/10</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Monetization</span>
                          <b>{scorecard.monetization ?? "—"}/10</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed</span>
                          <b>{scorecard.speed ?? "—"}/10</b>
                        </div>

                        <div className="mt-3 pt-3 border-t flex justify-between text-base">
                          <span className="font-semibold">Overall</span>
                          <span className="font-bold text-indigo-700">{scorecard.overall ?? "—"}/100</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-5 border">
                    <h3 className="font-bold flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Next 3 Actions
                    </h3>

                    {nextActions.length === 0 ? (
                      <p className="text-sm text-gray-600 mt-3">Your plan will appear here after research.</p>
                    ) : (
                      <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-gray-700">
                        {nextActions.map((a, idx) => (
                          <li key={idx}>{a}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>

                {/* Right: Chat */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-lg shadow-lg border flex flex-col" style={{ height: "75vh" }}>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-3xl rounded-lg p-4 ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                : "bg-gray-50 border"
                            }`}
                          >
                            <div
                              className={`text-xs font-semibold mb-2 ${
                                msg.role === "user" ? "text-indigo-100" : "text-gray-500"
                              }`}
                            >
                              {msg.role === "user" ? "YOU" : "🤖 AI"}
                            </div>
                            <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          </div>
                        </div>
                      ))}

                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-50 border rounded-lg p-4 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                            <span className="text-sm">Analyzing...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t p-4 bg-gray-50">
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder="Ask anything..."
                          className="flex-1 px-4 py-3 border rounded-lg"
                          disabled={loading}
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 font-semibold"
                        >
                          Send
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          title="Quick launch plan"
                          onClick={() => handleSendMessage("Quick plan: product, price, week 1, where to sell")}
                          disabled={loading}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50"
                        >
                          🚀 Build This
                        </button>

                        <button
                          title="Find 3 more problems"
                          onClick={() => handleSendMessage("3 more problems")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          🔍 Go Deeper
                        </button>

                        <button
                          title="Turn this into an AI tool"
                          onClick={() => handleSendMessage("AI tool: features + tech")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50"
                        >
                          🤖 AI Tool
                        </button>

                        <button
                          title="Automation ideas to save time"
                          onClick={() => handleSendMessage("3 automation ideas")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50"
                        >
                          ⚡ Automation
                        </button>

                        <button
                          title="Optimized listing copy"
                          onClick={() => handleSendMessage("Product listing: title + description")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50 disabled:opacity-50"
                        >
                          ✍️ Listing
                        </button>

                        <button
                          title="Top 3 marketing channels"
                          onClick={() => handleSendMessage("Top 3 marketing channels")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-white border border-pink-300 text-pink-700 rounded-lg text-sm hover:bg-pink-50 disabled:opacity-50"
                        >
                          📢 Marketing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
