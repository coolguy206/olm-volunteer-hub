import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter is required." },
      { status: 400 },
    );
  }

  const SIGNUP_ID = "64521423";
  const API_KEY = process.env.SIGNUPGENIUS_API_KEY;

  if (!API_KEY || API_KEY === 'undefined') {
    console.error("🔴 ERROR: SIGNUPGENIUS_API_KEY is not being read by Next.js!");
    return NextResponse.json({ 
      error: "Configuration Error", 
      details: "The server's API Key environment variable is missing. Check your .env.local file placement." 
    }, { status: 500 });
  }

  try {
    const targetUrl = `https://api.signupgenius.com/v2/k/signups/report/filled/${SIGNUP_ID}/?user_key=${API_KEY}`;

    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SignUpGenius API returned status ${response.status}`);
    }

    const jsonPayload = await response.json();

    // 1. Safely extract the raw list of signups, accommodating any object nesting styles
    let rawRosterArray: any[] = [];
    if (Array.isArray(jsonPayload.data)) {
      rawRosterArray = jsonPayload.data;
    } else if (jsonPayload.data && Array.isArray(jsonPayload.data.signup)) {
      rawRosterArray = jsonPayload.data.signup;
    }

    // 2. Filter the master roster to match the parent's input email
    const matchingSlots = rawRosterArray.filter(
      (record: any) => record.email?.toLowerCase() === email.toLowerCase()
    );

    if (matchingSlots.length === 0) {
      return NextResponse.json(
        { error: 'No assignments found for this email address.' }, 
        { status: 404 }
      );
    }

    // 3. Grab the first entry safely to extract name data strings
    const firstRecord = matchingSlots[0] || {};

    const volunteerRecord = {
      firstName: firstRecord.firstname || 'Volunteer',
      lastName: firstRecord.lastname || '',
      email: email,
      // 4. Flatten and map entries, guaranteeing a valid array for .map() in React
      slots: matchingSlots.map((slot: any) => ({
        slotId: slot.signupid || slot.slotitemid || Math.random(), 
        item: slot.item || slot.itemtitle || 'Volunteer Assignment',
        comment: slot.comment || '', 
      }))
    };

    return NextResponse.json(volunteerRecord);

  } catch (error: any) {
    console.error("SignUpGenius Query Error:", error);
    return NextResponse.json(
      { error: "Fetch connection failed.", details: error.message },
      { status: 500 },
    );
  }
}
