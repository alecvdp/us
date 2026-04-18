"use client";

import {
  CalendarDays,
  Check,
  Flag,
  Pencil,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import styles from "./TasksWidget.module.css";
import {
  daysUntilCalendarDate,
  formatCalendarDateForInput,
} from "@/lib/dates";
import {
  taskAssigneeMeta,
  taskAssigneeOrder,
  taskBucketMeta,
  taskBucketOrder,
  taskPriorityMeta,
  taskPriorityOrder,
  taskRecurrenceMeta,
  taskRecurrenceOrder,
  type TaskAssignee,
  type TaskBucket,
  type TaskPriority,
  type TaskRecurrence,
} from "@/lib/tasks";
import type { Task } from "./TasksWidget";

function formatResetLabel(date: Task["nextResetAt"]) {
  if (!date) return null;
  const diffDays = daysUntilCalendarDate(date);
  if (diffDays <= 0) return "Resets today";
  if (diffDays === 1) return "Resets tomorrow";
  return `Resets ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date))}`;
}

function getDueLabel(date: Task["dueDate"]) {
  if (!date) return null;
  const diff = daysUntilCalendarDate(date);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, isUrgent: true };
  if (diff === 0) return { text: "today", isUrgent: true };
  if (diff === 1) return { text: "tomorrow", isUrgent: false };
  return { text: `${diff}d left`, isUrgent: false };
}

type TaskRowProps = {
  task: Task;
  isBusy: boolean;
  isEditing: boolean;
  editState: {
    title: string;
    assignee: TaskAssignee;
    priority: TaskPriority;
    bucket: TaskBucket;
    recurrence: TaskRecurrence;
    dueDate: string;
    isGrocery: boolean;
  };
  onToggle: (id: string, completed: boolean) => void;
  onStartEdit: (task: Task) => void;
  onCancelEdit: () => void;
  onSaveEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEditChange: (field: string, value: string | boolean) => void;
};

export default function TaskRow({
  task,
  isBusy,
  isEditing,
  editState,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditChange,
}: TaskRowProps) {
  const dueInfo = getDueLabel(task.dueDate);
  const resetLabel = task.completed ? formatResetLabel(task.nextResetAt) : null;

  if (isEditing) {
    return (
      <li className={styles.taskRow}>
        <div className={styles.editCard}>
          <input
            type="text"
            value={editState.title}
            onChange={(e) => onEditChange("title", e.target.value)}
            className="input-base"
            placeholder="Task title"
            maxLength={120}
          />
          <div className={styles.editGrid}>
            <select
              className={`input-base ${styles.select}`}
              value={editState.assignee}
              onChange={(e) => onEditChange("assignee", e.target.value)}
            >
              {taskAssigneeOrder.map((v) => (
                <option key={v} value={v}>{taskAssigneeMeta[v].label}</option>
              ))}
            </select>
            <select
              className={`input-base ${styles.select}`}
              value={editState.priority}
              onChange={(e) => onEditChange("priority", e.target.value)}
            >
              {taskPriorityOrder.map((v) => (
                <option key={v} value={v}>{taskPriorityMeta[v].label}</option>
              ))}
            </select>
            <select
              className={`input-base ${styles.select}`}
              value={editState.isGrocery ? "true" : "false"}
              onChange={(e) => onEditChange("isGrocery", e.target.value === "true")}
            >
              <option value="false">Task</option>
              <option value="true">Grocery</option>
            </select>
            <select
              className={`input-base ${styles.select}`}
              value={editState.bucket}
              disabled={editState.isGrocery}
              onChange={(e) => onEditChange("bucket", e.target.value)}
            >
              {taskBucketOrder.map((v) => (
                <option key={v} value={v}>{taskBucketMeta[v].label}</option>
              ))}
            </select>
            <select
              className={`input-base ${styles.select}`}
              value={editState.recurrence}
              onChange={(e) => onEditChange("recurrence", e.target.value)}
            >
              {taskRecurrenceOrder.map((v) => (
                <option key={v} value={v}>{taskRecurrenceMeta[v].label}</option>
              ))}
            </select>
            <div className={styles.dateField}>
              <CalendarDays size={14} />
              <input
                type="date"
                value={editState.dueDate}
                className={`input-base ${styles.dateInput}`}
                onChange={(e) => onEditChange("dueDate", e.target.value)}
              />
            </div>
          </div>
          <div className={styles.editActions}>
            <button type="button" className={styles.secondaryBtn} onClick={onCancelEdit} disabled={isBusy}>
              <X size={14} /> Cancel
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => onSaveEdit(task.id)} disabled={isBusy || !editState.title.trim()}>
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`${styles.taskRow} ${task.completed ? styles.completed : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <button
        type="button"
        className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
        onClick={() => onToggle(task.id, task.completed)}
        disabled={isBusy}
      >
        {task.completed ? <Check size={13} strokeWidth={3} /> : null}
      </button>

      <div className={styles.taskBody}>
        <span className={styles.taskTitle}>{task.title}</span>
        <span className={styles.taskSubtitle}>
          {taskAssigneeMeta[task.assignee].label}
          {resetLabel ? ` \u00b7 ${resetLabel}` : ""}
        </span>
      </div>

      <div className={styles.taskMeta}>
        {task.priority !== "MEDIUM" ? (
          <span className={`${styles.priorityDot} ${styles[taskPriorityMeta[task.priority].className]}`} />
        ) : null}
        {task.recurrence !== "NONE" ? (
          <span className={styles.inlineIcon} title={taskRecurrenceMeta[task.recurrence].label}>
            <Repeat size={13} />
          </span>
        ) : null}
        {dueInfo ? (
          <span className={`${styles.dueLabel} ${dueInfo.isUrgent ? styles.dueToday : ""}`}>
            <Flag size={12} />
            {dueInfo.text}
          </span>
        ) : null}
      </div>

      <div className={styles.taskActions}>
        <button type="button" className="btn-icon" onClick={() => onStartEdit(task)} disabled={isBusy}>
          <Pencil size={14} />
        </button>
        <button type="button" className="btn-icon" onClick={() => onDelete(task.id)} disabled={isBusy}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

export { formatCalendarDateForInput };
