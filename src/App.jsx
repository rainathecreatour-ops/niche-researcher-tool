import React, { useEffect, useState } from 'react';
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
  HelpCircle
} from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [licenseKey, setLicenseKey] = useState(''); // you can rename to accessCode later
  const [authLoading, setAuthLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [step, setStep] = useState('intake');
  const [loading, setLoading] = useState(false);

  const [nicheData, setNicheData] = useState({
    niche: '',
    buyer: '',
    platform: '',
    customPlatform: '',
    productType: ''
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const nicheExamples = [
    'Productivity tools for remote workers',
    'Pet accessories for anxious dogs',
    'Meal planning for busy parents',
    'Fitness tracking for seniors',
    'Budget management for college students'
  ];


  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    const savedEmail = localStorage.getItem('userEmail');
    if (token) {
      setIsAuthenticated(true);
      if (savedEmail) setUserEmail(savedEmail);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUserEmail('');
    setStep('intake');
    setChatHistory([]);
    setNicheData({
      niche: '',
      buyer: '',
      platform: '',
      customPlatform: '',
      productType: ''
    });
  };

  const handleVerifyLicense = async () => {
    const code = licenseKey.trim().toUpperCase();

    if (!code) {
      alert('Please enter your access code');
      return;
    }

    setAuthLoading(true);

    try {
      const validCodes = [
        'YOUR-ADMIN-CODE',
        'TEST-123456'
      ];
    

      if (validCodes.includes(code)) {
        const sessionToken = 'session-' + Date.now();
        localStorage.setItem('sessionToken', sessionToken);
        localStorage.setItem('userEmail', 'user@nicheresearcher.com');
        setUserEmail('user@nicheresearcher.com');
        setIsAuthenticated(true);
        alert('✅ Access granted! Welcome to Niche Researcher Tool!');
        return;
      }

      alert('❌ Invalid access code. Please check your purchase email or contact support.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStartResearch = async () => {
    if (!nicheData.niche || !nicheData.buyer || !nicheData.platform || !nicheData.productType) {
      alert('Please fill in all fields to begin research');
      return;
    }

    setLoading(true);
    setStep('research');

    const initialPrompt = `Analyze this niche briefly:
Niche: ${nicheData.niche}
Buyer: ${nicheData.buyer}
Platform: ${nicheData.platform}
Type: ${nicheData.productType}

Give me: A) 3 sub-niches B) Top 3 problems C) 3 product ideas D) Marketing tip. Keep it brief.`;

    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: initialPrompt })
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('HTTP error! status:', response.status, 'body:', responseText);
        throw new Error(`HTTP error! status: ${response.status}\n\n${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON. Response was:', responseText);
        throw new Error('Server returned invalid response (not JSON).');
      }

      if (data.error || data.errorType) {
        const errorMsg = data.errorMessage || JSON.stringify(data.error) || 'Unknown error';
        alert('API Error: ' + errorMsg);
        setLoading(false);
        setStep('intake');
        return;
      }

      if (!data.content || !Array.isArray(data.content)) {
        alert('Invalid response format. Please try again.');
        setLoading(false);
        setStep('intake');
        return;
      }

      const aiResponse = data.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n');

      if (!aiResponse) {
        alert('No text found in response. Please try again.');
        setLoading(false);
        setStep('intake');
        return;
      }

      setChatHistory([
        { role: 'user', content: `Analyzing: ${nicheData.niche}` },
        { role: 'assistant', content: aiResponse },
        { role: 'assistant', content: '\n✅ RESEARCH COMPLETE! Ask me anything or use the buttons below for more details.' }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Full error:', error);
      alert('Error connecting to AI: ' + error.message);
      setLoading(false);
      setStep('intake');
    }
  };

  const handleSendMessage = async (messageToSend = null) => {
    const message = messageToSend ?? currentMessage;
    if (!message.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newHistory);
    setCurrentMessage('');
    setLoading(true);

    try {
      const messagesToSend = newHistory.slice(-10);

      const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend })
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('HTTP error! status:', response.status, 'body:', responseText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON. Response was:', responseText);
        throw new Error('Server returned invalid response (not JSON).');
      }

      if (data.error || data.errorType) {
        alert('API Error: ' + (data.errorMessage || JSON.stringify(data.error)));
        setLoading(false);
        return;
      }

      if (!data.content || !Array.isArray(data.content)) {
        alert('Invalid response: ' + JSON.stringify(data));
        setLoading(false);
        return;
      }

      const aiResponse = data.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n');

      if (!aiResponse) {
        alert('No text found in response');
        setLoading(false);
        return;
      }

      setChatHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Full error:', error);
      alert('Error: ' + error.message);
    }

    setLoading(false);
  };

  const handleExport = () => {
    const report = chatHistory
      .map((m) => `${m.role === 'user' ? 'YOU' : 'AI'}:\n${m.content}\n`)
      .join('\n---\n');
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand-finder-${Date.now()}.txt`;
    a.click();
  };

  const handleReset = () => {
    setStep('intake');
    setNicheData({ niche: '', buyer: '', platform: '', customPlatform: '', productType: '' });
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

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Niche Researcher Tool</h1>
            <p className="text-gray-600">Enter your access code to get started</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyLicense()}
              placeholder="CUSTOMER-ABC123"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-2 focus:border-indigo-500 focus:outline-none text-lg font-mono text-center uppercase"
              disabled={authLoading}
              maxLength={50}
            />

            <button
              onClick={handleVerifyLicense}
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                '🔓 Activate Access'
              )}
            </button>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">
                💡 <strong>Where&apos;s my access code?</strong>
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Check your purchase confirmation email</li>
                <li>• Your personal access code was sent after purchase</li>
                <li>• Can&apos;t find it? Contact support</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">🛒 Don&apos;t have access yet?</p>
              <a
                href="https://creatour2.gumroad.com/l/jzmabn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-semibold"
              >
                Purchase on Gumroad →
              </a>
            </div>
          </div>
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
              <h1 className="text-2xl font-bold">Niche Researcher Tool</h1>
              <p className="text-sm text-gray-600">Find profitable products</p>
            </div>
          </div>

          <div className="flex gap-2">
            {step === 'research' && (
              <>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </>
            )}

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <span className="text-sm">{userEmail || 'Signed in'}</span>
              <span className="text-xs">Logout</span>
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
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Step 1: Define Your Niche
                </h3>
                <p className="text-gray-600">Enter your niche, target buyer, platform, and product type.</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Step 2: Review Results
                </h3>
                <p className="text-gray-600">Get sub-niches, problems, product ideas, and marketing plans.</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Step 3: Ask Follow-ups
                </h3>
                <p className="text-gray-600">Use the quick buttons or ask custom questions to dig deeper.</p>
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
        {step === 'intake' && (
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
                    placeholder="e.g., 25-40 year old freelancers"
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
                  {loading ? 'Finding Opportunities...' : 'Start Research →'}
                </button>
              </div>
            </div>

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
                <h3 className="font-semibold mb-1">AI &amp; Automation</h3>
                <p className="text-sm text-gray-600">Smart tools opportunities</p>
              </div>

              <div className="bg-white p-4 rounded-lg border hover:shadow-md transition">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">Action Plan</h3>
                <p className="text-sm text-gray-600">SEO keywords &amp; strategies</p>
              </div>

              <div className="bg-white p-4 rounded-lg border hover:shadow-md transition">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-1">Profit Focused</h3>
                <p className="text-sm text-gray-600">Ranked by demand</p>
              </div>
            </div>
          </div>
        )}

        {step === 'research' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 border sticky top-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Your Research
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Niche</span>
                    <p className="text-sm font-medium">{nicheData.niche}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Buyer</span>
                    <p className="text-sm">{nicheData.buyer}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Platform</span>
                    <p className="text-sm">{nicheData.platform}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Focus</span>
                    <p className="text-sm">{nicheData.productType}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-lg border flex flex-col" style={{ height: '75vh' }}>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-3xl rounded-lg p-4 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-gray-50 border'
                        }`}
                      >
                        <div
                          className={`text-xs font-semibold mb-2 ${
                            msg.role === 'user' ? 'text-indigo-100' : 'text-gray-500'
                          }`}
                        >
                          {msg.role === 'user' ? 'YOU' : '🤖 AI'}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
                      onClick={() => handleSendMessage('Quick plan: product, price, week 1, where to sell')}
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50"
                    >
                      🚀 Build This
                    </button>
                    <button
                      onClick={() => handleSendMessage('3 more problems')}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      🔍 Go Deeper
                    </button>
                    <button
                      onClick={() => handleSendMessage('AI tool: features + tech')}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50"
                    >
                      🤖 AI Tool
                    </button>
                    <button
                      onClick={() => handleSendMessage('3 automation ideas')}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50"
                    >
                      ⚡ Automation
                    </button>
                    <button
                      onClick={() => handleSendMessage('Tech stack')}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-700 rounded-lg text-sm hover:bg-indigo-50 disabled:opacity-50"
                    >
                      🛠️ Tech
                    </button>
                    <button
                      onClick={() => handleSendMessage('Product listing: title + description')}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50 disabled:opacity-50"
                    >
                      ✍️ Listing
                    </button>
                    <button
                      onClick={() => handleSendMessage('Week 1 + 2 plan')}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white border border-orange-300 text-orange-700 rounded-lg text-sm hover:bg-orange-50 disabled:opacity-50"
                    >
                      📅 Launch
                    </button>
                    <button
                      onClick={() => handleSendMessage('Top 3 marketing channels')}
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

export default App;
