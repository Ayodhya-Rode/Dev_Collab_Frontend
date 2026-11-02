import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { describeActivity } from "../lib/activity";
import { apiMessage } from "../lib/errors";
import { ROLE_LABELS } from "../lib/roles";
import type { ActivityEntry, TaskComment } from "../types";
import { errorClass, inputClass } from "./ui";

const MAX_LENGTH = 2000;

type Tab = "comments" | "activity";

interface TaskDiscussionProps {
  taskId: string;
  archived: boolean;
  refreshKey: number;
}

export default function TaskDiscussion({
  taskId,
  archived,
  refreshKey,
}: TaskDiscussionProps) {
  const [tab, setTab] = useState<Tab>("comments");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [commentsRes, activityRes] = await Promise.all([
        api.get(`/tasks/${taskId}/comments`),
        api.get(`/tasks/${taskId}/activity`),
      ]);

      setComments(commentsRes.data.comments);
      setActivity(activityRes.data.activity);
      setLoadError("");
    } catch {
      setLoadError("Could not load the discussion");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // refreshKey changes whenever the task is edited or moved, so the history stays current
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handlePost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const comment = text.trim();
    if (!comment) return;

    setPosting(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { comment });
      setText("");
      await load();
    } catch (err) {
      toast.error(apiMessage(err, "Could not post the comment"));
    } finally {
      setPosting(false);
    }
  };

  const tabClass = (active: boolean) =>
    `border-b-2 px-3 py-2 text-sm font-medium transition hover:cursor-pointer ${
      active
        ? "border-indigo-500 text-indigo-200"
        : "border-transparent text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-800">
        <button className={tabClass(tab === "comments")} onClick={() => setTab("comments")}>
          Comments ({comments.length})
        </button>
        <button className={tabClass(tab === "activity")} onClick={() => setTab("activity")}>
          Activity
        </button>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {loadError && <p className={`${errorClass} mt-4`}>{loadError}</p>}

      {!loading && !loadError && tab === "comments" && (
        <div className="mt-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400">No comments yet.</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-200">
                    {c.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{c.user.name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {ROLE_LABELS[c.user.role]} · {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">
                      {c.comment}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {archived ? (
            <p className="mt-4 text-xs text-slate-500">
              This project is archived, so new comments are disabled.
            </p>
          ) : (
            <form onSubmit={handlePost} className="mt-5">
              <textarea
                rows={3}
                maxLength={MAX_LENGTH}
                placeholder="Write a comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={inputClass}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {text.length}/{MAX_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={posting || !text.trim()}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting ? "Posting..." : "Post comment"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!loading && !loadError && tab === "activity" && (
        <div className="mt-4">
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                  <div>
                    <p className="text-sm text-slate-200">{describeActivity(entry)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}