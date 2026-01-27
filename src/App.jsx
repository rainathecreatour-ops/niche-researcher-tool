import React, { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, Package, DollarSign, Target, FileText, Loader2, Download, Plus, Lightbulb, Zap, HelpCircle } from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [step, setStep] = useState("intake");
  const [loading, setLoading] = useState(false);

  const [nicheData, setNicheData] = useState({
    niche: "",
    buyer: "",
    platform: "",
    productType: ""
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const productName = "Niche Researcher Tool";

  const validCodes = useMemo(() => ["TEST-123456", "YOUR-ADMIN-CODE"], []);

  const nicheExamples = [
    "Productivity tools for remote workers",
    "Pet accessories for anxious dogs",
    "Meal planning for busy parents",
    "Fitness tracking for seniors",
    "Budget management for college students"
  ];

  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (token) setIsAuthenticated(true);
  }, []);

  const handleVerifyAccess = async () => {
    const code = accessCode.trim().toUpperCase();
    if (!code) return alert("Please enter your access code");

    setAuthLoading(true);
    try {
      if (validCodes.includes(code)) {
        localStorage.setItem("sessionToken", "session-" + Date.now());
        setIsAuthenticated(true);
        alert("✅ Access granted! Welcome!");
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

  const callAI = async ({ prompt, messages }) => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, messages })
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return JSON: " + text.slice(0, 200));
    }

    const aiText =
      data?.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") || "";

    return aiText;
  };

  const handleStartResearch = async () => {
    if (!nicheData.niche || !nicheData.buyer || !nicheData.platform || !nicheData.productType) {
      alert("Please fill in all fields to begin research");
      return;
    }

    setLoading(true);
    setStep("research");

    const prompt = `Analyze this niche briefly:
Niche: ${nicheData.niche}
Buyer: ${nicheData.buyer}
Platform: ${nicheData.platform}
Type: ${nicheData.productType}

Give me: A) 3 sub-niches B) Top 3 problems C) 3 product ideas D) Marketing tip. Keep it brief.`;

    try {
      const aiResponse = await callAI({ prompt });

      setChatHistory([
        { role: "user", content: `Analyzing: ${nicheData.niche}` },
        { role: "assistant", content: aiResponse },
        { role: "assistant", content: "\n✅ RESEARCH COMPLETE! Ask me anything or use the buttons below for more details." }
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
    const report = chatHistory.map((m) => `${m.role === "user" ? "YOU" : "AI"}:\n${m.content}\n`).join("\n---\n");
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `niche-research-${Date.now()}.txt`;
    a.click();
  };

  const handleReset = () => {
    setStep("intake");
    setNicheData({ niche: "", buyer: "", platform: "", productType: "" });
    setChatHistory([]);
  };

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
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{productName}</h1>
              <p className="text-sm text-gray-600">Find profitable products</p>
            </div>
          </div>

          <div className="flex gap-2">
            {step === "research" && (
              <>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Download className="w-4 h-4" />Export
                </button>
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <Plus className="w-4 h-4" />New
                </button>
              </>
            )}

            <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
              <HelpCircle className="w-4 h-4" />Help
            </button>

            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {step === "intake" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Find Your Next Product Idea</h2>
                <p className="text-gray-600">Answer 4 quick questions</p>
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
                      <button key={i} onClick={() => setNicheData({ ...nicheData, niche: ex })} className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-indigo-100">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">2. Target buyer?</label>
                  <input type="text" value={nicheData.buyer} onChange={(e) => setNicheData({ ...nicheData, buyer: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">3. Where to sell?</label>
                  <select value={nicheData.platform} onChange={(e) => setNicheData({ ...nicheData, platform: e.target.value })} className="w-full px-4 py-3 border rounded-lg">
                    <option value="">Select...</option>
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
                  <select value={nicheData.productType} onChange={(e) => setNicheData({ ...nicheData, productType: e.target.value })} className="w-full px-4 py-3 border rounded-lg">
                    <option value="">Select...</option>
                    <option value="Digital">Digital</option>
                    <option value="Physical">Physical</option>
                    <option value="AI Tools">AI Tools</option>
                    <option value="Automation">Automation</option>
                  </select>
                </div>

                <button onClick={handleStartResearch} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold disabled:opacity-50 shadow-lg">
                  {loading ? "Finding Opportunities..." : "Start Research →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "research" && (
          <div className="bg-white rounded-lg shadow-lg border flex flex-col" style={{ height: "75vh" }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-3xl rounded-lg p-4 ${msg.role === "user" ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-gray-50 border"}`}>
                    <div className={`text-xs font-semibold mb-2 ${msg.role === "user" ? "text-indigo-100" : "text-gray-500"}`}>{msg.role === "user" ? "YOU" : "🤖 AI"}</div>
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
                <button onClick={() => handleSendMessage()} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg disabled:opacity-50 font-semibold">
                  Send
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleSendMessage("Quick plan: product, price, week 1 strategy")} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
                  🚀 Build This
                </button>
                <button onClick={() => handleSendMessage("3 more problems")} disabled={loading} className="px-3 py-1.5 bg-white border rounded-lg text-sm disabled:opacity-50">
                  🔍 Go Deeper
                </button>
                <button onClick={() => handleSendMessage("AI tool: features + tech")} disabled={loading} className="px-3 py-1.5 bg-white border rounded-lg text-sm disabled:opacity-50">
                  🤖 AI Tool
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
