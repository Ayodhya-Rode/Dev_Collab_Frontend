import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Request failed");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a reset link"
    >
      {error && <p className={errorClass}>{error}</p>}
      {message && <p className={successClass}>{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className={linkClass}>Back to login</Link>
      </p>
    </AuthLayout>
  );
}