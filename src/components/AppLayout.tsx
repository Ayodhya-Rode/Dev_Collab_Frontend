import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLabel = {
  ADMIN: "Admin",
  TEAM_LEADER: "Team Leader",
  DEVELOPER: "Developer",
} as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-indigo-500/20 text-indigo-200"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
                DC
              </div>
              <span className="text-lg font-bold">DevCollab</span>
            </div>

            <nav className="flex gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/teams" className={navLinkClass}>
                Teams
              </NavLink>
              <NavLink to="/projects" className={navLinkClass}>
                Projects
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400">
                {user ? roleLabel[user.role] : ""}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:cursor-pointer hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
