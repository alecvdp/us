"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createNote, updateNote, renameNote, deleteNote } from "@/app/actions/notes";
import styles from "./WhiteboardWidget.module.css";
import { Save, Plus, Check, X } from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
};

export default function WhiteboardWidget({ initialNotes }: { initialNotes: Note[] }) {
  const [activeId, setActiveId] = useState(initialNotes[0]?.id ?? "");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newTitleInputRef = useRef<HTMLInputElement>(null);

  // Derive effective active ID — falls back to first note if active was deleted
  const effectiveActiveId = useMemo(() => {
    if (initialNotes.find((n) => n.id === activeId)) return activeId;
    return initialNotes[0]?.id ?? "";
  }, [initialNotes, activeId]);

  const activeNote = initialNotes.find((n) => n.id === effectiveActiveId);
  const activeContent = edits[effectiveActiveId] ?? activeNote?.content ?? "";

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  // Focus new title input when creating
  useEffect(() => {
    if (isCreating) newTitleInputRef.current?.focus();
  }, [isCreating]);

  const scheduleSave = useCallback(
    (noteId: string, content: string) => {
      if (timeoutRefs.current[noteId]) clearTimeout(timeoutRefs.current[noteId]);

      timeoutRefs.current[noteId] = setTimeout(async () => {
        setSavingIds((prev) => new Set(prev).add(noteId));
        await updateNote(noteId, content);
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
        setDirtyIds((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
        // Clear the edit overlay after successful save — server content is now current
        setEdits((prev) => {
          const next = { ...prev };
          delete next[noteId];
          return next;
        });
      }, 1000);
    },
    []
  );

  function handleContentChange(value: string) {
    setEdits((prev) => ({ ...prev, [effectiveActiveId]: value }));
    setDirtyIds((prev) => new Set(prev).add(effectiveActiveId));
    scheduleSave(effectiveActiveId, value);
  }

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    setIsCreating(false);
    setNewTitle("");
    await createNote(title);
  }

  async function handleRename(id: string) {
    const title = titleDraft.trim();
    if (!title || title === initialNotes.find((n) => n.id === id)?.title) {
      setEditingTitle(null);
      return;
    }
    setEditingTitle(null);
    await renameNote(id, title);
  }

  async function handleDelete(id: string) {
    if (initialNotes.length <= 1) return;
    if (!confirm("Delete this note?")) return;
    if (timeoutRefs.current[id]) clearTimeout(timeoutRefs.current[id]);
    // Clean up local state for deleted note
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await deleteNote(id);
  }

  const isSaving = savingIds.has(effectiveActiveId);
  const isDirty = dirtyIds.has(effectiveActiveId);

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {initialNotes.map((note) => (
            <div
              key={note.id}
              className={`${styles.tab} ${note.id === effectiveActiveId ? styles.tabActive : ""}`}
            >
              {editingTitle === note.id ? (
                <form
                  className={styles.renameForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRename(note.id);
                  }}
                >
                  <input
                    ref={titleInputRef}
                    className={styles.renameInput}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => handleRename(note.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingTitle(null);
                    }}
                  />
                </form>
              ) : (
                <button
                  className={styles.tabButton}
                  onClick={() => setActiveId(note.id)}
                  onDoubleClick={() => {
                    setEditingTitle(note.id);
                    setTitleDraft(note.title);
                  }}
                  title="Double-click to rename"
                >
                  {note.title}
                  {dirtyIds.has(note.id) && <span className={styles.dirtyDot} />}
                </button>
              )}
              {initialNotes.length > 1 && note.id === effectiveActiveId && (
                <button
                  className={`${styles.tabClose} btn-icon`}
                  onClick={() => handleDelete(note.id)}
                  title="Delete note"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {isCreating ? (
          <form
            className={styles.createForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <input
              ref={newTitleInputRef}
              className={styles.createInput}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title..."
              onBlur={() => {
                if (!newTitle.trim()) setIsCreating(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewTitle("");
                }
              }}
            />
            <button type="submit" className="btn-icon" title="Create">
              <Check size={14} />
            </button>
          </form>
        ) : (
          <button
            className={`${styles.addBtn} btn-icon`}
            onClick={() => setIsCreating(true)}
            title="New note"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div className={styles.statusHeader}>
        {isSaving ? (
          <span className={styles.savingState}>Saving...</span>
        ) : isDirty ? (
          <span className={styles.dirtyState}>Unsaved changes</span>
        ) : (
          <span className={styles.savedState}>
            <Save size={12} /> Saved
          </span>
        )}
      </div>

      {activeNote ? (
        <textarea
          className={`input-base ${styles.textarea}`}
          value={activeContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing..."
        />
      ) : (
        <p className={styles.empty}>No notes yet. Create one to get started.</p>
      )}
    </div>
  );
}
