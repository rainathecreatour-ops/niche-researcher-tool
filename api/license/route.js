import { NextResponse } from "next/server";

const VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

export async function POST(req) {
  console.log("=== LICENSE VERIFICATION DEBUG ===");
  
  try {
    const body = await req.json();
    const licenseKey = body.licenseKey;
    const productId = process.env.GUMROAD_PRODUCT_ID;

    console.log("1. License Key received:", licenseKey);
    console.log("2. Product ID from env:", productId);
    console.log("3. Product ID exists?", !!productId);

    if (!productId) {
      console.error("ERROR: GUMROAD_PRODUCT_ID not set!");
      return NextResponse.json(
        { ok: false, error: "Server config error: Missing product ID" },
        { status: 500 }
      );
    }

    if (!licenseKey || licenseKey.trim().length < 10) {
      console.error("ERROR: Invalid license key format");
      return NextResponse.json(
        { ok: false, error: "Please enter a valid license key" },
        { status: 400 }
      );
    }

    // Prepare request to Gumroad
    const formBody = new URLSearchParams();
    formBody.set("product_id", productId);
    formBody.set("license_key", licenseKey.trim());
    formBody.set("increment_uses_count", "false");

    console.log("4. Sending to Gumroad:");
    console.log("   - product_id:", productId);
    console.log("   - license_key:", licenseKey.trim());

    // Call Gumroad API
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const data = await response.json();
    
    console.log("5. Gumroad HTTP Status:", response.status);
    console.log("6. Gumroad Full Response:", JSON.stringify(data, null, 2));
    console.log("7. Success?", data.success);
    console.log("8. Message:", data.message);
    
    if (!data.success) {
      console.log("FAILED - Gumroad rejected the license");
      return NextResponse.json(
        { 
          ok: false, 
          error: data.message || "Invalid license key",
          gumroad: data,
          debug: {
            productId: productId,
            licenseKey: licenseKey.trim()
          }
        },
        { status: 401 }
      );
    }

    console.log("SUCCESS - License is valid!");
    return NextResponse.json({ 
      ok: true, 
      purchase: data.purchase 
    });

  } catch (error) {
    console.error("EXCEPTION:", error);
    return NextResponse.json(
      { ok: false, error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
