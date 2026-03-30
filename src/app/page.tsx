import { CloudSun, LayoutDashboard, ListTodo, Calendar, Link as LinkIcon, Edit3 } from "lucide-react";
import styles from "./page.module.css";

import { getTasks } from "@/app/actions/tasks";
import { getNote } from "@/app/actions/notes";
import { getLinks } from "@/app/actions/links";
import { getEvents } from "@/app/actions/events";

import TasksWidget from "@/components/TasksWidget";
import WhiteboardWidget from "@/components/WhiteboardWidget";
import PastebinWidget from "@/components/PastebinWidget";
import EventsWidget from "@/components/EventsWidget";
import WeatherWidget from "@/components/WeatherWidget";

export default async function Home() {
  const [tasks, note, links, events] = await Promise.all([
    getTasks(),
    getNote(),
    getLinks(),
    getEvents(),
  ]);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <LayoutDashboard size={32} />
          Us Dashboard
        </h1>
      </header>

      <main className={styles.dashboardGrid}>
        <div className="glass-panel">
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>
              <ListTodo size={20} />
              Tasks & Groceries
            </h2>
          </div>
          <div className={styles.widgetContent}>
            <TasksWidget initialTasks={tasks} />
          </div>
        </div>

        <div className="glass-panel">
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>
              <Edit3 size={20} />
              Whiteboard
            </h2>
          </div>
          <div className={styles.widgetContent}>
            <WhiteboardWidget initialNote={note} />
          </div>
        </div>

        <div className="glass-panel">
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>
              <LinkIcon size={20} />
              Pastebin
            </h2>
          </div>
          <div className={styles.widgetContent}>
            <PastebinWidget initialLinks={links} />
          </div>
        </div>

        <div className="glass-panel">
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>
              <Calendar size={20} />
              Upcoming Events
            </h2>
          </div>
          <div className={styles.widgetContent}>
            <EventsWidget initialEvents={events} />
          </div>
        </div>

        <div className="glass-panel">
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>
              <CloudSun size={20} />
              Weather
            </h2>
          </div>
          <div className={styles.widgetContent}>
            <WeatherWidget />
          </div>
        </div>
      </main>
    </>
  );
}
