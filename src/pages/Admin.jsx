import { motion } from "framer-motion";
import {
  FileText,
  FolderOpen,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Admin = () => {
  const [token, setToken] = useState(() => sessionStorage.getItem("adminToken") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [uploads, setUploads] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadUploads = async (adminToken = token) => {
    if (!adminToken) return;
    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${API_URL}/api/admin/uploads`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const result = await response.json();
      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        setToken("");
        throw new Error("That admin token is not valid.");
      }
      if (!response.ok) throw new Error(result.message || "Could not load uploads.");
      setUploads(result.uploads);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadUploads(token);
  }, [token]);

  const signIn = (event) => {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) return;
    sessionStorage.setItem("adminToken", nextToken);
    setToken(nextToken);
    setTokenInput("");
  };

  const signOut = () => {
    sessionStorage.removeItem("adminToken");
    setToken("");
    setUploads([]);
  };

  const deleteUpload = async (id) => {
    if (!window.confirm("Delete this upload and its stored file permanently?")) {
      return;
    }

    setDeletingId(id);
    setStatus("");
    try {
      const response = await fetch(`${API_URL}/api/admin/uploads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not delete upload.");
      setUploads((currentUploads) => currentUploads.filter((item) => item._id !== id));
    } catch (error) {
      setStatus(error.message);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="min-h-screen px-4 pb-16 pt-28 sm:pt-32">
      <motion.div
        className="mx-auto max-w-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-gray-500">
              Private area
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Upload admin</h1>
            <p className="mt-3 text-gray-400">Review the latest text and files saved through the upload form.</p>
          </div>
          {token && (
            <div className="flex gap-2">
              <button onClick={() => loadUploads()} className="admin-action">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
              </button>
              <button onClick={signOut} className="admin-action">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
              </button>
            </div>
          )}
        </div>

        {!token ? (
          <form onSubmit={signIn} className="max-w-xl rounded-2xl border border-white/10 bg-gray-900/70 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <KeyRound className="h-6 w-6 text-gray-400" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Admin token</h2>
            </div>
            <label htmlFor="admin-token" className="mb-2 block text-sm text-gray-300">
              Enter the value
            </label>
            <input
              id="admin-token"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/40"
              autoComplete="current-password"
              required
            />
            <button type="submit" className="w-full rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-gray-200">
              Open admin
            </button>
            {status && <p className="mt-4 text-sm text-red-300">{status}</p>}
          </form>
        ) : (
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading uploads...
              </div>
            )}
            {!isLoading && !uploads.length && (
              <div className="rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center text-gray-400">
                No uploads yet.
              </div>
            )}
            {uploads.map((item) => (
              <article key={item._id} className="rounded-2xl border border-white/10 bg-gray-900/70 p-5 backdrop-blur-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>{formatDate(item.createdAt)}</span>
                    <span>{item._id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteUpload(item._id)}
                    disabled={deletingId === item._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-2.5 py-1.5 text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === item._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Delete
                  </button>
                </div>
                {item.text && (
                  <div className="mb-4 rounded-xl bg-black/25 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <FileText className="h-4 w-4" aria-hidden="true" /> Text
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">{item.text}</p>
                  </div>
                )}
                {item.file && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/25 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <FolderOpen className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-gray-200">{item.file.name}</p>
                        <p className="text-xs text-gray-500">{item.file.contentType} · {formatSize(item.file.size)}</p>
                      </div>
                    </div>
                    {item.file.url && (
                      <a href={item.file.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
                        View file
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
            {status && <p className="text-sm text-red-300">{status}</p>}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Admin;
