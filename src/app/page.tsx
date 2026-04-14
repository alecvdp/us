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
import ErrorBoundary from "@/components/ErrorBoundary";
import AutoRefresh from "@/components/AutoRefresh";

export default async function Home() {
  const [tasks, note, links, events] = await Promise.all([
    getTasks(),
    getNote(),
    getLinks(),
    getEvents(),
  ]);

  return (
    <>
      <AutoRefresh />
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
          <div className={`${styles.widgetContent} ${styles.tasksContent}`}>
            <ErrorBoundary widgetName="Tasks">
              <TasksWidget initialTasks={tasks} />
            </ErrorBoundary>
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
            <ErrorBoundary widgetName="Whiteboard">
              <WhiteboardWidget initialNote={note} />
            </ErrorBoundary>
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
            <ErrorBoundary widgetName="Pastebin">
              <PastebinWidget initialLinks={links} />
            </ErrorBoundary>
          </div>
        </div>

        <div className="glass-panel">
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>
              <Calendar size={20} />
              Calendar & Agenda
            </h2>
          </div>
          <div className={styles.widgetContent}>
            <ErrorBoundary widgetName="Calendar">
              <EventsWidget initialEvents={events} initialTasks={tasks} />
            </ErrorBoundary>
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
            <ErrorBoundary widgetName="Weather">
              <WeatherWidget />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </>
  );
}
