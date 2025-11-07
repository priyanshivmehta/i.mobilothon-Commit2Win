"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "USER" | "EMPLOYEE";

export default function SignUp() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER" as Role,
    employeeId: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.role === "EMPLOYEE") {
      if (!formData.employeeId || !formData.department) {
        setError("Employee ID and department required for employee accounts");
        return;
      }

      if (!/^VW-\d{4}$/.test(formData.employeeId)) {
        setError("Invalid employee ID format (expected: VW-1234)");
        return;
      }
    }

    setLoading(true);

    try {
      console.log("Step 1: Checking for duplicate employee ID...");
      
      // Step 1: Check for duplicate employee ID first
      if (formData.role === "EMPLOYEE" && formData.employeeId) {
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
      }

      console.log("Step 2: Creating auth user...");

      // Step 2: Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create user account");
        setLoading(false);
        return;
      }

      console.log("Step 3: Auth user created:", authData.user.id);
      console.log("Step 4: Creating profile...");

      // Step 3: Insert profile
      const profileData = {
        id: authData.user.id,
        name: formData.name,
        role: formData.role,
        employee_id: formData.role === "EMPLOYEE" ? formData.employeeId : null,
        department: formData.role === "EMPLOYEE" ? formData.department : null,
        camera_consent: false,
        processing_consent: false,
        analytics_consent: false,
      };

      console.log("Profile data:", profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error("Profile creation error:", {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        setError(`Profile setup failed: ${profileError.message}`);
        setLoading(false);
        return;
      }

      console.log("Step 5: Profile created successfully:", profileResult);

      // Step 4: Redirect to privacy consent
      router.push("/privacy-consent-setup");
      router.refresh();
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during signup");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join Volkswagen Safety Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="USER">Driver</option>
              <option value="EMPLOYEE">Fleet Manager (Employee)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          {formData.role === "EMPLOYEE" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID (e.g., VW-1234)
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="VW-1234"
                  required={formData.role === "EMPLOYEE"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required={formData.role === "EMPLOYEE"}
                >
                  <option value="">Select Department</option>
                  <option value="Fleet Operations">Fleet Operations</option>
                  <option value="Safety & Compliance">Safety & Compliance</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
