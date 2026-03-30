"use client";

import { useState } from "react";
import { addTask, toggleTask, deleteTask } from "@/app/actions/tasks";
import { Plus, Trash2, Check, ExternalLink } from "lucide-react";
import styles from "./TasksWidget.module.css";

// Note: A real app might type this properly from Prisma
type Task = {
  id: string;
  title: string;
  isGrocery: boolean;
  completed: boolean;
};

export default function TasksWidget({ initialTasks }: { initialTasks: Task[] }) {
  const [filter, setFilter] = useState<"all" | "tasks" | "groceries">("all");
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = initialTasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "tasks") return !t.isGrocery;
    return t.isGrocery;
  });

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await addTask(formData);
    setIsSubmitting(false);
    // @ts-ignore
    document.getElementById("add-task-form")?.reset();
  }

  async function handleToggle(id: string, completed: boolean) {
    setLoadingIds(prev => new Set(prev).add(id));
    await toggleTask(id, !completed);
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    setLoadingIds(prev => new Set(prev).add(id));
    await deleteTask(id);
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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
          className={`${styles.filterBtn} ${filter === "tasks" ? styles.active : ""}`}
          onClick={() => setFilter("tasks")}
        >
          Tasks
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "groceries" ? styles.active : ""}`}
          onClick={() => setFilter("groceries")}
        >
          Groceries
        </button>
      </div>

      <ul className={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <li className={styles.empty}>All caught up!</li>
        ) : null}
        {filteredTasks.map((task) => (
          <li key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ""}`}>
            <button 
              className={`${styles.checkBtn} ${task.completed ? styles.checkBtnActive : ""}`} 
              onClick={() => handleToggle(task.id, task.completed)}
              disabled={loadingIds.has(task.id)}
            >
              {task.completed && <Check size={14} strokeWidth={3} />}
            </button>
            <span className={styles.taskTitle}>{task.title}</span>
            <span className={styles.taskBadge}>{task.isGrocery ? "Grocery" : "Task"}</span>
            <button 
              className="btn-icon" 
              onClick={() => handleDelete(task.id)}
              disabled={loadingIds.has(task.id)}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <form id="add-task-form" action={handleAdd} className={styles.addForm}>
        <input 
          type="text" 
          name="title" 
          placeholder="New item..." 
          className="input-base" 
          disabled={isSubmitting}
          required 
        />
        <select name="isGrocery" className={`input-base ${styles.typeSelect}`} disabled={isSubmitting}>
          <option value="false">Task</option>
          <option value="true">Grocery</option>
        </select>
        <button type="submit" className="btn-icon" disabled={isSubmitting}>
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
}
