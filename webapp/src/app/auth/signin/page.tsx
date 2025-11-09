"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // ✅ import Image for optimized loading
import { createClient } from "@/lib/supabase/client";

export default function SignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      if (profile?.role === "EMPLOYEE") {
        router.push("/fleet-management-console");
      } else {
        router.push("/driver-attention-monitor");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1320] via-[#0e2433] to-[#103f5c]">
      <div className="bg-white/95 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        {/* ✅ Logo + Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 transform hover:rotate-12 transition-transform duration-300">
            <Image
              src="/icons-removebg-preview.png"
              alt="OptiDrive Logo"
              width={80}
              height={80}
              className="mx-auto object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1
            className="text-3xl font-semibold text-gray-900"
            style={{
              fontFamily: "'Rubik', 'Poppins', sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            OptiDrive
          </h1>
          <p className="text-gray-600 mt-1 text-sm tracking-wide">
            Volkswagen Driver & Fleet Safety Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
              placeholder="you@volkswagen.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#026f83] hover:bg-[#015b6b] text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[#026f83] hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
