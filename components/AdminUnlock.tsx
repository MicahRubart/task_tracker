"use client";

import { useEffect, useRef, useState } from "react";

export function AdminUnlock() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("wpt_admin");
    if (stored === "1") {
      setIsAdmin(true);
      window.dispatchEvent(new CustomEvent("wpt_admin_changed", { detail: true }));
    }
  }, []);

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showModal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem("wpt_admin", "1");
      setIsAdmin(true);
      setShowModal(false);
      setPassword("");
      window.dispatchEvent(new CustomEvent("wpt_admin_changed", { detail: true }));
    } else {
      setError("Incorrect password");
    }
  }

  function logout() {
    sessionStorage.removeItem("wpt_admin");
    setIsAdmin(false);
    window.dispatchEvent(new CustomEvent("wpt_admin_changed", { detail: false }));
  }

  return (
    <>
      <button
        onClick={() => (isAdmin ? logout() : setShowModal(true))}
        title={isAdmin ? "Admin mode active — click to lock" : "Unlock admin mode"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          isAdmin
            ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
            : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          {isAdmin ? (
            <path d="M10 2a5 5 0 00-5 5v2H4a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1v-8a1 1 0 00-1-1h-1V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3zm0 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          ) : (
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          )}
        </svg>
        {isAdmin ? "Admin" : "Admin"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden">
            <div className="bg-indigo-700 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Admin Login</h2>
              <p className="text-xs text-indigo-200 mt-0.5">Enter the admin password to unlock sort and delete controls</p>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Admin password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Unlock
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setPassword(""); setError(""); }}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
