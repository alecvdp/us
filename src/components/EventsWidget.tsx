"use client";

import { useCallback, useRef, useState } from "react";
import { addEvent, deleteEvent, disconnectCalendar } from "@/app/actions/events";
import { CalendarDays, CheckSquare2, Plus, Trash2, Link2, Unlink } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./EventsWidget.module.css";
import { daysUntilCalendarDate } from "@/lib/dates";
import { taskAssigneeMeta, type TaskAssignee } from "@/lib/tasks";

type EventItem = {
  id: string;
  title: string;
  date: Date;
  source: string;
};

type TaskItem = {
  id: string;
  title: string;
  assignee: TaskAssignee;
  dueDate: Date | string | null;
  completed: boolean;
};

type GoogleAccountInfo = {
  id: string;
  email: string;
  lastSyncAt: Date | null;
};

type AgendaItem =
  | {
      id: string;
      title: string;
      date: Date;
      kind: "event";
      source: string;
    }
  | {
      id: string;
      title: string;
      date: Date;
      kind: "task";
      assignee: TaskAssignee;
      source?: undefined;
    };

export default function EventsWidget({
  initialEvents,
  initialTasks,
  googleAccounts,
}: {
  initialEvents: EventItem[];
  initialTasks: TaskItem[];
  googleAccounts: GoogleAccountInfo[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addEvent(formData);
      formRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteEvent(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const handleConfirmDisconnect = useCallback(async () => {
    if (disconnectTarget) {
      await disconnectCalendar(disconnectTarget);
      setDisconnectTarget(null);
    }
  }, [disconnectTarget]);

  const hasTime = (date: Date) => {
    const d = new Date(date);
    return d.getHours() !== 0 || d.getMinutes() !== 0;
  };

  const formatEventDate = (date: Date) => {
    const d = new Date(date);
    const datePart = new Intl.DateTimeFormat("en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);
    if (!hasTime(d)) return datePart;
    const timePart = new Intl.DateTimeFormat("en-US", {
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
    return `${datePart} · ${timePart}`;
  };

  const getDaysUntil = (date: Date) => {
    const diffDays = daysUntilCalendarDate(date);
    if (diffDays < 0) {
      const past = Math.abs(diffDays);
      return past === 1 ? "Yesterday" : `${past} days ago`;
    }
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  const agendaItems: AgendaItem[] = [
    ...initialEvents.map((event) => ({
      id: event.id,
      title: event.title,
      date: new Date(event.date),
      kind: "event" as const,
      source: event.source,
    })),
    ...initialTasks
      .filter((task) => !task.completed && task.dueDate)
      .map((task) => ({
        id: task.id,
        title: task.title,
        date: new Date(task.dueDate as string | Date),
        kind: "task" as const,
        assignee: task.assignee,
      })),
  ].sort((left, right) => left.date.getTime() - right.date.getTime());

  return (
    <div className={styles.container}>
      {/* Google Calendar connection status */}
      <div className={styles.calendarStatus}>
        {googleAccounts.length > 0 ? (
          googleAccounts.map((account) => (
            <div key={account.id} className={styles.connectedAccount}>
              <span className={styles.connectedLabel}>
                <Link2 size={12} />
                {account.email}
              </span>
              <button
                className={`${styles.disconnectBtn} btn-icon`}
                onClick={() => setDisconnectTarget(account.id)}
                title="Disconnect Google Calendar"
              >
                <Unlink size={12} />
              </button>
            </div>
          ))
        ) : (
          <a href="/api/auth/google" className={styles.connectBtn}>
            <CalendarDays size={14} />
            Connect Google Calendar
          </a>
        )}
      </div>

      <div className={styles.eventList}>
        {agendaItems.length === 0 ? (
          <p className={styles.empty}>No upcoming events or due tasks</p>
        ) : null}

        {agendaItems.map((item) => (
          <div key={`${item.kind}-${item.id}`} className={styles.eventCard}>
            <div className={styles.dateBox}>
              <span className={styles.dateMonth}>{new Date(item.date).toLocaleDateString("en-US", { month: "short" })}</span>
              <span className={styles.dateDay}>{new Date(item.date).getDate()}</span>
            </div>
            <div className={styles.eventInfo}>
              <div className={styles.itemHeader}>
                <span className={styles.eventTitle}>{item.title}</span>
                <span className={`${styles.itemBadge} ${
                  item.kind === "task"
                    ? styles.taskBadge
                    : item.source === "google"
                      ? styles.googleBadge
                      : styles.eventBadge
                }`}>
                  {item.kind === "task" ? "Task" : item.source === "google" ? "Google" : "Event"}
                </span>
              </div>
              <span className={styles.eventSub}>
                {formatEventDate(item.date)} &middot; <span className={styles.eventCountdown}>{getDaysUntil(item.date)}</span>
                {item.kind === "task" ? (
                  <>
                    {" "}·{" "}
                    <span className={styles.assigneeLabel}>{taskAssigneeMeta[item.assignee].label}</span>
                  </>
                ) : null}
              </span>
            </div>
            {item.kind === "event" && item.source !== "google" ? (
              <button className={`${styles.deleteBtn} btn-icon`} onClick={() => setDeleteTarget(item.id)}>
                <Trash2 size={14} />
              </button>
            ) : item.kind === "task" ? (
              <div className={styles.taskIconWrap}>
                <CheckSquare2 size={15} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <form ref={formRef} action={handleAdd} className={styles.addForm}>
        <input type="text" name="title" placeholder="Event name" className="input-base" required />
        <div className={styles.dateTimeRow}>
          <input type="date" name="date" className="input-base" required />
          <input type="time" name="time" className={`input-base ${styles.timeInput}`} />
        </div>
        <button type="submit" className="btn-icon">
          <CalendarDays size={16} />
          <Plus size={16} />
        </button>
      </form>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete event"
        message="This event will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={disconnectTarget !== null}
        title="Disconnect Google Calendar"
        message="This will remove the connection and delete all synced Google events."
        onConfirm={handleConfirmDisconnect}
        onCancel={() => setDisconnectTarget(null)}
      />
    </div>
  );
}
