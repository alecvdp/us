import { useMemo } from "react";
import styles from "./CalendarWeekView.module.css";
import type { AgendaItem } from "./EventsWidget";

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDays(viewDate: Date): Date[] {
  const d = new Date(viewDate);
  const dayOfWeek = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function CalendarWeekView({
  items,
  viewDate,
  selectedDate,
  onSelectDate,
}: {
  items: AgendaItem[];
  viewDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const today = new Date();
  const weekDays = useMemo(() => getWeekDays(viewDate), [viewDate]);

  const itemsByDayIndex = useMemo(() => {
    const map = new Map<number, AgendaItem[]>();
    for (let i = 0; i < 7; i++) {
      map.set(i, []);
    }
    for (const item of items) {
      for (let i = 0; i < 7; i++) {
        if (sameDay(item.date, weekDays[i])) {
          map.get(i)!.push(item);
          break;
        }
      }
    }
    return map;
  }, [items, weekDays]);

  const selectedDayItems = selectedDate
    ? items.filter((item) => sameDay(item.date, selectedDate))
    : [];

  return (
    <div className={styles.weekView}>
      <div className={styles.grid}>
        {weekDays.map((day, i) => {
          const isToday = sameDay(day, today);
          const isSelected =
            selectedDate !== null && sameDay(day, selectedDate);
          const dayItems = itemsByDayIndex.get(i) || [];

          return (
            <button
              key={i}
              type="button"
              className={[
                styles.dayColumn,
                isToday ? styles.today : "",
                isSelected ? styles.selected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDate(new Date(day))}
            >
              <div className={styles.dayLabel}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={styles.dayNum}>{day.getDate()}</div>
              {dayItems.length > 0 && (
                <div className={styles.itemCount}>{dayItems.length}</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className={styles.dayDetail}>
          <div className={styles.dayDetailHeader}>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          {selectedDayItems.length === 0 ? (
            <p className={styles.emptyDay}>Nothing scheduled</p>
          ) : (
            selectedDayItems.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className={styles.dayItem}
              >
                <span
                  className={`${styles.itemDot} ${
                    item.kind === "task" ? styles.taskDot : styles.eventDot
                  }`}
                />
                <span className={styles.dayItemTitle}>{item.title}</span>
                <span
                  className={`${styles.itemBadge} ${
                    item.kind === "task" ? styles.taskBadge : styles.eventBadge
                  }`}
                >
                  {item.kind === "task" ? "Task" : "Event"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
