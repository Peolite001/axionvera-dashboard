import { useState } from "react";

interface CreateProposalModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  createProposalStatus: "idle" | "pending" | "success" | "error";
  createProposalError: string | null;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}

export default function CreateProposalModal({
  isOpen,
  isSubmitting,
  createProposalStatus,
  createProposalError,
  onClose,
  onSubmit,
}: CreateProposalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, description);
    if (createProposalStatus === "success") {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border-primary bg-background-primary p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Create Proposal</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted transition hover:bg-background-secondary hover:text-text-primary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title..."
              className="w-full rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-axion-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              rows={5}
              className="w-full resize-none rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-axion-500"
              required
            />
          </div>

          {createProposalStatus === "error" && createProposalError && (
            <p className="text-sm text-rose-400">{createProposalError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-background-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-axion-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-axion-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Create Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}