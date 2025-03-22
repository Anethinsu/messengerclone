import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      setError("Failed to send reset email. Please check your email address.");
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Check your email
            </h2>
            <p className="text-gray-600">
              We've sent a password reset link to{" "}
              <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                try again
              </button>
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Reset your password
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter your email and we'll send you a link to reset your
                password
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              className="w-full h-12 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
            >
              Send reset link
            </Button>

            <div className="text-sm text-center text-gray-600 mt-6">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
