import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useGithubFeed } from "../hooks/useGithubFeed";
import type { Feed } from "../hooks/useGithubFeed";
import { apiMessage } from "../lib/errors";
import { avatarSrc, githubLink } from "../lib/githubLinks";
import { timeAgo } from "../lib/time";
import type { GithubCommit, GithubConnection, GithubPullRequest } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import { buttonClass, errorClass, inputClass, labelClass } from "./ui";

const smallButton =
  "rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:cursor-pointer hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

const dangerButton =
  "rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:cursor-pointer hover:bg-red-500/10";

function Avatar({ src, name }: { src: string | null; name: string }) {
  const safe = avatarSrc(src);

  return safe ? (
    <img src={safe} alt="" className="h-8 w-8 shrink-0 rounded-full" />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
      {name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

interface FeedBoxProps<T> {
  title: string;
  feed: Feed<T>;
  emptyText: string;
  children: React.ReactNode;
}

function FeedBox<T>({ title, feed, emptyText, children }: FeedBoxProps<T>) {
  const showEmpty = !feed.loading && !feed.error && feed.items.length === 0;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {!feed.error && (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {feed.items.length}
          </span>
        )}
      </div>

      {feed.warning && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Showing saved data. {feed.warning}
        </p>
      )}

      {feed.loading && feed.items.length === 0 && !feed.error && (
        <p className="mt-3 text-sm text-slate-400">Loading from GitHub...</p>
      )}

      {feed.error && <p className={`${errorClass} mt-3`}>{feed.error}</p>}

      {showEmpty && <p className="mt-3 text-sm text-slate-400">{emptyText}</p>}

      {feed.items.length > 0 && <ul className="mt-3 space-y-3">{children}</ul>}
    </div>
  );
}

export default function GitHubPanel({ projectId }: { projectId: string }) {
  const [connection, setConnection] = useState<GithubConnection | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadConnection = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/github`);
      setConnection(res.data.connection);
      setCanManage(res.data.canManage);
      setLoadError("");
    } catch {
      setLoadError("Could not load the GitHub connection");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  const repoKey = connection ? `${connection.repoOwner}/${connection.repoName}` : "";

  const commits = useGithubFeed<GithubCommit>(
    projectId,
    "commits",
    "commits",
    !!connection,
    repoKey,
  );

  const pulls = useGithubFeed<GithubPullRequest>(
    projectId,
    "pulls",
    "pullRequests",
    !!connection,
    repoKey,
  );

  const refreshing = commits.feed.loading || pulls.feed.loading;

  const handleConnect = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!repoInput.trim()) {
      setFormError("Enter the repository as owner/name or a GitHub URL");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/projects/${projectId}/github`, {
        repository: repoInput,
      });

      setConnection(res.data.connection);
      setRepoInput("");
      setEditing(false);
      toast.success("Repository connected");
    } catch (err) {
      setFormError(apiMessage(err, "Could not connect the repository"));
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.delete(`/projects/${projectId}/github`);
      setConnection(null);
      setConfirmDisconnect(false);
      toast.success("Repository disconnected");
    } catch (err) {
      toast.error(apiMessage(err, "Could not disconnect the repository"));
    } finally {
      setDisconnecting(false);
    }
  };

  const showForm = canManage && (!connection || editing);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">GitHub</h2>

          {connection ? (
            <p className="mt-1 text-sm text-slate-400">
              <a
                href={githubLink(connection.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-300 hover:text-indigo-200"
              >
                {connection.repoOwner}/{connection.repoName}
              </a>
              <span className="ml-2 text-xs text-slate-500">
                branch {connection.defaultBranch}
                {connection.connectedBy && ` · connected by ${connection.connectedBy.name}`}
              </span>
            </p>
          ) : (
            !loading && (
              <p className="mt-1 text-xs text-slate-400">
                Read-only view of a public repository: recent commits and open pull
                requests.
              </p>
            )
          )}
        </div>

        {connection && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                commits.reload();
                pulls.reload();
              }}
              disabled={refreshing}
              className={smallButton}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            {canManage && !editing && (
              <>
                <button onClick={() => setEditing(true)} className={smallButton}>
                  Change
                </button>
                <button onClick={() => setConfirmDisconnect(true)} className={dangerButton}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {loadError && <p className={`${errorClass} mt-4`}>{loadError}</p>}

      {showForm && (
        <form onSubmit={handleConnect} className="mt-4 max-w-xl space-y-3">
          {formError && <p className={errorClass}>{formError}</p>}

          <div>
            <label htmlFor="repository" className={labelClass}>Repository</label>
            <input
              id="repository"
              type="text"
              placeholder="owner/name or https://github.com/owner/name"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              className={inputClass}
            />
          </div>

          {connection && (
            <p className="text-xs text-slate-500">
              Changing the repository removes the pull request links of this
              project&apos;s tasks.
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className={`${buttonClass} !w-auto`}>
              {saving ? "Checking with GitHub..." : connection ? "Save repository" : "Connect repository"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormError("");
                  setRepoInput("");
                }}
                className={smallButton}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!loading && !loadError && !connection && !canManage && (
        <p className="mt-4 text-sm text-slate-400">
          No repository is connected to this project.
        </p>
      )}

      {connection && (
        <>
          {commits.feed.fetchedAt && (
            <p className="mt-3 text-xs text-slate-500">
              Updated {timeAgo(commits.feed.fetchedAt)}
            </p>
          )}

          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <FeedBox
              title="Recent commits"
              feed={commits.feed}
              emptyText="No commits yet."
            >
              {commits.feed.items.map((c) => (
                <li key={c.sha} className="flex gap-3">
                  <Avatar src={c.authorAvatar} name={c.authorName ?? c.authorLogin ?? "?"} />
                  <div className="min-w-0">
                    <a
                      href={githubLink(c.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium text-slate-100 hover:text-indigo-200"
                      title={c.message}
                    >
                      {c.message || "(no message)"}
                    </a>
                    <p className="text-xs text-slate-500">
                      {c.authorName ?? c.authorLogin ?? "Unknown"} ·{" "}
                      <span className="font-mono">{c.shortSha}</span>
                      {c.committedAt && ` · ${timeAgo(c.committedAt)}`}
                    </p>
                  </div>
                </li>
              ))}
            </FeedBox>

            <FeedBox
              title="Open pull requests"
              feed={pulls.feed}
              emptyText="No open pull requests."
            >
              {pulls.feed.items.map((p) => (
                <li key={p.number} className="flex gap-3">
                  <Avatar src={p.authorAvatar} name={p.authorLogin ?? "?"} />
                  <div className="min-w-0">
                    <a
                      href={githubLink(p.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium text-slate-100 hover:text-indigo-200"
                      title={p.title}
                    >
                      #{p.number} {p.title}
                    </a>
                    <p className="text-xs text-slate-500">
                      {p.draft && (
                        <span className="mr-2 rounded-full bg-slate-700 px-2 py-0.5 text-slate-300">
                          Draft
                        </span>
                      )}
                      {p.authorLogin ?? "Unknown"} · {p.branch} → {p.base} ·
                      updated {timeAgo(p.updatedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </FeedBox>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect repository"
        message="The repository link and the pull request links of this project's tasks will be removed. Nothing changes on GitHub."
        confirmLabel="Disconnect"
        loading={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => !disconnecting && setConfirmDisconnect(false)}
      />
    </div>
  );
}