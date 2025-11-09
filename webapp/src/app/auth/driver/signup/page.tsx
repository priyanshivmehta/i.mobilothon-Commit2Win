"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DriverSignUp() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create user account");
        setLoading(false);
        return;
      }

      const profileData = {
        id: authData.user.id,
        name: formData.name,
        role: "USER",
        employee_id: null,
        department: null,
        camera_consent: false,
        processing_consent: false,
        analytics_consent: false,
      };

      const { error: profileError } = await supabase.from("profiles").insert(profileData);
      if (profileError) {
        setError(`Profile setup failed: ${profileError.message}`);
        setLoading(false);
        return;
      }

      router.push("/privacy-consent-setup");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1320] via-[#102a43] to-[#1a365d] py-12">
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
            OptiDrive
          </h1>
        </div>

        {/* Sign-Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] text-gray-900 bg-white"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] text-gray-900 bg-white"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] text-gray-900 bg-white"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] text-gray-900 bg-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#026f83] hover:bg-[#005f8f] text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50"
            style={{ fontFamily: "'Rubik', 'Poppins', sans-serif" }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/driver/signin" className="text-[#026f83] hover:underline font-medium">
            Sign in
          </Link>
        </div>

        <div className="mt-3 text-center text-sm text-gray-600">
          Are you a fleet manager?{" "}
          <Link href="/auth/fleet/signup" className="text-[#026f83] hover:underline font-medium">
            Create fleet account
          </Link>
        </div>
      </div>
    </div>
  );
}
