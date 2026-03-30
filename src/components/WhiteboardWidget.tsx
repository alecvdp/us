"use client";

import { useState, useEffect, useRef } from "react";
import { updateNote } from "@/app/actions/notes";
import styles from "./WhiteboardWidget.module.css";
import { Save } from "lucide-react";

type Note = {
  id: string;
  content: string;
};

export default function WhiteboardWidget({ initialNote }: { initialNote: Note }) {
  const [content, setContent] = useState(initialNote.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save
  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      await updateNote(initialNote.id, content);
      setIsSaving(false);
      setIsDirty(false);
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, isDirty, initialNote.id]);

  return (
    <div className={styles.container}>
      <div className={styles.statusHeader}>
        {isSaving ? (
          <span className={styles.savingState}>Saving...</span>
        ) : isDirty ? (
          <span className={styles.dirtyState}>Unsaved changes</span>
        ) : (
          <span className={styles.savedState}><Save size={12} /> Saved</span>
        )}
      </div>
      <textarea
        className={`input-base ${styles.textarea}`}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsDirty(true);
        }}
        placeholder="Drop some notes here..."
      />
    </div>
  );
}
