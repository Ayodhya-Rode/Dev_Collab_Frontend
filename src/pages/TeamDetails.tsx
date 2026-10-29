import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import type { PendingInvitation, TeamDetail } from "../types";
import {
  buttonClass,
  errorClass,
  inputClass,
  labelClass,
} from "../components/ui";

const apiMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError(err)
    ? (err.response?.data?.message ?? fallback)
    : "Something went wrong";

const smallButton =
  "rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:cursor-pointer hover:bg-slate-800";

const dangerButton =
  "rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:cursor-pointer hover:bg-red-500/10";

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data.team);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadInvitations = useCallback(async () => {
    if (role !== "ADMIN" && role !== "TEAM_LEADER") return;

    try {
      const res = await api.get("/invitations");
      const all = res.data.invitations as PendingInvitation[];
      setInvitations(all.filter((inv) => inv.team?.id === id));
    } catch {
      setInvitations([]);
    }
  }, [id, role]);

  useEffect(() => {
    loadTeam();
    loadInvitations();
  }, [loadTeam, loadInvitations]);

  if (loading) return <p className="text-slate-400">Loading...</p>;

  if (notFound || !team) {
    return (
      <div>
        <p className={errorClass}>Team not found.</p>
        <Link to="/teams" className="text-sm text-indigo-300 hover:text-indigo-200">
          Back to teams
        </Link>
      </div>
    );
  }

  const isAdmin = role === "ADMIN";
  const isLeaderOfTeam = role === "TEAM_LEADER" && team.teamLeaderId === user?.id;
  const canManage = isAdmin || isLeaderOfTeam;
  const teamIsActive = team.status === "ACTIVE";

  const canInviteLeader = isAdmin && !team.teamLeaderId && teamIsActive;
  const canInviteDeveloper = isLeaderOfTeam && teamIsActive;
  const canInvite = canInviteLeader || canInviteDeveloper;

  const runConfirm = async () => {
    if (!confirm) return;

    setConfirming(true);
    try {
      await confirm.onConfirm();
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  };

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setInviting(true);
    try {
      await api.post("/invitations", { email: inviteEmail, teamId: team.id });
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      await loadInvitations();
    } catch (err) {
      toast.error(apiMessage(err, "Could not send the invitation"));
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = (invitationId: string, email: string) => {
    setConfirm({
      title: "Revoke invitation",
      message: `The link sent to ${email} will stop working.`,
      confirmLabel: "Revoke",
      onConfirm: async () => {
        try {
          await api.delete(`/invitations/${invitationId}`);
          toast.success("Invitation revoked");
          await loadInvitations();
        } catch (err) {
          toast.error(apiMessage(err, "Could not revoke the invitation"));
        }
      },
    });
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setConfirm({
      title: "Remove member",
      message: `Remove ${memberName} from this team? They can be invited again later.`,
      confirmLabel: "Remove",
      onConfirm: async () => {
        try {
          await api.delete(`/teams/${team.id}/members/${memberId}`);
          toast.success(`${memberName} was removed from the team`);
          await loadTeam();
        } catch (err) {
          toast.error(apiMessage(err, "Could not remove the member"));
        }
      },
    });
  };

  const handleRemoveLeader = () => {
    setConfirm({
      title: "Remove Team Leader",
      message: "This team will have no leader until you invite a new one.",
      confirmLabel: "Remove leader",
      onConfirm: async () => {
        try {
          await api.patch(`/teams/${team.id}/leader`, { teamLeaderId: null });
          toast.success("Team Leader removed");
          await loadTeam();
        } catch (err) {
          toast.error(apiMessage(err, "Could not remove the leader"));
        }
      },
    });
  };

  const startEdit = () => {
    setEditName(team.name);
    setEditDescription(team.description ?? "");
    setEditStatus(team.status);
    setEditing(true);
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editName.trim()) {
      toast.error("Team name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/teams/${team.id}`, {
        name: editName,
        description: editDescription,
        status: editStatus,
      });
      setEditing(false);
      toast.success("Team updated");
      await loadTeam();
    } catch (err) {
      toast.error(apiMessage(err, "Could not update the team"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/teams" className="text-sm text-indigo-300 hover:text-indigo-200">
        &larr; Back to teams
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        {!editing ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{team.name}</h1>
                {!teamIsActive && (
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    Inactive
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {team.description || "No description"}
              </p>
            </div>

            {isAdmin && (
              <button onClick={startEdit} className={smallButton}>
                Edit team
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label htmlFor="editName" className={labelClass}>Team name</label>
              <input
                id="editName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="editDescription" className={labelClass}>Description</label>
              <textarea
                id="editDescription"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="editStatus" className={labelClass}>Status</label>
              <select
                id="editStatus"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                className={inputClass}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={`${buttonClass} !w-auto`}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className={smallButton}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Team Leader */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Team Leader</h2>
          {isAdmin && team.teamLeader && (
            <button onClick={handleRemoveLeader} className={dangerButton}>
              Remove leader
            </button>
          )}
        </div>

        {team.teamLeader ? (
          <div className="mt-3">
            <p className="text-sm font-medium">{team.teamLeader.name}</p>
            <p className="text-sm text-slate-400">{team.teamLeader.email}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No Team Leader assigned yet.
            {isAdmin && teamIsActive && " Invite one below."}
          </p>
        )}
      </div>

      {/* Invite */}
      {canInvite && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">
            {canInviteLeader ? "Invite a Team Leader" : "Invite a Developer"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            They will get an email with a link that works once and expires in 24 hours.
          </p>

          <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="person@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={`${inputClass} sm:flex-1`}
            />
            <button type="submit" disabled={inviting} className={`${buttonClass} sm:!w-auto`}>
              {inviting ? "Sending..." : "Send invitation"}
            </button>
          </form>
        </div>
      )}

      {isAdmin && team.teamLeaderId && teamIsActive && (
        <p className="text-sm text-slate-400">
          This team already has a Team Leader. Remove the leader to invite a new one.
        </p>
      )}

      {/* Pending invitations */}
      {canManage && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">Pending invitations</h2>

          {invitations.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No pending invitations.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-800">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-slate-400">
                      {inv.intendedRole === "TEAM_LEADER" ? "Team Leader" : "Developer"} ·
                      invited by {inv.invitedBy.name} · expires{" "}
                      {new Date(inv.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id, inv.email)}
                    className={dangerButton}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="font-semibold">Members ({team.members.length})</h2>

        {team.members.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No developers in this team yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-800">
            {team.members.map((m) => (
              <li key={m.user.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-slate-400">
                    {m.user.email} · joined {new Date(m.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                    className={dangerButton}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.confirmLabel}
        loading={confirming}
        onConfirm={runConfirm}
        onCancel={() => !confirming && setConfirm(null)}
      />
    </div>
  );
}