export type WeatherLocation = {
  name: string;
  badge: string;
  latitude: number;
  longitude: number;
};

export const WEATHER_LOCATIONS: WeatherLocation[] = [
  {
    name: "Temecula, CA",
    badge: "Home",
    latitude: 33.4936,
    longitude: -117.1484,
  },
  {
    name: "San Diego, CA",
    badge: "Work",
    latitude: 32.7157,
    longitude: -117.1611,
  },
];
