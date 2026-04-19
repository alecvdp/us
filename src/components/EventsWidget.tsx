"use client";

import { useCallback, useRef, useState } from "react";
import { addEvent, deleteEvent } from "@/app/actions/events";
import {
  CalendarDays,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import CalendarMonthView from "./CalendarMonthView";
import CalendarWeekView from "./CalendarWeekView";
import styles from "./EventsWidget.module.css";
import { daysUntilCalendarDate } from "@/lib/dates";
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

export type AgendaItem =
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

type CalendarView = "agenda" | "week" | "month";

const VIEW_OPTIONS: { key: CalendarView; icon: typeof List; label: string }[] = [
  { key: "agenda", icon: List, label: "Agenda" },
  { key: "week", icon: CalendarDays, label: "Week" },
  { key: "month", icon: LayoutGrid, label: "Month" },
];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function EventsWidget({
  initialEvents,
  initialTasks,
}: {
  initialEvents: EventItem[];
  initialTasks: TaskItem[];
}) {
  const [view, setView] = useState<CalendarView>("agenda");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  const navigateMonth = (delta: number) => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
    setSelectedDate(null);
  };

  const navigateWeek = (delta: number) => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewDate(new Date());
    setSelectedDate(null);
  };

  const getNavLabel = () => {
    if (view === "month") {
      return viewDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    // week
    const d = new Date(viewDate);
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const fmt = (dt: Date) =>
      dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(sunday)} – ${fmt(saturday)}`;
  };

  const handleSelectDate = (date: Date) => {
    if (selectedDate && sameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.viewControls}>
        <div className={styles.viewToggle}>
          {VIEW_OPTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.viewBtn} ${view === key ? styles.viewBtnActive : ""}`}
              onClick={() => {
                setView(key);
                setSelectedDate(null);
              }}
              title={label}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        {view !== "agenda" && (
          <div className={styles.navControls}>
            <button
              type="button"
              className={`btn-icon ${styles.navBtn}`}
              onClick={() => (view === "month" ? navigateMonth(-1) : navigateWeek(-1))}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className={styles.navLabel}
              onClick={goToToday}
              title="Go to today"
            >
              {getNavLabel()}
            </button>
            <button
              type="button"
              className={`btn-icon ${styles.navBtn}`}
              onClick={() => (view === "month" ? navigateMonth(1) : navigateWeek(1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {view === "agenda" && (
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
      )}

      {view === "month" && (
        <CalendarMonthView
          items={agendaItems}
          viewDate={viewDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      )}

      {view === "week" && (
        <CalendarWeekView
          items={agendaItems}
          viewDate={viewDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      )}

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
    </div>
  );
}
