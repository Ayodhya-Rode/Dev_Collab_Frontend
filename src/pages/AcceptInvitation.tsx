import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface InvitationInfo {
  email: string;
  intendedRole: "TEAM_LEADER" | "DEVELOPER";
  teamName: string | null;
  organizationName: string;
  userExists: boolean;
}

const roleLabel = (role: InvitationInfo["intendedRole"]) =>
  role === "TEAM_LEADER" ? "Team Leader" : "Developer";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, loading: authLoading, login, logout } = useAuth();

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadingInfo(false);
      return;
    }

    api
      .get(`/invitations/${encodeURIComponent(token)}`)
      .then((res) => setInfo(res.data.invitation))
      .catch(() => setInfo(null))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const showError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      setError(err.response?.data?.message ?? fallback);
    } else {
      setError("Something went wrong");
    }
  };

  const handleCreateAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!info) return;

    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/invitations/accept-new", { token, name, password });
      await login(info.email, password);
      navigate("/", { replace: true });
    } catch (err) {
      showError(err, "Could not accept the invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptExisting = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.post("/invitations/accept", { token });
      navigate("/", { replace: true });
    } catch (err) {
      showError(err, "Could not accept the invitation");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingInfo) return <p className="p-6">Loading...</p>;

  if (!token || !info) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-sm rounded bg-white p-6 shadow">
          <h1 className="mb-2 text-xl font-bold">Invalid invitation</h1>
          <p className="mb-3 text-sm text-gray-600">
            This invitation link is invalid, expired, or has already been used.
            Ask the person who invited you to send a new one.
          </p>
          <Link to="/login" className="text-sm text-blue-600">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-sm rounded bg-white p-6 shadow">
        <h1 className="mb-2 text-2xl font-bold">You are invited</h1>
        <p className="mb-4 text-sm text-gray-600">
          <b>{info.organizationName}</b> invited you to join{" "}
          <b>{info.teamName}</b> as a <b>{roleLabel(info.intendedRole)}</b>.
        </p>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {user && user.email === info.email && (
          <button
            onClick={handleAcceptExisting}
            disabled={submitting}
            className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-50"
          >
            {submitting ? "Accepting..." : "Accept invitation"}
          </button>
        )}

        {user && user.email !== info.email && (
          <div className="text-sm">
            <p className="mb-3 text-gray-700">
              You are logged in as <b>{user.email}</b>, but this invitation is
              for <b>{info.email}</b>. Log out to continue.
            </p>
            <button
              onClick={logout}
              className="w-full rounded bg-red-500 p-2 text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}

        {!user && info.userExists && (
          <div className="text-sm">
            <p className="mb-3 text-gray-700">
              An account already exists for <b>{info.email}</b>. Log in with it,
              then open this invitation link again to accept.
            </p>
            <Link
              to="/login"
              className="block w-full rounded bg-blue-600 p-2 text-center text-white"
            >
              Go to login
            </Link>
          </div>
        )}

        {!user && !info.userExists && (
          <form onSubmit={handleCreateAccount}>
            <input
              type="email"
              value={info.email}
              readOnly
              className="mb-3 w-full rounded border bg-gray-100 p-2 text-gray-600"
            />
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full rounded border p-2"
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3 w-full rounded border p-2"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create account and join"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}