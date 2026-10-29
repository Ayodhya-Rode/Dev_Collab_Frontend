import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p className="mt-1 text-slate-400">
        You are signed in as {user?.role.replace("_", " ").toLowerCase()}.
      </p>

      <Link
        to="/teams"
        className="mt-6 inline-block rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
      >
        View teams
      </Link>
    </div>
  );
}