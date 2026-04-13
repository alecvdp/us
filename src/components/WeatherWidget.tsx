"use client";

import { useEffect, useState } from "react";
import styles from "./WeatherWidget.module.css";
import { AlertTriangle, Cloud, CloudRain, Sun, CloudLightning, CloudSnow, Loader2 } from "lucide-react";
import { WEATHER_LOCATIONS } from "@/lib/weather";

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

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<(WeatherData | null)[]>(
    () => WEATHER_LOCATIONS.map(() => null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const responses = await Promise.all(
          WEATHER_LOCATIONS.map((loc) =>
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
  }, []);

  if (loading) {
    return <div className={styles.loader}><Loader2 className="lucide-spin" /> Loading weather...</div>;
  }

  if (error && weatherData.every((d) => d === null)) {
    return (
      <div className={styles.loader}>
        <AlertTriangle size={18} /> Unable to load weather data.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {WEATHER_LOCATIONS.map((location, i) => {
        const data = weatherData[i];
        return (
          <div key={location.name} className={styles.locationCard}>
            <div className={styles.cardHeader}>
              <span className={styles.city}>{location.name}</span>
              <span className={badgeClassMap[location.badge] ?? styles.badgeWork}>
                {location.badge}
              </span>
            </div>
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
          </div>
        );
      })}
    </div>
  );
}
