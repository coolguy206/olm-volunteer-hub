import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, slotId, slotName, type, lat, lon } = body;

    // Validate incoming parameters
    if (!email || !slotId || !type) {
      return NextResponse.json(
        { error: "Missing required parameters." },
        { status: 400 },
      );
    }

    const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEETS_URL;

    if (!GOOGLE_SHEET_WEBHOOK_URL || GOOGLE_SHEET_WEBHOOK_URL === "undefined") {
      console.error(
        "🔴 ERROR: GOOGLE_SHEETS_URL environment variable is missing!",
      );
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    // Forward the tracking data straight to Google Sheets
    // app/api/checkin/route.ts

    // Forward the tracking data straight to Google Sheets
    const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      redirect: "follow", // Ensures Node.js follows Google's 302 redirect tracking url
      body: JSON.stringify({ email, slotId, slotName, type, lat, lon }),
    });

    // 🚀 FIXED: If Google returns a healthy 200 status code, the row was written successfully!
    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error("Google Sheet returned a failure response code.");
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Google Sheets POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Check-in logging failure" },
      { status: 500 },
    );
  }
}
