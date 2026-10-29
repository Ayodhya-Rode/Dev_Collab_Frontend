import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { buttonClass, errorClass, inputClass, labelClass, linkClass } from "../components/ui";

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/auth/register", { organizationName, name, email, password });
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Registration failed");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your organization"
      subtitle="You will be the Admin of this workspace"
    >
      {error && <p className={errorClass}>{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="organizationName" className={labelClass}>Organization name</label>
          <input
            id="organizationName"
            type="text"
            placeholder="Acme Corp"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>Your name</label>
          <input
            id="name"
            type="text"
            placeholder="Rahul Patil"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

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

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Creating..." : "Create organization"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className={linkClass}>Log in</Link>
      </p>
    </AuthLayout>
  );
}