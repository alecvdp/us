"use client";

import { useOptimistic, useMemo, useRef, useState, useTransition } from "react";
import { addTask, deleteTask, moveTask, toggleTask, updateTask } from "@/app/actions/tasks";
import {
  Archive,
  CalendarDays,
  Check,
  Flag,
  Pencil,
  Plus,
  Repeat,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
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
  taskSectionMeta,
  taskSectionOrder,
  type TaskAssignee,
  type TaskBucket,
  type TaskPriority,
  type TaskRecurrence,
  type TaskSection,
} from "@/lib/tasks";

type Task = {
  id: string;
  title: string;
  assignee: TaskAssignee;
  priority: TaskPriority;
  bucket: TaskBucket;
  recurrence: TaskRecurrence;
  dueDate: Date | string | null;
  lastCompletedAt?: Date | string | null;
  nextResetAt?: Date | string | null;
  isGrocery: boolean;
  completed: boolean;
};

function getTaskSection(task: Task): TaskSection {
  if (task.isGrocery) return "GROCERIES";
  return task.bucket;
}

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

const sectionIcons: Record<TaskSection, React.ReactNode> = {
  TODAY: <Star size={16} />,
  THIS_WEEK: <CalendarDays size={16} />,
  RECURRING: <Repeat size={16} />,
  LATER: <Archive size={16} />,
  GROCERIES: <ShoppingCart size={16} />,
};

