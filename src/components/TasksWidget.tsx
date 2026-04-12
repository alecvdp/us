"use client";

import { useMemo, useRef, useState } from "react";
import { addTask, deleteTask, moveTask, toggleTask, updateTask } from "@/app/actions/tasks";
import { ArrowLeft, ArrowRight, CalendarDays, Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
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

function formatDateForInput(date: Task["dueDate"]) {
  if (!date) return "";

  const parsed = new Date(date);
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDate(date: Task["dueDate"]) {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatResetLabel(date: Task["nextResetAt"]) {
  if (!date) return null;

  const resetDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  resetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((resetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Resets today";
  if (diffDays === 1) return "Resets tomorrow";

  return `Resets ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(resetDate)}`;
}

function getQuickMoveOptions(task: Task) {
  if (task.isGrocery) return { previous: null, next: null };

  const index = taskBucketOrder.indexOf(task.bucket);
  return {
    previous: index > 0 ? taskBucketOrder[index - 1] : null,
    next: index < taskBucketOrder.length - 1 ? taskBucketOrder[index + 1] : null,
  };
}

export default function TasksWidget({ initialTasks }: { initialTasks: Task[] }) {
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
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);

  const filteredTasks = useMemo(
    () =>
      initialTasks.filter((task) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "open" ? !task.completed : task.completed);
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "tasks" ? !task.isGrocery : task.isGrocery);
        return matchesStatus && matchesType;
      }),
    [initialTasks, statusFilter, typeFilter]
  );

  const groupedTasks = useMemo(
    () =>
      taskAssigneeOrder.map((assignee) => ({
        assignee,
        tasks: filteredTasks.filter((task) => task.assignee === assignee),
      })),
    [filteredTasks]
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

  async function handleToggle(id: string, completed: boolean) {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await toggleTask(id, !completed);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id: string) {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await deleteTask(id);
      if (editingTaskId === id) {
        setEditingTaskId(null);
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleMove(task: Task, section: TaskSection, assignee: TaskAssignee = task.assignee) {
    setLoadingIds((prev) => new Set(prev).add(task.id));
    try {
      await moveTask(task.id, {
        assignee,
        section,
      });
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
    setEditingDueDate(formatDateForInput(task.dueDate));
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
              {value === "open" ? "Open" : value === "completed" ? "Completed" : "All"}
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

      <div className={styles.columns}>
        {groupedTasks.map(({ assignee, tasks }) => {
          const meta = taskAssigneeMeta[assignee];
          const sections = taskSectionOrder.map((section) => ({
            section,
            tasks: tasks.filter((task) => getTaskSection(task) === section),
          }));
          const visibleSections = sections.filter(({ tasks: sectionTasks }) => sectionTasks.length > 0);

          return (
            <section key={assignee} className={styles.column}>
              <header className={styles.columnHeader}>
                <div className={styles.columnIdentity}>
                  <span className={`${styles.avatar} ${styles[meta.accentClass]}`}>{meta.avatar}</span>
                  <div>
                    <h3 className={styles.columnTitle}>{meta.label}</h3>
                    <p className={styles.columnCount}>
                      {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                    </p>
                  </div>
                </div>
              </header>

              {visibleSections.length === 0 ? (
                <div className={styles.empty}>Nothing here right now.</div>
              ) : (
                <div className={styles.sectionStack}>
                  {visibleSections.map(({ section, tasks: sectionTasks }) => (
                    <section
                      key={section}
                      className={`${styles.sectionCard} ${
                        dragTarget === `${assignee}-${section}` ? styles.sectionCardActive : ""
                      }`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragTarget(`${assignee}-${section}`);
                      }}
                      onDragLeave={() => setDragTarget((current) => (current === `${assignee}-${section}` ? null : current))}
                      onDrop={async (event) => {
                        event.preventDefault();
                        const taskId = event.dataTransfer.getData("text/task-id");
                        const draggedTask = initialTasks.find((task) => task.id === taskId);

                        if (!draggedTask) return;

                        await handleMove(draggedTask, section, assignee);
                      }}
                    >
                      <header className={styles.sectionHeader}>
                        <h4 className={styles.sectionTitle}>{taskSectionMeta[section].label}</h4>
                        <span className={styles.sectionCount}>{sectionTasks.length}</span>
                      </header>

                      <ul className={styles.taskList}>
                        {sectionTasks.map((task) => {
                          const isEditing = editingTaskId === task.id;
                          const isBusy = loadingIds.has(task.id);
                          const dueDateLabel = formatDueDate(task.dueDate);
                          const resetLabel = task.completed ? formatResetLabel(task.nextResetAt) : null;
                          const quickMove = getQuickMoveOptions(task);
                          const previousBucket = quickMove.previous;
                          const nextBucket = quickMove.next;

                          return (
                            <li
                              key={task.id}
                              className={`${styles.taskCard} ${task.completed ? styles.completed : ""}`}
                              draggable={!isEditing}
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/task-id", task.id);
                                event.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => setDragTarget(null)}
                            >
                              {isEditing ? (
                                <div className={styles.editCard}>
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(event) => setEditingTitle(event.target.value)}
                                    className="input-base"
                                    placeholder="Task title"
                                    maxLength={120}
                                  />
                                  <div className={styles.editGrid}>
                                    <select
                                      className={`input-base ${styles.select}`}
                                      value={editingAssignee}
                                      onChange={(event) => setEditingAssignee(event.target.value as TaskAssignee)}
                                    >
                                      {taskAssigneeOrder.map((value) => (
                                        <option key={value} value={value}>
                                          {taskAssigneeMeta[value].label}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      className={`input-base ${styles.select}`}
                                      value={editingPriority}
                                      onChange={(event) => setEditingPriority(event.target.value as TaskPriority)}
                                    >
                                      {taskPriorityOrder.map((value) => (
                                        <option key={value} value={value}>
                                          {taskPriorityMeta[value].label}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      className={`input-base ${styles.select}`}
                                      value={editingIsGrocery ? "true" : "false"}
                                      onChange={(event) => setEditingIsGrocery(event.target.value === "true")}
                                    >
                                      <option value="false">Task</option>
                                      <option value="true">Grocery</option>
                                    </select>
                                    <select
                                      className={`input-base ${styles.select}`}
                                      value={editingBucket}
                                      disabled={editingIsGrocery}
                                      onChange={(event) => setEditingBucket(event.target.value as TaskBucket)}
                                    >
                                      {taskBucketOrder.map((value) => (
                                        <option key={value} value={value}>
                                          {taskBucketMeta[value].label}
                                        </option>
                                      ))}
                                    </select>
                                      <select
                                        className={`input-base ${styles.select}`}
                                        value={editingRecurrence}
                                        onChange={(event) => setEditingRecurrence(event.target.value as TaskRecurrence)}
                                      >
                                        {taskRecurrenceOrder.map((value) => (
                                          <option key={value} value={value}>
                                            {taskRecurrenceMeta[value].label}
                                          </option>
                                        ))}
                                      </select>
                                    <div className={styles.dateField}>
                                      <CalendarDays size={14} />
                                      <input
                                        type="date"
                                        value={editingDueDate}
                                        className={`input-base ${styles.dateInput}`}
                                        onChange={(event) => setEditingDueDate(event.target.value)}
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
                                      <X size={14} />
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.primaryBtn}
                                      onClick={() => handleUpdate(task.id)}
                                      disabled={isBusy || !editingTitle.trim()}
                                    >
                                      <Check size={14} />
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className={styles.taskMain}>
                                    <span className={styles.dragHandle} aria-hidden="true">
                                      <GripVertical size={15} />
                                    </span>
                                    <button
                                      type="button"
                                      className={`${styles.checkBtn} ${task.completed ? styles.checkBtnActive : ""}`}
                                      onClick={() => handleToggle(task.id, task.completed)}
                                      disabled={isBusy}
                                    >
                                      {task.completed ? <Check size={14} strokeWidth={3} /> : null}
                                    </button>
                                    <div className={styles.taskBody}>
                                      <span className={styles.taskTitle}>{task.title}</span>
                                      <div className={styles.taskMeta}>
                                        <span className={styles.taskBadge}>{task.isGrocery ? "Grocery" : "Task"}</span>
                                        <span
                                          className={`${styles.priorityBadge} ${
                                            styles[taskPriorityMeta[task.priority].className]
                                          }`}
                                        >
                                          {taskPriorityMeta[task.priority].label}
                                        </span>
                                        {dueDateLabel ? (
                                          <span className={styles.dueBadge}>
                                            <CalendarDays size={12} />
                                            {dueDateLabel}
                                          </span>
                                        ) : null}
                                        {task.recurrence !== "NONE" ? (
                                          <span className={styles.recurrenceBadge}>
                                            {taskRecurrenceMeta[task.recurrence].label}
                                          </span>
                                        ) : null}
                                        {resetLabel ? <span className={styles.resetBadge}>{resetLabel}</span> : null}
                                      </div>
                                    </div>
                                  </div>

                                  <div className={styles.taskActions}>
                                    {previousBucket ? (
                                      <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => handleMove(task, previousBucket)}
                                        disabled={isBusy}
                                        title={`Move to ${taskBucketMeta[previousBucket].label}`}
                                      >
                                        <ArrowLeft size={15} />
                                      </button>
                                    ) : null}
                                    {nextBucket ? (
                                      <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => handleMove(task, nextBucket)}
                                        disabled={isBusy}
                                        title={`Move to ${taskBucketMeta[nextBucket].label}`}
                                      >
                                        <ArrowRight size={15} />
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="btn-icon"
                                      onClick={() => startEditing(task)}
                                      disabled={isBusy}
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-icon"
                                      onClick={() => handleDelete(task.id)}
                                      disabled={isBusy}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <form ref={addFormRef} action={handleAdd} className={styles.addForm}>
        <input
          type="text"
          name="title"
          placeholder="Add a shared or assigned task..."
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
            onChange={(event) => setNewTaskType(event.target.value as "false" | "true")}
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
            <Plus size={16} />
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
