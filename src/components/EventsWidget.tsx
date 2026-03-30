"use client";

import { useState } from "react";
import { addEvent, deleteEvent } from "@/app/actions/events";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import styles from "./EventsWidget.module.css";

type EventItem = {
  id: string;
  title: string;
  date: Date;
};

export default function EventsWidget({ initialEvents }: { initialEvents: EventItem[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await addEvent(formData);
    setIsSubmitting(false);
    // @ts-ignore
    document.getElementById("add-event-form")?.reset();
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this event?")) {
      await deleteEvent(id);
    }
  }

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

  return (
    <div className={styles.container}>
      <div className={styles.eventList}>
        {initialEvents.length === 0 ? (
          <p className={styles.empty}>No upcoming events</p>
        ) : null}
        
        {initialEvents.map(event => (
          <div key={event.id} className={styles.eventCard}>
            <div className={styles.dateBox}>
              <span className={styles.dateMonth}>{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className={styles.dateDay}>{new Date(event.date).getDate()}</span>
            </div>
            <div className={styles.eventInfo}>
              <span className={styles.eventTitle}>{event.title}</span>
              <span className={styles.eventSub}>{formatEventDate(event.date)} &middot; <span className={styles.eventCountdown}>{getDaysUntil(event.date)}</span></span>
            </div>
            <button className={`${styles.deleteBtn} btn-icon`} onClick={() => handleDelete(event.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form id="add-event-form" action={handleAdd} className={styles.addForm}>
        <input type="text" name="title" placeholder="Event Name" className="input-base" required />
        <input type="date" name="date" className="input-base" required />
        <button type="submit" className="btn-icon">
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
}
