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
} from "lucide-react";

export default function App() {
  const productName = "Niche Researcher Tool";

  // 🔐 Access codes (keep simple for now)
  // IMPORTANT: this is client-side, so don’t put your full customer code list here long-term.
  const VALID_CODES = useMemo(() => ["TEST-123456", "ADMIN-2024"], []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [step, setStep] = useState("intake"); // intake | research
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [detailLevel, setDetailLevel] = useState("beginner"); // beginner | advanced
  const [savedMessage, setSavedMessage] = useState("");

  const [nicheData, setNicheData] = useState({
    niche: "",
    buyer: "",
    platform: "",
    productType: "",
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const nicheExamples = [
    "Productivity tools for remote workers",
    "Pet accessories for anxious dogs",
    "Meal planning for busy parents",
    "Fitness tracking for seniors",
    "Budget management for college students",
  ];

  // Persist login across refresh
  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (token) setIsAuthenticated(true);
  }, []);

  // Load saved idea (optional)
  useEffect(() => {
    const saved = localStorage.getItem("savedIdea");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.niche) setNicheData((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
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
    setNicheData({ niche: "", buyer: "", platform: "", productType: "" });
  };

  const handleDemoExample = () => {
    setNicheData({
      niche: "Pet accessories for anxious dogs",
      buyer: "Rescue dog owners and first-time adopters",
      platform: "Etsy",
      productType: "Digital",
    });
    setSavedMessage("✅ Demo example loaded!");
    setTimeout(() => setSavedMessage(""), 1800);
  };

  const handleSaveIdea = () => {
    localStorage.setItem("savedIdea", JSON.stringify(nicheData));
    setSavedMessage("✅ Saved! (Stored in your browser)");
    setTimeout(() => setSavedMessage(""), 1800);
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
      throw new Error("Server did not return JSON. " + text.slice(0, 200));
    }

    const aiText =
      data?.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n") || "";

    return aiText;
  };

  const buildInitialPrompt = () => {
    const depth =
      detailLevel === "advanced"
        ? "Advanced (detailed + tactical)"
        : "Beginner (simple + clear)";

    return `You are an AI niche research assistant. Be clear, structured, and action-oriented.

DETAIL LEVEL: ${depth}

Analyze this niche:

Niche: ${nicheData.niche}
Buyer: ${nicheData.buyer}
Platform: ${nicheData.platform}
Product Type Focus: ${nicheData.productType}

Return your answer with these exact headings:

🔍 3 PROFITABLE SUB-NICHES
- (3 bullets)

⚠️ TOP 3 REAL PROBLEMS
- (3 bullets)

💡 3 PRODUCT IDEAS THAT SOLVE THEM
- (3 bullets, include “best format” if helpful)

📌 PRICING + POSITIONING
- (2–4 bullets)

📢 MARKETING THAT WORKS (for the selected platform)
- (3 bullets)

✅ NEXT BEST STEP (1 sentence)

Keep it concise but useful. No fluff.`;
  };

  const handleStartResearch = async () => {
    if (!nicheData.niche || !nicheData.buyer || !nicheData.platform || !nicheData.productType) {
      alert("Please fill in all fields to begin research");
      return;
    }

    setLoading(true);
    setStep("research");

    try {
      const aiResponse = await callAI({ prompt: buildInitialPrompt() });

      setChatHistory([
        { role: "user", content: `Analyzing: ${nicheData.niche}` },
        { role: "assistant", content: aiResponse },
        {
          role: "assistant",
          content:
            "\n✅ RESEARCH COMPLETE!\nUse the quick buttons below or ask a follow-up question.",
        },
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
    setNicheData({ niche: "", buyer: "", platform: "", productType: "" });
  };

  // 🔐 Login screen
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

          <div className="mt-4 text-xs text-gray-500 leading-relaxed">
            Tip: If you can’t find your code, check your purchase confirmation email.
          </div>
        </div>
      </div>
    );
  }

  const platformLabel =
    nicheData.platform || (nicheData.platform === "" ? "—" : nicheData.platform);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{productName}</h1>
              <p className="text-sm text-gray-600">Find profitable products in minutes</p>
            </div>
          </div>

          <div className="flex gap-2">
            {step === "research" && (
              <>
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
      </header>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">How to Use</h2>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-bold">Step 1: Define Your Niche</h3>
                  <p className="text-gray-600 text-sm">
                    Be specific. The clearer the niche + buyer, the better the results.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h3 className="font-bold">Step 2: Review Results</h3>
                  <p className="text-gray-600 text-sm">
                    You’ll get sub-niches, problems, product ideas, pricing and marketing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-bold">Step 3: Go Deeper</h3>
                  <p className="text-gray-600 text-sm">
                    Use quick action buttons or ask your own follow-up questions.
                  </p>
                </div>
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
        {step === "intake" && (
          <div className="max-w-3xl mx-auto">
            {/* What happens next */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                <Search className="mx-auto text-indigo-600 mb-2" />
                <h3 className="font-semibold">1) Enter your idea</h3>
                <p className="text-sm text-gray-600">Niche + buyer + platform</p>
              </div>
              <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                <TrendingUp className="mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold">2) AI research</h3>
                <p className="text-sm text-gray-600">Demand + problems + products</p>
              </div>
              <div className="bg-white border rounded-xl p-4 text-center shadow-sm">
                <Target className="mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold">3) Take action</h3>
                <p className="text-sm text-gray-600">Pricing + marketing plan</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Find Your Next Product Idea</h2>
                  <p className="text-gray-600">Answer 4 quick questions</p>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚡ Most users find a viable idea in under 5 minutes.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={handleDemoExample}
                    className="text-sm px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                    title="Auto-fill an example so you can see how it works"
                  >
                    Try a demo example →
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Detail</span>
                    <select
                      value={detailLevel}
                      onChange={(e) => setDetailLevel(e.target.value)}
                      className="text-sm border rounded-lg px-3 py-2"
                      title="Choose how detailed the AI should be"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveIdea}
                    className="text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    title="Save your current idea in your browser"
                  >
                    Save idea
                  </button>

                  {savedMessage && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                      {savedMessage}
                    </div>
                  )}
                </div>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific. “Pet products” is broad. “Anxiety products for rescue dogs” is better.
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {nicheExamples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setNicheData({ ...nicheData, niche: ex })}
                        className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-indigo-100"
                        title="Use this example"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Who spends money here? Describe the person, job, situation, or pain point.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">3. Where to sell?</label>
                  <select
                    value={nicheData.platform}
                    onChange={(e) => setNicheData({ ...nicheData, platform: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Select platform...</option>
                    <optgroup label="E-commerce">
                      <option value="Etsy">Etsy</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Shopify">Shopify</option>
                      <option value="Own Website">Own Website</option>
                    </optgroup>
                    <optgroup label="Digital Products">
                      <option value="Gumroad">Gumroad</option>
                      <option value="Creative Market">Creative Market</option>
                      <option value="Teachable">Teachable</option>
                      <option value="Udemy">Udemy</option>
                      <option value="Patreon">Patreon</option>
                    </optgroup>
                    <optgroup label="Freelance Services">
                      <option value="Fiverr">Fiverr</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="99designs">99designs</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Platform matters because pricing + competition + what sells is different everywhere.
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    If you’re unsure, choose “All Types” to get a broader set of ideas.
                  </p>
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

            {/* Feature cards (keeps the page understandable) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border hover:shadow-md transition">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-1">Real Problems</h3>
                <p className="text-sm text-gray-600">Find what customers complain about</p>
              </div>

              <div className="bg-white p-4 rounded-lg border hover:shadow-md transition">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">Demand + Fit</h3>
                <p className="text-sm text-gray-600">Match the right product to the right buyer</p>
              </div>

              <div className="bg-white p-4 rounded-lg border hover:shadow-md transition">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">Action Plan</h3>
                <p className="text-sm text-gray-600">SEO keywords + launch strategy</p>
              </div>

              <div className="bg-white p-4 rounded-lg border hover:shadow-md transition">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-1">Profit Focused</h3>
                <p className="text-sm text-gray-600">Pricing guidance + positioning</p>
              </div>
            </div>
          </div>
        )}

        {step === "research" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 border sticky top-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Your Inputs
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Niche</span>
                    <p className="text-sm font-medium">{nicheData.niche || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Buyer</span>
                    <p className="text-sm">{nicheData.buyer || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Platform</span>
                    <p className="text-sm">{platformLabel}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Focus</span>
                    <p className="text-sm">{nicheData.productType || "—"}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveIdea}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-semibold"
                      title="Save your inputs for next time"
                    >
                      Save inputs
                    </button>
                    {savedMessage && (
                      <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                        {savedMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat */}
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

                  {/* Next steps checklist (only show after first response) */}
                  {chatHistory.length >= 2 && !loading && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-bold mb-2">✅ Your Next Steps</h3>
                      <ul className="text-sm space-y-1 text-gray-700">
                        <li>☐ Pick 1 sub-niche that feels the most “painful + specific”</li>
                        <li>☐ Choose 1 product idea you can make in 1–3 days</li>
                        <li>☐ Validate by checking top listings on your platform</li>
                        <li>☐ Build a simple version and launch within 7 days</li>
                      </ul>
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
                      placeholder="Ask anything… (e.g., “Which product idea is easiest to launch?”)"
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
                      title="Quick launch plan: product + price + week 1 strategy"
                      onClick={() =>
                        handleSendMessage("🚀 Build This: Give a quick launch plan with product, price, week 1, where to sell.")
                      }
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50"
                    >
                      🚀 Build This
                    </button>

                    <button
                      title="Find 3 more problems people complain about"
                      onClick={() => handleSendMessage("🔍 Go Deeper: Give 3 more real problems customers have in this niche.")}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      🔍 Go Deeper
                    </button>

                    <button
                      title="Turn this into an AI tool idea (features + who it helps)"
                      onClick={() => handleSendMessage("🤖 AI Tool Ideas: Suggest AI tool features + who it helps + why it would sell.")}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50"
                    >
                      🤖 AI Tool Ideas
                    </button>

                    <button
                      title="Automation ideas to save time or improve results"
                      onClick={() => handleSendMessage("⚡ Automation: Give 3 automation ideas for this niche + how they save time.")}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50"
                    >
                      ⚡ Automation
                    </button>

                    <button
                      title="Optimized product listing title + description for this platform"
                      onClick={() => handleSendMessage("✍️ Product Listing: Write an optimized title + description for the best product idea.")}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50 disabled:opacity-50"
                    >
                      ✍️ Product Listing
                    </button>

                    <button
                      title="Top 3 marketing channels for this platform"
                      onClick={() => handleSendMessage("📢 Marketing: Give top 3 marketing channels + what to post for each.")}
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
      </main>
    </div>
  );
}
