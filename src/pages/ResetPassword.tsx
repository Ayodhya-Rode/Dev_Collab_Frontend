import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import AuthLayout from "../components/AuthLayout";
import {
  buttonClass,
  errorClass,
  inputClass,
  labelClass,
  linkClass,
  successClass,
} from "../components/ui";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => navigate("/login", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [message, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/reset-password", { token, newPassword });
      setMessage(res.data.message);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Reset failed");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is not valid.">
        <p className={errorClass}>The reset link is missing its token.</p>
        <Link to="/forgot-password" className={linkClass}>
          Request a new reset link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you have not used before."
    >
      {error && <p className={errorClass}>{error}</p>}
      {message && (
        <p className={successClass}>{message}. Redirecting to login...</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className={labelClass}>
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={submitting || !!message} className={buttonClass}>
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className={linkClass}>
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}