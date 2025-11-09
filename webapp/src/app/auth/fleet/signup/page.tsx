"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function FleetSignUp() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Fleet Manager Sign Up - VW Driver Attention Platform';
  }, []);

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

    if (!formData.employeeId || !formData.department) {
      setError("Employee ID and department are required for fleet managers");
      return;
    }

    if (!/^VW-\d{4}$/.test(formData.employeeId)) {
      setError("Invalid employee ID format (expected: VW-1234)");
      return;
    }

    setLoading(true);

    try {
      const { data: existingEmployee } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("employee_id", formData.employeeId)
        .single();

      if (existingEmployee) {
        setError(`Employee ID ${formData.employeeId} is already registered`);
        setLoading(false);
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name },
        },
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
        role: "EMPLOYEE",
        employee_id: formData.employeeId,
        department: formData.department,
        camera_consent: false,
        processing_consent: false,
        analytics_consent: false,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileData);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1320] via-[#0e2433] to-[#103f5c] py-12">
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
            Volkswagen Fleet Manager Access
          </p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
              placeholder="you@volkswagen.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID (e.g., VW-1234)
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
              placeholder="VW-1234"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
              required
            >
              <option value="">Select Department</option>
              <option value="Fleet Operations">Fleet Operations</option>
              <option value="Safety & Compliance">Safety & Compliance</option>
              <option value="Logistics">Logistics</option>
              <option value="Management">Management</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
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
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026f83] text-gray-900 bg-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#026f83] hover:bg-[#015b6b] text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50"
            style={{ fontFamily: "'Rubik', 'Poppins', sans-serif" }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/fleet/signin"
            className="text-[#026f83] hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-3 text-center text-sm text-gray-600">
          Are you a driver?{" "}
          <Link
            href="/auth/driver/signup"
            className="text-[#026f83] hover:underline font-medium"
          >
            Create driver account
          </Link>
        </div>
      </div>
    </div>
  );
}
