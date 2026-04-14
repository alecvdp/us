"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./WeatherWidget.module.css";
import { AlertTriangle, Cloud, CloudRain, Sun, CloudLightning, CloudSnow, Loader2, Plus, Settings, Trash2, X } from "lucide-react";
import { addWeatherLocation, deleteWeatherLocation } from "@/app/actions/weather";

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

const badgeClassMap: Record<string, string> = {
  Home: styles.badgeHome,
  Work: styles.badgeWork,
};

export default function WeatherWidget({ initialLocations }: { initialLocations: LocationItem[] }) {
  const [weatherData, setWeatherData] = useState<(WeatherData | null)[]>(
    () => initialLocations.map(() => null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialLocations.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchWeather() {
      try {
        const responses = await Promise.all(
          initialLocations.map((loc) =>
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&temperature_unit=fahrenheit`
            )
          )
        );

        const results = await Promise.all(responses.map((r) => r.json()));

        setWeatherData(
          results.map((data) => ({
            temp: Math.round(data.current_weather.temperature),
            conditionCode: data.current_weather.weathercode,
          }))
        );
        setError(false);
      } catch (err) {
        console.error("Failed to fetch weather", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initialLocations]);

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

  async function handleDelete(id: string) {
    if (confirm("Remove this weather location?")) {
      await deleteWeatherLocation(id);
    }
  }

  if (loading) {
    return <div className={styles.loader}><Loader2 className="lucide-spin" /> Loading weather...</div>;
  }

  if (!editing && error && weatherData.every((d) => d === null)) {
    return (
      <div className={styles.loader}>
        <AlertTriangle size={18} /> Unable to load weather data.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {initialLocations.map((location, i) => {
        const data = weatherData[i];
        return (
          <div key={location.id} className={styles.locationCard}>
            <div className={styles.cardHeader}>
              <span className={styles.city}>{location.name}</span>
              <div className={styles.cardHeaderRight}>
                <span className={badgeClassMap[location.badge] ?? styles.badgeWork}>
                  {location.badge}
                </span>
                {editing && (
                  <button
                    className={`${styles.deleteBtn} btn-icon`}
                    onClick={() => handleDelete(location.id)}
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
    </div>
  );
}
