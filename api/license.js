// /api/license.js - For Create React App on Vercel

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;
    const productId = process.env.GUMROAD_PRODUCT_ID;

    if (!productId) {
      return res.status(500).json({
        ok: false,
        error: 'Missing GUMROAD_PRODUCT_ID on server.'
      });
    }

    const key = (licenseKey || '').trim();
    if (key.length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'Enter a valid Gumroad license key.'
      });
    }

    const body = new URLSearchParams();
    body.set('product_id', productId);
    body.set('license_key', key);
    body.set('increment_uses_count', 'false');

    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    });

    const data = await response.json();

    if (!data || !data.success) {
      return res.status(401).json({
        ok: false,
        error: data?.message || 'That license key is not valid.',
        gumroad: data
      });
    }

    return res.status(200).json({
      ok: true,
      purchase: data.purchase || null
    });

  } catch (error) {
    console.error('License error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Verification failed.'
    });
  }
};
