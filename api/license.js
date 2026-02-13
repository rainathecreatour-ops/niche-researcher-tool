export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const { licenseKey } = body;

    if (!licenseKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing license key'
      });
    }

    const productId = process.env.GUMROAD_PRODUCT_ID;

    if (!productId) {
      return res.status(500).json({
        success: false,
        message: 'Missing GUMROAD_PRODUCT_ID'
      });
    }

    const response = await fetch(
      'https://api.gumroad.com/v2/licenses/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          product_id: productId,
          license_key: licenseKey
        })
      }
    );

    const data = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({
      success: false,
      message: data.message || 'Invalid license'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}



    
