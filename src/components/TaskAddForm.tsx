"use client";

import { useRef, useState } from "react";
import { addTask } from "@/app/actions/tasks";
import { CalendarDays, Plus, X } from "lucide-react";
import styles from "./TasksWidget.module.css";
import {
  taskAssigneeMeta,
  taskAssigneeOrder,
  taskBucketMeta,
  taskBucketOrder,
  taskPriorityMeta,
  taskPriorityOrder,
  taskRecurrenceMeta,
  taskRecurrenceOrder,
} from "@/lib/tasks";

export default function TaskAddForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskType, setNewTaskType] = useState<"false" | "true">("false");
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addTask(formData);
      formRef.current?.reset();
      setNewTaskType("false");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {showForm ? (
        <div className={styles.addPanel}>
          <form ref={formRef} action={handleAdd} className={styles.addForm}>
            <input type="text" name="title" placeholder="What needs to be done?" className="input-base" disabled={isSubmitting} maxLength={120} required />
            <div className={styles.addRow}>
              <select name="assignee" className={`input-base ${styles.select}`} defaultValue="SHARED" disabled={isSubmitting}>
                {taskAssigneeOrder.map((a) => <option key={a} value={a}>{taskAssigneeMeta[a].label}</option>)}
              </select>
              <select name="isGrocery" className={`input-base ${styles.select}`} defaultValue="false" disabled={isSubmitting} onChange={(e) => setNewTaskType(e.target.value as "false" | "true")}>
                <option value="false">Task</option>
                <option value="true">Grocery</option>
              </select>
            </div>
            <div className={styles.addGrid}>
              <select name="priority" className={`input-base ${styles.select}`} defaultValue="MEDIUM" disabled={isSubmitting}>
                {taskPriorityOrder.map((p) => <option key={p} value={p}>{taskPriorityMeta[p].label}</option>)}
              </select>
              <select name="recurrence" className={`input-base ${styles.select}`} defaultValue="NONE" disabled={isSubmitting}>
                {taskRecurrenceOrder.map((r) => <option key={r} value={r}>{taskRecurrenceMeta[r].label}</option>)}
              </select>
              <select name="bucket" className={`input-base ${styles.select}`} defaultValue="THIS_WEEK" disabled={isSubmitting || newTaskType === "true"}>
                {taskBucketOrder.map((b) => <option key={b} value={b}>{taskBucketMeta[b].label}</option>)}
              </select>
              <div className={styles.dateField}>
                <CalendarDays size={14} />
                <input type="date" name="dueDate" className={`input-base ${styles.dateInput}`} disabled={isSubmitting} />
              </div>
              <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                <Plus size={16} /> Add
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={styles.fabRow}>
        <button type="button" className={`${styles.fab} ${showForm ? styles.fabOpen : ""}`} onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>
    </>
  );
}
