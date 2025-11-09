"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function FleetSignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Fleet Manager Sign In - VW Driver Attention Platform";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "EMPLOYEE") {
        await supabase.auth.signOut();
        setError(
          "This account is not registered as a fleet manager. Please use driver login."
        );
        setLoading(false);
        return;
      }

      router.push("/fleet-management-console");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1320] via-[#0e2433] to-[#103f5c]">
      <div className="bg-white/95 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        {/* Logo + Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 transform hover:rotate-12 transition-transform duration-300">
            <img
              src="/icons-removebg-preview.png"
              alt="OptiDrive Logo"
              className="w-20 h-20 object-contain drop-shadow-md"
            />
          </div>
          <h1
            className="text-3xl font-semibold text-gray-900"
            style={{
              fontFamily: "'Rubik', 'Poppins', sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            OptiDrive Fleet
          </h1>
          <p className="text-gray-600 mt-1 text-sm tracking-wide">
            Volkswagen Fleet Management Console
          </p>
        </div>

        {/* Sign-In Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fleet Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] focus:border-transparent text-gray-900 bg-white transition"
              placeholder="you@volkswagen.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] focus:border-transparent text-gray-900 bg-white transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#026f83] hover:bg-[#015b6b] text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Rubik', 'Poppins', sans-serif" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have fleet access?{" "}
          <Link
            href="/auth/fleet/signup"
            className="text-[#026f83] hover:underline font-medium"
          >
            Request account
          </Link>
        </div>

        <div className="mt-3 text-center text-sm text-gray-600">
          Are you a driver?{" "}
          <Link
            href="/auth/driver/signin"
            className="text-[#026f83] hover:underline font-medium"
          >
            Driver login
          </Link>
        </div>
      </div>
    </div>
  );
}
