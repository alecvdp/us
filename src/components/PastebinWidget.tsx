"use client";

import { useRef, useState } from "react";
import { addLink, deleteLink, togglePin } from "@/app/actions/links";
import { Pin, PinOff, Plus, Trash2 } from "lucide-react";
import styles from "./PastebinWidget.module.css";

type LinkItem = {
  id: string;
  url: string;
  title: string;
  isPinned: boolean;
  createdAt: Date;
};

function daysAgo(date: Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export default function PastebinWidget({ initialLinks }: { initialLinks: LinkItem[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const formatUrl = (u: string) => {
    if (!u.startsWith("http://") && !u.startsWith("https://")) return `https://${u}`;
    return u;
  };

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addLink(formData);
      formRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this link?")) {
      await deleteLink(id);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.linkGrid}>
        {initialLinks.length === 0 ? (
          <p className={styles.empty}>No links added yet.</p>
        ) : null}

        {initialLinks.map(link => (
          <div key={link.id} className={`${styles.linkCard} ${link.isPinned ? styles.pinned : ""}`}>
            <a
              href={formatUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkArea}
            >
              <span className={styles.linkTitle}>{link.title}</span>
              <span className={styles.linkUrl}>{link.url}</span>
            </a>
            <div className={styles.linkActions}>
              {!link.isPinned && (
                <span className={styles.ageLabel}>{daysAgo(link.createdAt)}</span>
              )}
              <button
                className={`${styles.pinBtn} btn-icon`}
                onClick={() => togglePin(link.id)}
                title={link.isPinned ? "Unpin" : "Pin"}
              >
                {link.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
              </button>
              <button className={`${styles.deleteBtn} btn-icon`} onClick={() => handleDelete(link.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form ref={formRef} action={handleAdd} className={styles.addForm}>
        <input type="text" name="title" placeholder="Title" className="input-base" required />
        <input type="text" name="url" placeholder="URL (e.g. google.com)" className="input-base" required />
        <input type="hidden" name="isPinned" value="false" />
        <button type="submit" className={`${styles.addBtn} btn-icon`} disabled={isSubmitting}>
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}
