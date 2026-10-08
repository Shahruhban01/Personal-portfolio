import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Send,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://api.developerruhban.online";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const UploadPage = () => {
  const fileInputRef = useRef(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectFile = (candidate) => {
    if (!candidate) return;
    if (candidate.size > MAX_FILE_SIZE) {
      setStatus({ type: "error", message: "Files must be smaller than 10 MB." });
      return;
    }
    setFile(candidate);
    setStatus({ type: "idle", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() && !file) {
      setStatus({ type: "error", message: "Add some text or choose a file first." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });
    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    if (file) formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/uploads`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed.");

      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus({ type: "success", message: "Your content was uploaded successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to reach the upload API.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pb-16 pt-28 sm:pt-32">
      <motion.div
        className="mx-auto max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3 text-gray-300">
            <UploadCloud className="h-7 w-7" aria-hidden="true" />
            <span className="text-sm uppercase tracking-[0.25em] text-gray-500">
              Content intake
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Upload files and text
          </h1>
          <p className="mt-4 max-w-2xl text-gray-400">
            Add a note, attach a file, or send both together. Text is stored in
            MongoDB and files are kept in Cloudflare R2.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-gray-900/70 p-5 backdrop-blur-sm sm:p-8">
          <div>
            <label htmlFor="upload-text" className="mb-2 block text-sm font-medium text-gray-200">
              Text
            </label>
            <textarea
              id="upload-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write something to save with this upload..."
              rows={7}
              maxLength={10000}
              className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/40"
            />
            <p className="mt-2 text-right text-xs text-gray-500">{text.length}/10,000</p>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-200">File</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 px-5 py-10 text-center transition hover:border-white/50 hover:bg-white/[0.03]"
            >
              <FileUp className="mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
              <span className="text-sm text-gray-200">
                {file ? file.name : "Choose a file to upload"}
              </span>
              <span className="mt-2 text-xs text-gray-500">Maximum size: 10 MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  fileInputRef.current.value = "";
                }}
                className="mt-3 text-xs text-gray-400 underline hover:text-white"
              >
                Remove file
              </button>
            )}
          </div>

          {status.type !== "idle" && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-red-400/30 bg-red-400/10 text-red-300"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
            {isSubmitting ? "Uploading..." : "Upload content"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadPage;
