"use client";

import { useOptimistic, useMemo, useState, useTransition } from "react";
import { deleteTask, moveTask, toggleTask, updateTask } from "@/app/actions/tasks";
import { Archive, CalendarDays, Repeat, ShoppingCart, Star } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import TaskRow from "./TaskRow";
import TaskAddForm from "./TaskAddForm";
import styles from "./TasksWidget.module.css";
import { formatCalendarDateForInput } from "@/lib/dates";
import {
  taskSectionMeta,
  taskSectionOrder,
  type TaskAssignee,
  type TaskBucket,
  type TaskPriority,
  type TaskRecurrence,
  type TaskSection,
} from "@/lib/tasks";

export type Task = {
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingAssignee, setEditingAssignee] = useState<TaskAssignee>("SHARED");
  const [editingPriority, setEditingPriority] = useState<TaskPriority>("MEDIUM");
  const [editingBucket, setEditingBucket] = useState<TaskBucket>("THIS_WEEK");
  const [editingRecurrence, setEditingRecurrence] = useState<TaskRecurrence>("NONE");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingIsGrocery, setEditingIsGrocery] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  function handleEditChange(field: string, value: string | boolean) {
    switch (field) {
      case "title": setEditingTitle(value as string); break;
      case "assignee": setEditingAssignee(value as TaskAssignee); break;
      case "priority": setEditingPriority(value as TaskPriority); break;
      case "bucket": setEditingBucket(value as TaskBucket); break;
      case "recurrence": setEditingRecurrence(value as TaskRecurrence); break;
      case "dueDate": setEditingDueDate(value as string); break;
      case "isGrocery": setEditingIsGrocery(value as boolean); break;
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
            onDragOver={(e) => { e.preventDefault(); setDragTarget(section); }}
            onDragLeave={() => setDragTarget((curr) => (curr === section ? null : curr))}
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
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isBusy={loadingIds.has(task.id)}
                  isEditing={editingTaskId === task.id}
                  editState={{
                    title: editingTitle,
                    assignee: editingAssignee,
                    priority: editingPriority,
                    bucket: editingBucket,
                    recurrence: editingRecurrence,
                    dueDate: editingDueDate,
                    isGrocery: editingIsGrocery,
                  }}
                  onToggle={handleToggle}
                  onStartEdit={startEditing}
                  onCancelEdit={() => setEditingTaskId(null)}
                  onSaveEdit={handleUpdate}
                  onDelete={setDeleteTarget}
                  onEditChange={handleEditChange}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      <TaskAddForm />

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