export default function TasksWidget({ initialTasks }: { initialTasks: Task[] }) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state: Task[], update: { id: string; completed: boolean }) =>
      state.map((t) => (t.id === update.id ? { ...t, completed: update.completed } : t))
  );
  const [, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<"open" | "completed" | "all">("open");
  const [typeFilter, setTypeFilter] = useState<"all" | "tasks" | "groceries">("all");
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingAssignee, setEditingAssignee] = useState<TaskAssignee>("SHARED");
  const [editingPriority, setEditingPriority] = useState<TaskPriority>("MEDIUM");
  const [editingBucket, setEditingBucket] = useState<TaskBucket>("THIS_WEEK");
  const [editingRecurrence, setEditingRecurrence] = useState<TaskRecurrence>("NONE");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingIsGrocery, setEditingIsGrocery] = useState(false);
  const [newTaskType, setNewTaskType] = useState<"false" | "true">("false");
  const [showAddForm, setShowAddForm] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);

  const filteredTasks = useMemo(
    () =>
      optimisticTasks.filter((task) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "open" ? !task.completed : task.completed);
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "tasks" ? !task.isGrocery : task.isGrocery);
        return matchesStatus && matchesType;
      }),
    [optimisticTasks, statusFilter, typeFilter],
  );

  const sectionedTasks = useMemo(
    () =>
      taskSectionOrder
        .map((section) => ({
          section,
          tasks: filteredTasks.filter((task) => getTaskSection(task) === section),
        }))
        .filter(({ tasks }) => tasks.length > 0),
    [filteredTasks],
  );

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addTask(formData);
      addFormRef.current?.reset();
      setNewTaskType("false");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggle(id: string, completed: boolean) {
    startTransition(async () => {
      setOptimisticTasks({ id, completed: !completed });
      await toggleTask(id, !completed);
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setLoadingIds((prev) => new Set(prev).add(deleteTarget));
    try {
      await deleteTask(deleteTarget);
      if (editingTaskId === deleteTarget) setEditingTaskId(null);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget!);
        return next;
      });
      setDeleteTarget(null);
    }
  }

  async function handleMove(task: Task, section: TaskSection) {
    setLoadingIds((prev) => new Set(prev).add(task.id));
    try {
      await moveTask(task.id, { assignee: task.assignee, section });
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      setDragTarget(null);
    }
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingAssignee(task.assignee);
    setEditingPriority(task.priority);
    setEditingBucket(task.bucket);
    setEditingRecurrence(task.recurrence);
    setEditingDueDate(formatCalendarDateForInput(task.dueDate));
    setEditingIsGrocery(task.isGrocery);
  }

  async function handleUpdate(taskId: string) {
    setLoadingIds((prev) => new Set(prev).add(taskId));
    try {
      await updateTask(taskId, {
        title: editingTitle,
        assignee: editingAssignee,
        priority: editingPriority,
        bucket: editingBucket,
        recurrence: editingRecurrence,
        dueDate: editingDueDate || null,
        isGrocery: editingIsGrocery,
      });
      setEditingTaskId(null);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Show</span>
          {(["open", "completed", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterBtn} ${statusFilter === value ? styles.active : ""}`}
              onClick={() => setStatusFilter(value)}
            >
              {value === "open" ? "Open" : value === "completed" ? "Done" : "All"}
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Type</span>
          {(["all", "tasks", "groceries"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterBtn} ${typeFilter === value ? styles.active : ""}`}
              onClick={() => setTypeFilter(value)}
            >
              {value === "all" ? "Everything" : value === "tasks" ? "Tasks" : "Groceries"}
            </button>
          ))}
        </div>
      </div>

      {sectionedTasks.length === 0 ? (
        <p className={styles.empty}>Nothing here right now.</p>
      ) : (
        sectionedTasks.map(({ section, tasks }) => (
          <div
            key={section}
            className={`${styles.section} ${dragTarget === section ? styles.sectionActive : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragTarget(section);
            }}
            onDragLeave={() =>
              setDragTarget((curr) => (curr === section ? null : curr))
            }
            onDrop={async (e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/task-id");
              const draggedTask = optimisticTasks.find((t) => t.id === taskId);
              if (draggedTask) await handleMove(draggedTask, section);
            }}
          >
            <header className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>{sectionIcons[section]}</span>
              <h4 className={styles.sectionTitle}>{taskSectionMeta[section].label}</h4>
              <span className={styles.sectionCount}>{tasks.length}</span>
            </header>

            <ul className={styles.taskList}>
              {tasks.map((task) => {
                const isEditing = editingTaskId === task.id;
                const isBusy = loadingIds.has(task.id);
                const dueInfo = getDueLabel(task.dueDate);
                const resetLabel = task.completed ? formatResetLabel(task.nextResetAt) : null;

                return (
                  <li
                    key={task.id}
                    className={`${styles.taskRow} ${task.completed ? styles.completed : ""}`}
                    draggable={!isEditing}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/task-id", task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragTarget(null)}
                  >
                    {isEditing ? (
                      <div className={styles.editCard}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="input-base"
                          placeholder="Task title"
                          maxLength={120}
                        />
                        <div className={styles.editGrid}>
                          <select
                            className={`input-base ${styles.select}`}
                            value={editingAssignee}
                            onChange={(e) => setEditingAssignee(e.target.value as TaskAssignee)}
                          >
                            {taskAssigneeOrder.map((v) => (
                              <option key={v} value={v}>{taskAssigneeMeta[v].label}</option>
                            ))}
                          </select>
                          <select
                            className={`input-base ${styles.select}`}
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value as TaskPriority)}
                          >
                            {taskPriorityOrder.map((v) => (
                              <option key={v} value={v}>{taskPriorityMeta[v].label}</option>
                            ))}
                          </select>
                          <select
                            className={`input-base ${styles.select}`}
                            value={editingIsGrocery ? "true" : "false"}
                            onChange={(e) => setEditingIsGrocery(e.target.value === "true")}
                          >
                            <option value="false">Task</option>
                            <option value="true">Grocery</option>
                          </select>
                          <select
                            className={`input-base ${styles.select}`}
                            value={editingBucket}
                            disabled={editingIsGrocery}
                            onChange={(e) => setEditingBucket(e.target.value as TaskBucket)}
                          >
                            {taskBucketOrder.map((v) => (
                              <option key={v} value={v}>{taskBucketMeta[v].label}</option>
                            ))}
                          </select>
                          <select
                            className={`input-base ${styles.select}`}
                            value={editingRecurrence}
                            onChange={(e) => setEditingRecurrence(e.target.value as TaskRecurrence)}
                          >
                            {taskRecurrenceOrder.map((v) => (
                              <option key={v} value={v}>{taskRecurrenceMeta[v].label}</option>
                            ))}
                          </select>
                          <div className={styles.dateField}>
                            <CalendarDays size={14} />
                            <input
                              type="date"
                              value={editingDueDate}
                              className={`input-base ${styles.dateInput}`}
                              onChange={(e) => setEditingDueDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className={styles.editActions}>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => setEditingTaskId(null)}
                            disabled={isBusy}
                          >
                            <X size={14} /> Cancel
                          </button>
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => handleUpdate(task.id)}
                            disabled={isBusy || !editingTitle.trim()}
                          >
                            <Check size={14} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`${styles.checkbox} ${task.completed ? styles.checked : ""}`}
                          onClick={() => handleToggle(task.id, task.completed)}
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
                            <span
                              className={`${styles.priorityDot} ${styles[taskPriorityMeta[task.priority].className]}`}
                            />
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
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => startEditing(task)}
                            disabled={isBusy}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setDeleteTarget(task.id)}
                            disabled={isBusy}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}

      {showAddForm ? (
        <div className={styles.addPanel}>
          <form ref={addFormRef} action={handleAdd} className={styles.addForm}>
            <input
              type="text"
              name="title"
              placeholder="What needs to be done?"
              className="input-base"
              disabled={isSubmitting}
              maxLength={120}
              required
            />
            <div className={styles.addRow}>
              <select
                name="assignee"
                className={`input-base ${styles.select}`}
                defaultValue="SHARED"
                disabled={isSubmitting}
              >
                {taskAssigneeOrder.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {taskAssigneeMeta[assignee].label}
                  </option>
                ))}
              </select>
              <select
                name="isGrocery"
                className={`input-base ${styles.select}`}
                defaultValue="false"
                disabled={isSubmitting}
                onChange={(e) => setNewTaskType(e.target.value as "false" | "true")}
              >
                <option value="false">Task</option>
                <option value="true">Grocery</option>
              </select>
            </div>
            <div className={styles.addGrid}>
              <select
                name="priority"
                className={`input-base ${styles.select}`}
                defaultValue="MEDIUM"
                disabled={isSubmitting}
              >
                {taskPriorityOrder.map((priority) => (
                  <option key={priority} value={priority}>
                    {taskPriorityMeta[priority].label}
                  </option>
                ))}
              </select>
              <select
                name="recurrence"
                className={`input-base ${styles.select}`}
                defaultValue="NONE"
                disabled={isSubmitting}
              >
                {taskRecurrenceOrder.map((recurrence) => (
                  <option key={recurrence} value={recurrence}>
                    {taskRecurrenceMeta[recurrence].label}
                  </option>
                ))}
              </select>
              <select
                name="bucket"
                className={`input-base ${styles.select}`}
                defaultValue="THIS_WEEK"
                disabled={isSubmitting || newTaskType === "true"}
              >
                {taskBucketOrder.map((bucket) => (
                  <option key={bucket} value={bucket}>
                    {taskBucketMeta[bucket].label}
                  </option>
                ))}
              </select>
              <div className={styles.dateField}>
                <CalendarDays size={14} />
                <input
                  type="date"
                  name="dueDate"
                  className={`input-base ${styles.dateInput}`}
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                <Plus size={16} /> Add
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={styles.fabRow}>
        <button
          type="button"
          className={`${styles.fab} ${showAddForm ? styles.fabOpen : ""}`}
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          {showAddForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete task"
        message="This task will be permanently deleted."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
