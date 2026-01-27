const https = require('https');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, max_tokens } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured',
        errorType: 'ConfigurationError'
      });
    }

    const data = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 2000,
      messages: messages
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 55000
      };

      const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => body += chunk);
        apiRes.on('end', () => {
          try {
            resolve({
              statusCode: apiRes.statusCode,
              body: JSON.parse(body)
            });
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        });
      });

      apiReq.on('error', reject);
      apiReq.on('timeout', () => {
        apiReq.destroy();
        reject(new Error('Request timeout'));
      });
      
      apiReq.write(data);
      apiReq.end();
    });

    if (response.statusCode !== 200) {
      return res.status(response.statusCode).j
