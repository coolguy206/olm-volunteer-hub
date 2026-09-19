// components/VolunteerHub.tsx - Chunk 1
"use client";

import React, { useState, useEffect } from "react";

interface SignUpSlot {
  slotId: number;
  item: string;
  comment: string;
}

interface VolunteerRecord {
  firstName: string;
  lastName: string;
  email: string;
  slots: SignUpSlot[];
}

// Global Configurations
const OLM_LAT = 37.6985;
const OLM_LON = -122.4678;
const ALLOWED_RADIUS_METERS = 150;
const IS_TESTING_MODE = false; // 🚀 Set to false before deploying live to the school campus!

export default function VolunteerHub() {
  const [email, setEmail] = useState("");
  const [volunteer, setVolunteer] = useState<VolunteerRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // UX Lifecycle and Button States
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkedInSlots, setCheckedInSlots] = useState<Record<string, boolean>>(
    {},
  );
  const [checkedOutSlots, setCheckedOutSlots] = useState<
    Record<string, boolean>
  >({});
  const [successMessage, setSuccessMessage] = useState<
    Record<string, string | null>
  >({});

  // Add this state right below your other useState properties inside VolunteerHub
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isError: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isError: false,
  });

  // A helper function to easily trigger your custom modal from anywhere
  const triggerModal = (
    title: string,
    message: string,
    isError: boolean = false,
  ) => {
    setModalConfig({ isOpen: true, title, message, isError });
  };

  // components/VolunteerHub.tsx - Chunk 2
  // Synchronizes and forces memory validation lookups
  useEffect(() => {
    const handleOnline = async () => {
      console.log("📶 Network restored! Processing offline backlog queue...");
      const backlog = localStorage.getItem("olm-offline-backlog");
      if (!backlog) return;

      try {
        const queuedItems: any[] = JSON.parse(backlog);
        if (queuedItems.length === 0) return;

        // Process each queued check-in sequentially
        for (const item of queuedItems) {
          const res = await fetch("/api/checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });

          if (res.ok) {
            // 🚀 SUCCESS: Calculate what the unique local storage key was for this slot
            // Since we know the email, slotId, and index inside the item payload:
            // Note: If you didn't pass the layout 'index' in the offline payload, we can infer it
            // By finding matching slots on screen. For safety, we can scan our active keys.

            // Let's find any keys matching this email and slotId to flip their banners live!
            Object.keys(localStorage).forEach((key) => {
              if (key.includes(`${item.email}-${item.slotId}`)) {
                const cleanKey = key
                  .replace("in-", "")
                  .replace("out-", "")
                  .replace("msg-", "");

                if (item.type === "IN") {
                  const finalMsg = "✓ Success, you're checked in!";
                  setSuccessMessage((prev) => ({
                    ...prev,
                    [cleanKey]: finalMsg,
                  }));
                  localStorage.setItem(`msg-${cleanKey}`, finalMsg);
                } else {
                  const finalMsg =
                    "⭐ That's a wrap! You're completely finished.";
                  setSuccessMessage((prev) => ({
                    ...prev,
                    [cleanKey]: finalMsg,
                  }));
                  localStorage.setItem(`msg-${cleanKey}`, finalMsg);
                }
              }
            });
          }
        }

        // Clear the backlog cache once everything is safely streamed
        localStorage.removeItem("olm-offline-backlog");
        console.log("🎉 Offline backlog successfully synced to Google Sheets!");
      } catch (err) {
        console.error(
          "Failed to clear backlog, will retry next connection cycle.",
          err,
        );
      }
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // components/VolunteerHub.tsx - Chunk 3
  // Calculates real-time distance matching radius bounds
  const verifyDistance = (userLat: number, userLon: number): boolean => {
    const R = 6371000; // Earth's Radius in meters
    const dLat = ((OLM_LAT - userLat) * Math.PI) / 180;
    const dLon = ((OLM_LON - userLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((OLM_LAT * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= ALLOWED_RADIUS_METERS;
  };

  // components/VolunteerHub.tsx - Chunk 4
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorNotice(null);

    try {
      const response = await fetch(
        `/api/slots?email=${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No sign-ups found for this email address.",
        );
      }

      setVolunteer(data);
    } catch (err: any) {
      setErrorNotice(err.message);
      setVolunteer(null);
    } finally {
      setLoading(false);
    }
  };

  // components/VolunteerHub.tsx - Chunk 5
  // 🛠️ 2. UPDATED ACTION PIPELINE: Catches network drops and queues data rows
  const handleCheckInAction = (
    slotId: number,
    slotName: string,
    type: "IN" | "OUT",
    index: number,
  ) => {
    if (!navigator.geolocation && !IS_TESTING_MODE) {
      triggerModal(
        "🚨 Device Error",
        "Your phone does not support location tracking natively. Please see David at the Admin table for a manual check-in.",
        true,
      );
      return;
    }

    const uniqueKey = `${volunteer?.email}-${slotId}-${index}`;
    setCheckingInId(uniqueKey);
    setSuccessMessage((prev) => ({ ...prev, [uniqueKey]: null }));

    const sendCheckInData = async (lat: number, lon: number) => {
      const payload = {
        email: volunteer?.email,
        slotId,
        slotName,
        type,
        lat,
        lon,
      };

      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Server rejected row");

        // Success Path (Online)
        if (type === "IN") {
          setCheckedInSlots((prev) => ({ ...prev, [uniqueKey]: true }));
          setSuccessMessage((prev) => ({
            ...prev,
            [uniqueKey]:
              "✓ Success, you're checked in! Please don't forget to check out when your shift is complete.",
          }));
          localStorage.setItem(`in-${uniqueKey}`, "true");
          localStorage.setItem(
            `msg-${uniqueKey}`,
            "✓ Success, you're checked in! Please don't forget to check out when your shift is complete.",
          );
        } else {
          setCheckedOutSlots((prev) => ({ ...prev, [uniqueKey]: true }));
          setSuccessMessage((prev) => ({
            ...prev,
            [uniqueKey]: "⭐ That's a wrap! You're completely finished.",
          }));
          localStorage.setItem(`out-${uniqueKey}`, "true");
          localStorage.setItem(
            `msg-${uniqueKey}`,
            "⭐ That's a wrap! You're completely finished.",
          );
        }
      } catch (error) {
        // 🔄 Detect explicit offline cellular network service drops vs live server faults
        if (!navigator.onLine || error instanceof TypeError) {
          console.warn(
            "⚠️ Network failure detected. Stashing check-in locally inside phone buffer.",
          );

          const existingBacklog = localStorage.getItem("olm-offline-backlog");
          const currentQueue = existingBacklog
            ? JSON.parse(existingBacklog)
            : [];
          currentQueue.push(payload);
          localStorage.setItem(
            "olm-offline-backlog",
            JSON.stringify(currentQueue),
          );

          if (type === "IN") {
            setCheckedInSlots((prev) => ({ ...prev, [uniqueKey]: true }));
            setSuccessMessage((prev) => ({
              ...prev,
              [uniqueKey]:
                "⏳ Saved Offline! Your time is secured and will sync when network returns.",
            }));
            localStorage.setItem(`in-${uniqueKey}`, "true");
            localStorage.setItem(
              `msg-${uniqueKey}`,
              "⏳ Saved Offline! Your time is secured and will sync when network returns.",
            );
          } else {
            setCheckedOutSlots((prev) => ({ ...prev, [uniqueKey]: true }));
            setSuccessMessage((prev) => ({
              ...prev,
              [uniqueKey]:
                "⏳ Finished Offline! Your checkout will sync when network returns.",
            }));
            localStorage.setItem(`out-${uniqueKey}`, "true");
            localStorage.setItem(
              `msg-${uniqueKey}`,
              "⏳ Finished Offline! Your checkout will sync when network returns.",
            );
          }
        } else {
          // 🎬 Active Internet but Server Pipeline Fault: Trigger your beautiful new custom modal!
          triggerModal(
            "⚠️ Transmission Error",
            "Failed to safely stream tracking details over the network. Please notify the administrator or verify your data rows manually.",
            true,
          );
        }
      } finally {
        setCheckingInId(null);
      }
    };

    if (IS_TESTING_MODE) {
      sendCheckInData(OLM_LAT, OLM_LON);
    } else {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (!verifyDistance(latitude, longitude)) {
            triggerModal(
              "❌ Check-In Denied",
              "You must physically be on OLM School grounds to log your time. Please go to the school grounds and try again. If you are on the school grounds and still see this message, please notify the administrator David.",
              true,
            );
            setCheckingInId(null);
            return;
          }
          await sendCheckInData(latitude, longitude);
        },
        (error) => {
          setCheckingInId(null);
          if (error.code === error.PERMISSION_DENIED) {
            triggerModal(
              "🔒 Location Blocked",
              'To secure your points, please tap the lock icon in your phone’s address URL bar, set Location Permissions to "Allow", and reload the page.',
              true,
            );
          } else {
            triggerModal(
              "📍 Coordinates Missing",
              "Unable to capture clear satellite location coordinates. Please step into an open area and try clicking again.",
              true,
            );
          }
        },
        { enableHighAccuracy: true, timeout: 7000 },
      );
    }
  };

  // components/VolunteerHub.tsx - Chunk 6
  return (
    <div className="w-full max-w-[600px] bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="text-center mb-6">
        <span className="text-[150px]">🎬</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          2026 OLM Drive In Movie Night
          <br />
          Volunteer Check-in
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Movie Night Check-in System
        </p>
      </div>

      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-6">
        <div className="flex gap-2">
          <span className="text-blue-600 font-bold">📍</span>
          <div>
            <h4 className="text-md font-bold text-blue-800 uppercase tracking-wider">
              Device Location Required
            </h4>
            <p className="text-sm text-blue-700 mt-0.5">
              Please ensure you select <strong>"Allow Location"</strong>
              <br /> when prompted to check-in when
              <br className="sm:hidden" />{" "}
              <strong className="uppercase">on school grounds</strong>.
            </p>
          </div>
        </div>
      </div>

      {errorNotice && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-100">
          ⚠️ {errorNotice}
        </div>
      )}

      {!volunteer ? (
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              SignUpGenius Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Searching Assignments..." : "Find My Slots"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-xl font-bold text-gray-900">
              Welcome, {volunteer.firstName}!
            </h3>
            <p className="text-sm text-gray-500">
              Logged in as: {volunteer.email}
            </p>
          </div>

          <div className="space-y-3">
            {volunteer.slots.map((slot, index) => {
              const uniqueKey = `${volunteer.email}-${slot.slotId}-${index}`;
              const isProcessing = checkingInId === uniqueKey;
              const hasCheckedIn = checkedInSlots[uniqueKey];
              const hasCheckedOut = checkedOutSlots[uniqueKey];
              const feedbackText = successMessage[uniqueKey];

              return (
                <div
                  key={uniqueKey}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Assigned Shift
                  </span>
                  <h4 className="font-semibold text-gray-900 text-base mt-0.5 mb-2">
                    {slot.item}
                  </h4>

                  {feedbackText && (
                    <div className="text-sm font-semibold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-md mb-3 border border-green-100 flex items-center gap-1.5">
                      ✨ {feedbackText}
                    </div>
                  )}

                  {isProcessing ? (
                    <div className="w-full bg-blue-50 text-blue-700 border border-blue-100 font-medium py-2.5 px-3 rounded-lg text-sm text-center animate-pulse flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-blue-700"
                        xmlns="http://w3.org"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing request, please wait...
                    </div>
                  ) : (
                    <div className="grid gap-2 grid-cols-2 mt-2">
                      <button
                        onClick={() =>
                          handleCheckInAction(
                            slot.slotId,
                            slot.item,
                            "IN",
                            index,
                          )
                        }
                        disabled={hasCheckedIn}
                        className={`font-medium py-2 px-3 rounded-lg text-sm transition flex items-center justify-center gap-1 ${hasCheckedIn ? "bg-green-100 text-green-700 border border-green-200 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                      >
                        {hasCheckedIn ? "✓ Checked In" : "Check In"}
                      </button>
                      <button
                        onClick={() =>
                          handleCheckInAction(
                            slot.slotId,
                            slot.item,
                            "OUT",
                            index,
                          )
                        }
                        disabled={hasCheckedOut || !hasCheckedIn}
                        className={`font-medium py-2 px-3 rounded-lg text-sm transition ${hasCheckedOut ? "bg-yellow-100 text-yellow-700 border border-yellow-200 cursor-not-allowed font-bold" : !hasCheckedIn ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-800 text-white"}`}
                      >
                        {hasCheckedOut ? "⭐ Finished" : "Check Out"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setVolunteer(null);
              setEmail("");
            }}
            className="w-full text-center text-lg text-gray-500 hover:text-gray-700 underline mt-4 block"
          >
            ← Clear and search different email
          </button>
        </div>
      )}

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-sm rounded-2xl border bg-slate-900 p-6 shadow-2xl text-center border-slate-800">
            <div className="mb-4">
              <span
                className={`text-5xl inline-block drop-shadow-lg ${modalConfig.isError ? "animate-bounce" : ""}`}
              >
                {modalConfig.isError ? "🛑" : "✨"}
              </span>
            </div>

            <h2
              className={`text-xl font-black uppercase tracking-tight ${modalConfig.isError ? "text-rose-400" : "text-amber-400"}`}
            >
              {modalConfig.title}
            </h2>

            <p className="text-sm text-slate-300 mt-3 font-medium leading-relaxed">
              {modalConfig.message}
            </p>

            <button
              onClick={() =>
                setModalConfig((prev) => ({ ...prev, isOpen: false }))
              }
              className={`w-full mt-6 py-3 px-4 font-bold text-xs uppercase tracking-widest rounded-xl transition duration-150 shadow-md ${
                modalConfig.isError
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_4px_15px_rgba(225,66,66,0.2)]"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
              }`}
            >
              Got It, Thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
