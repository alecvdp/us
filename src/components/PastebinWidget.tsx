"use client";

import { useState } from "react";
import { addLink, deleteLink } from "@/app/actions/links";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import styles from "./PastebinWidget.module.css";

type LinkItem = {
  id: string;
  url: string;
  title: string;
  isStatic: boolean;
};

export default function PastebinWidget({ initialLinks }: { initialLinks: LinkItem[] }) {
  const [filter, setFilter] = useState<"all" | "static" | "living">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-format links to add https:// if missing
  const formatUrl = (u: string) => {
    if (!u.startsWith("http://") && !u.startsWith("https://")) return `https://${u}`;
    return u;
  };

  const filteredLinks = initialLinks.filter(l => {
    if (filter === "all") return true;
    if (filter === "static") return l.isStatic;
    return !l.isStatic;
  });

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await addLink(formData);
    setIsSubmitting(false);
    // @ts-ignore
    document.getElementById("add-link-form")?.reset();
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this link?")) {
      await deleteLink(id);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "living" ? styles.active : ""}`}
          onClick={() => setFilter("living")}
        >
          Living
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "static" ? styles.active : ""}`}
          onClick={() => setFilter("static")}
        >
          Static
        </button>
      </div>

      <div className={styles.linkGrid}>
        {filteredLinks.length === 0 ? (
          <p className={styles.empty}>No links added yet.</p>
        ) : null}
        
        {filteredLinks.map(link => (
          <div key={link.id} className={styles.linkCard}>
            <a 
              href={formatUrl(link.url)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.linkArea}
            >
              <span className={styles.linkTitle}>{link.title}</span>
              <span className={styles.linkUrl}>{link.url}</span>
              <span className={styles.badge}>{link.isStatic ? "Static" : "Living"}</span>
            </a>
            <button className={`${styles.deleteBtn} btn-icon`} onClick={() => handleDelete(link.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form id="add-link-form" action={handleAdd} className={styles.addForm}>
        <input type="text" name="title" placeholder="Title/Name" className="input-base" required />
        <input type="text" name="url" placeholder="URL (e.g. google.com)" className="input-base" required />
        <select name="isStatic" className={`input-base ${styles.typeSelect}`}>
          <option value="false">Living</option>
          <option value="true">Static (Important)</option>
        </select>
        <button type="submit" className="btn-icon">
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
}
