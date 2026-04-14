"use client";

import { useCallback, useRef, useState } from "react";
import { addEvent, deleteEvent } from "@/app/actions/events";
import { CalendarDays, CheckSquare2, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./EventsWidget.module.css";
import { taskAssigneeMeta, type TaskAssignee } from "@/lib/tasks";

type EventItem = {
  id: string;
  title: string;
  date: Date;
};

type TaskItem = {
  id: string;
  title: string;
  assignee: TaskAssignee;
  dueDate: Date | string | null;
  completed: boolean;
};

type AgendaItem =
  | {
      id: string;
      title: string;
      date: Date;
      kind: "event";
    }
  | {
      id: string;
      title: string;
      date: Date;
      kind: "task";
      assignee: TaskAssignee;
    };

export default function EventsWidget({
  initialEvents,
  initialTasks,
}: {
  initialEvents: EventItem[];
  initialTasks: TaskItem[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
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

  const formatEventDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(eventDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
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
                <span className={`${styles.itemBadge} ${item.kind === "task" ? styles.taskBadge : styles.eventBadge}`}>
                  {item.kind === "task" ? "Task" : "Event"}
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
            {item.kind === "event" ? (
              <button className={`${styles.deleteBtn} btn-icon`} onClick={() => setDeleteTarget(item.id)}>
                <Trash2 size={14} />
              </button>
            ) : (
              <div className={styles.taskIconWrap}>
                <CheckSquare2 size={15} />
              </div>
            )}
          </div>
        ))}
      </div>

      <form ref={formRef} action={handleAdd} className={styles.addForm}>
        <input type="text" name="title" placeholder="Event name" className="input-base" required />
        <input type="date" name="date" className="input-base" required />
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
    </div>
  );
}
