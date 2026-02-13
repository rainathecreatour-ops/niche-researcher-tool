// /api/license.js - Clean version with no syntax errors

export default async function handler(req, res) {
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
        error: 'Server configuration error'
      });
    }

    if (!licenseKey || licenseKey.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'Please enter a valid license key'
      });
    }

    const formData = new URLSearchParams();
    formData.append('product_id', productId);
    formData.append('license_key', licenseKey.trim());
    formData.append('increment_uses_count', 'false');

    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(401).json({
        ok: false,
        error: data.message || 'Invalid license key',
        gumroad: data
      });
    }

    return res.status(200).json({
      ok: true,
      purchase: data.purchase
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Verification failed'
    });
  }
}
