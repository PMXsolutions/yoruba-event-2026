"use client";

import { useState, useTransition } from "react";
import { publishAnnouncement } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/Button";

export function AnnouncementForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePublish(publish: boolean) {
    startTransition(async () => {
      try {
        await publishAnnouncement({ title, content, publish });
        setMessage(publish ? "Announcement published." : "Draft saved.");
        setTitle("");
        setContent("");
      } catch {
        setMessage("Failed to save announcement.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-mahogany/8 bg-white p-6 shadow-[var(--shadow-card-light)]">
      <h3 className="font-display text-xl font-semibold text-mahogany">New announcement</h3>
      <div className="mt-4 space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-mahogany/12 px-4 py-3 font-sans text-sm outline-none focus:border-gold/40"
        />
        <textarea
          placeholder="Content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-mahogany/12 px-4 py-3 font-sans text-sm outline-none focus:border-gold/40"
        />
        <div className="flex gap-3">
          <Button type="button" disabled={isPending || !title || !content} onClick={() => handlePublish(true)}>
            Publish
          </Button>
          <button
            type="button"
            disabled={isPending || !title || !content}
            onClick={() => handlePublish(false)}
            className="rounded-full border border-mahogany/15 px-6 py-3 font-sans text-xs font-semibold uppercase text-mahogany"
          >
            Save draft
          </button>
        </div>
        {message ? <p className="font-sans text-sm text-mahogany/60">{message}</p> : null}
      </div>
    </div>
  );
}
