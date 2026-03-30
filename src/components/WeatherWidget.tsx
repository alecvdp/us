"use client";

import { useEffect, useState } from "react";
import styles from "./WeatherWidget.module.css";
import { Cloud, CloudRain, Sun, CloudLightning, CloudSnow, Loader2 } from "lucide-react";

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

export default function WeatherWidget() {
  const [weatherSD, setWeatherSD] = useState<WeatherData | null>(null);
  const [weatherTem, setWeatherTem] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // San Diego coords: 32.7157, -117.1611
        // Temecula coords: 33.4936, -117.1484
        const [resSD, resTem] = await Promise.all([
          fetch("https://api.open-meteo.com/v1/forecast?latitude=32.7157&longitude=-117.1611&current_weather=true&temperature_unit=fahrenheit"),
          fetch("https://api.open-meteo.com/v1/forecast?latitude=33.4936&longitude=-117.1484&current_weather=true&temperature_unit=fahrenheit")
        ]);

        const dataSD = await resSD.json();
        const dataTem = await resTem.json();

        setWeatherSD({
          temp: Math.round(dataSD.current_weather.temperature),
          conditionCode: dataSD.current_weather.weathercode
        });

        setWeatherTem({
          temp: Math.round(dataTem.current_weather.temperature),
          conditionCode: dataTem.current_weather.weathercode
        });
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className={styles.loader}><Loader2 className="lucide-spin" /> Loading weather...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.locationCard}>
        <div className={styles.cardHeader}>
          <span className={styles.city}>Temecula, CA</span>
          <span className={styles.badgeHome}>Home</span>
        </div>
        <div className={styles.weatherBody}>
          <div className={styles.iconWrapper}>
            {weatherTem ? getWeatherIcon(weatherTem.conditionCode, 36) : <Cloud />}
          </div>
          <div className={styles.tempWrapper}>
            <span className={styles.temp}>{weatherTem?.temp}&deg;</span>
            <span className={styles.desc}>{weatherTem ? getWeatherDesc(weatherTem.conditionCode) : '--'}</span>
          </div>
        </div>
      </div>

      <div className={styles.locationCard}>
        <div className={styles.cardHeader}>
          <span className={styles.city}>San Diego, CA</span>
          <span className={styles.badgeWork}>Work</span>
        </div>
        <div className={styles.weatherBody}>
          <div className={styles.iconWrapper}>
            {weatherSD ? getWeatherIcon(weatherSD.conditionCode, 36) : <Cloud />}
          </div>
          <div className={styles.tempWrapper}>
            <span className={styles.temp}>{weatherSD?.temp}&deg;</span>
            <span className={styles.desc}>{weatherSD ? getWeatherDesc(weatherSD.conditionCode) : '--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
