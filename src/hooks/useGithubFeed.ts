import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { apiMessage } from "../lib/errors";

export interface Feed<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  stale: boolean;
  warning: string | null;
  fetchedAt: string | null;
}

const initial = <T,>(): Feed<T> => ({
  items: [],
  loading: true,
  error: null,
  stale: false,
  warning: null,
  fetchedAt: null,
});

export function useGithubFeed<T>(
  projectId: string,
  path: "commits" | "pulls",
  field: "commits" | "pullRequests",
  enabled: boolean,
  repoKey: string,
) {
  const [feed, setFeed] = useState<Feed<T>>(initial<T>());
  const latest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latest.current;

    // Keep the old list on screen while it reloads
    setFeed((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await api.get(`/projects/${projectId}/github/${path}`);

      if (requestId !== latest.current) return;

      setFeed({
        items: res.data[field],
        loading: false,
        error: null,
        stale: !!res.data.stale,
        warning: res.data.warning ?? null,
        fetchedAt: res.data.fetchedAt ?? null,
      });
    } catch (err) {
      if (requestId !== latest.current) return;

      setFeed({
        items: [],
        loading: false,
        error: apiMessage(err, "Could not load data from GitHub"),
        stale: false,
        warning: null,
        fetchedAt: null,
      });
    }
  }, [projectId, path, field]);

  // repoKey changes when the repository is connected or changed, so the lists reload
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load, repoKey]);

  return { feed, reload: load };
}