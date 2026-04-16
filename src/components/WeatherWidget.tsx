"use client";

import { useRef, useState } from "react";
import styles from "./WeatherWidget.module.css";
import { AlertTriangle, Cloud, CloudRain, Sun, CloudLightning, CloudSnow, Plus, Settings, Trash2, X } from "lucide-react";
import { addWeatherLocation, deleteWeatherLocation } from "@/app/actions/weather";
import ConfirmDialog from "./ConfirmDialog";

type LocationItem = {
  id: string;
  name: string;
  badge: string;
  latitude: number;
  longitude: number;
};

type WeatherData = {
  temp: number;
  conditionCode: number;
};

// Open-Meteo WMO codes mapping
const getWeatherIcon = (code: number, size = 24) => {
  if (code <= 3) return <Sun size={size} className={styles.iconSun} />;
  if (code <= 49) return <Cloud size={size} className={styles.iconCloud} />;
  if (code <= 69 || code >= 80 && code <= 82) return <CloudRain size={size} className={styles.iconRain} />;
  if (code <= 79 || code >= 85 && code <= 86) return <CloudSnow size={size} className={styles.iconSnow} />;
  if (code >= 95) return <CloudLightning size={size} className={styles.iconStorm} />;
  return <Cloud size={size} className={styles.iconCloud} />;
};

const getWeatherDesc = (code: number) => {
  if (code === 0) return "Clear sky";
  if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 69) return "Rain";
  if (code >= 71 && code <= 79) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
};

function badgeColor(badge: string) {
  let hash = 0;
  for (let i = 0; i < badge.length; i++) {
    hash = badge.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return {
    background: `hsla(${hue}, 40%, 50%, 0.2)`,
    color: `hsl(${hue}, 45%, 70%)`,
    border: `1px solid hsla(${hue}, 40%, 50%, 0.3)`,
  };
}

export default function WeatherWidget({
  initialLocations,
  initialWeather,
}: {
  initialLocations: LocationItem[];
  initialWeather: (WeatherData | null)[];
}) {
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addWeatherLocation(formData);
      formRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (deleteTarget) {
      await deleteWeatherLocation(deleteTarget);
      setDeleteTarget(null);
    }
  }

  if (!editing && initialWeather.every((d) => d === null)) {
    return (
      <div className={styles.loader}>
        <AlertTriangle size={18} /> Unable to load weather data.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {initialLocations.map((location, i) => {
        const data = initialWeather[i];
        return (
          <div key={location.id} className={styles.locationCard}>
            <div className={styles.cardHeader}>
              <span className={styles.city}>{location.name}</span>
              <div className={styles.cardHeaderRight}>
                <span className={styles.badge} style={badgeColor(location.badge)}>
                  {location.badge}
                </span>
                {editing && (
                  <button
                    className={`${styles.deleteBtn} btn-icon`}
                    onClick={() => setDeleteTarget(location.id)}
                    title="Remove location"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {!editing && (
              <div className={styles.weatherBody}>
                <div className={styles.iconWrapper}>
                  {data ? getWeatherIcon(data.conditionCode, 36) : <Cloud />}
                </div>
                <div className={styles.tempWrapper}>
                  <span className={styles.temp}>{data?.temp ?? "--"}&deg;</span>
                  <span className={styles.desc}>
                    {data ? getWeatherDesc(data.conditionCode) : "--"}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {editing && (
        <form ref={formRef} action={handleAdd} className={styles.addForm}>
          <input type="text" name="name" placeholder="City, State" className="input-base" required />
          <input type="text" name="badge" placeholder="Badge (e.g. Home)" className="input-base" required />
          <input type="text" name="latitude" placeholder="Latitude" className="input-base" required />
          <input type="text" name="longitude" placeholder="Longitude" className="input-base" required />
          <button type="submit" className={`${styles.addBtn} btn-icon`} disabled={isSubmitting}>
            <Plus size={18} />
          </button>
        </form>
      )}

      {initialLocations.length === 0 && !editing && (
        <p className={styles.empty}>No weather locations configured.</p>
      )}

      <button
        className={`${styles.editToggle} btn-icon`}
        onClick={() => setEditing(!editing)}
        title={editing ? "Done editing" : "Manage locations"}
      >
        {editing ? <X size={16} /> : <Settings size={16} />}
      </button>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove location"
        message="This weather location will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
