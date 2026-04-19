import { useMemo } from "react";
import styles from "./CalendarMonthView.module.css";
import type { AgendaItem } from "./EventsWidget";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarMonthView({
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
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();

  const itemsByDay = useMemo(() => {
    const map = new Map<number, AgendaItem[]>();
    for (const item of items) {
      const d = item.date;
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(item);
      }
    }
    return map;
  }, [items, year, month]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayItems = selectedDate
    ? items.filter((item) => sameDay(item.date, selectedDate))
    : [];

  return (
    <div className={styles.monthView}>
      <div className={styles.grid}>
        {DAY_LABELS.map((label, i) => (
          <div key={i} className={styles.dayHeader}>
            {label}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e-${i}`} className={styles.emptyCell} />;
          }

          const cellDate = new Date(year, month, day);
          const isToday = sameDay(cellDate, today);
          const isSelected =
            selectedDate !== null && sameDay(cellDate, selectedDate);
          const dayItems = itemsByDay.get(day) || [];

          return (
            <button
              key={day}
              type="button"
              className={[
                styles.dayCell,
                isToday ? styles.today : "",
                isSelected ? styles.selected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDate(cellDate)}
            >
              <span className={styles.dayNumber}>{day}</span>
              {dayItems.length > 0 && (
                <div className={styles.dots}>
                  {dayItems.slice(0, 3).map((item) => (
                    <span
                      key={`${item.kind}-${item.id}`}
                      className={`${styles.dot} ${
                        item.kind === "task" ? styles.taskDot : styles.eventDot
                      }`}
                    />
                  ))}
                  {dayItems.length > 3 && (
                    <span className={styles.moreCount}>
                      +{dayItems.length - 3}
                    </span>
                  )}
                </div>
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
