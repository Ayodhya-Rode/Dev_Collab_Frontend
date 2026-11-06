import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { apiMessage } from "../lib/errors";
import { githubLink } from "../lib/githubLinks";
import type { PullRequestInfo, TaskPrLink } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import { inputClass } from "./ui";

const STATE_LABELS: Record<PullRequestInfo["state"], string> = {
  open: "Open",
  merged: "Merged",
  closed: "Closed",
};

const STATE_CLASSES: Record<PullRequestInfo["state"], string> = {
  open: "bg-emerald-500/15 text-emerald-300",
  merged: "bg-violet-500/15 text-violet-300",
  closed: "bg-red-500/15 text-red-300",
};

const dangerButton =
  "rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:cursor-pointer hover:bg-red-500/10";

interface TaskPullRequestsProps {
  taskId: string;
  onChanged: () => void;
}

export default function TaskPullRequests({ taskId, onChanged }: TaskPullRequestsProps) {
  const [links, setLinks] = useState<TaskPrLink[]>([]);
  const [repository, setRepository] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<TaskPrLink | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${taskId}/pr-links`);
      setLinks(res.data.links);
      setRepository(res.data.repository);
      setCanManage(res.data.canManage);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    setAdding(true);
    try {
      await api.post(`/tasks/${taskId}/pr-links`, { pullRequest: input });
      toast.success("Pull request linked");
      setInput("");
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, "Could not link the pull request"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;

    setRemoving(true);
    try {
      await api.delete(`/tasks/${taskId}/pr-links/${removeTarget.id}`);
      toast.success("Pull request unlinked");
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, "Could not unlink the pull request"));
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  if (loading) return null;

  if (loadError) {
    return <p className="text-xs text-slate-500">Could not load pull requests.</p>;
  }

  // Nothing to show to someone who cannot link pull requests
  if (links.length === 0 && !canManage) return null;

  return (
    <div>
      <p className="text-xs text-slate-500">Pull requests</p>

      {links.length > 0 && (
        <ul className="mt-2 space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {link.info ? (
                    <>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_CLASSES[link.info.state]}`}
                      >
                        {STATE_LABELS[link.info.state]}
                      </span>
                      {link.info.draft && link.info.state === "open" && (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          Draft
                        </span>
                      )}
                    </>
                  ) : null}

                  <a
                    href={link.url ? githubLink(link.url) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    #{link.prNumber}
                    {link.info ? ` ${link.info.title}` : ""}
                  </a>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {link.info
                    ? `${link.info.authorLogin ?? "Unknown"} · `
                    : "Details unavailable right now · "}
                  linked by {link.linkedBy.name}
                </p>
              </div>

              {canManage && (
                <button onClick={() => setRemoveTarget(link)} className={dangerButton}>
                  Unlink
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && repository && (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder={`12 or https://github.com/${repository}/pull/12`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`${inputClass} flex-1`}
            aria-label="Pull request number or URL"
          />
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? "Checking..." : "Link"}
          </button>
        </form>
      )}

      {canManage && !repository && (
        <p className="mt-2 text-xs text-slate-500">
          Connect a GitHub repository in the project&apos;s GitHub section to link
          pull requests.
        </p>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        title="Unlink pull request"
        message={`Pull request #${removeTarget?.prNumber ?? ""} will be removed from this task. Nothing changes on GitHub.`}
        confirmLabel="Unlink"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => !removing && setRemoveTarget(null)}
      />
    </div>
  );
}