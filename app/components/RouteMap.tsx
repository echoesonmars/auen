"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Исправление иконок для Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Создаем кастомные иконки
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface RouteMapProps {
  destination: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deliveryMethod?: "pickup" | "courier";
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

// Компонент для обновления карты
function MapUpdater({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

export default function RouteMap({
  destination,
  deliveryMethod = "pickup",
  onLocationSelect,
}: RouteMapProps) {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Получение текущего местоположения пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`
            );
            const data = await response.json();
            const address = data.display_name || "";
            setUserLocation({ latitude, longitude, address });
            
            // Если есть обработчик, вызываем его
            if (onLocationSelect) {
              onLocationSelect({ latitude, longitude, address });
            }
          } catch (error) {
            console.error("Error getting location:", error);
            setUserLocation({ latitude, longitude, address: "" });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, [onLocationSelect]);

  // Построение маршрута
  useEffect(() => {
    if (userLocation && destination && deliveryMethod === "pickup") {
      buildRoute(userLocation, destination);
    } else {
      setRoute([]);
      setDistance(null);
      setDuration(null);
    }
  }, [userLocation, destination, deliveryMethod]);

  const buildRoute = async (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ) => {
    setIsLoadingRoute(true);
    try {
      // Используем OSRM для построения маршрута
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const routeGeometry = data.routes[0].geometry.coordinates;
        // Преобразуем координаты из [lon, lat] в [lat, lon] для Leaflet
        const routeCoords: [number, number][] = routeGeometry.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        setRoute(routeCoords);

        // Расстояние в метрах
        const distanceMeters = data.routes[0].distance;
        setDistance(distanceMeters);

        // Время в секундах
        const durationSeconds = data.routes[0].duration;
        setDuration(durationSeconds);
      }
    } catch (error) {
      console.error("Route building error:", error);
      // Если не удалось построить маршрут, просто показываем прямую линию
      setRoute([
        [start.latitude, start.longitude],
        [end.latitude, end.longitude],
      ]);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Вычисляем границы для отображения всех точек
  const getBounds = (): L.LatLngBounds => {
    const bounds = L.latLngBounds(
      [[destination.latitude, destination.longitude]]
    );
    
    if (userLocation) {
      bounds.extend([userLocation.latitude, userLocation.longitude]);
    }
    
    if (route.length > 0) {
      route.forEach((coord) => {
        bounds.extend(coord);
      });
    }
    
    return bounds;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    return `${(meters / 1000).toFixed(1)} км`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  const bounds = getBounds();
  const hasValidBounds = bounds.isValid();

  return (
    <div className="space-y-4">
      {/* Информация о маршруте */}
      {deliveryMethod === "pickup" && userLocation && (
        <div className="bg-color-lightest rounded-lg p-4 border border-color-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-color-dark">Способ получения:</span>
            <span className="text-sm text-color-medium">Самовывоз</span>
          </div>
          {isLoadingRoute && (
            <div className="flex items-center gap-2 text-sm text-color-medium">
              <div className="w-4 h-4 border-2 border-color-medium border-t-transparent rounded-full animate-spin"></div>
              <span>Построение маршрута...</span>
            </div>
          )}
          {!isLoadingRoute && distance !== null && duration !== null && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-color-medium mb-1">Расстояние</p>
                <p className="text-sm font-semibold text-color-dark">{formatDistance(distance)}</p>
              </div>
              <div>
                <p className="text-xs text-color-medium mb-1">Время в пути</p>
                <p className="text-sm font-semibold text-color-dark">{formatDuration(duration)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {deliveryMethod === "courier" && (
        <div className="bg-color-lightest rounded-lg p-4 border border-color-light">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-color-dark">Способ получения:</span>
            <span className="text-sm text-color-medium">Курьер от Auen</span>
          </div>
          <p className="text-xs text-color-medium mt-2">
            Курьер доставит оборудование по указанному адресу
          </p>
        </div>
      )}

      {/* Карта */}
      <div className="h-64 sm:h-80 rounded-lg overflow-hidden border border-color-light relative">
        {hasValidBounds ? (
          <MapContainer
            center={[destination.latitude, destination.longitude]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Маршрут */}
            {route.length > 0 && (
              <Polyline
                positions={route}
                color="#3b82f6"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* Местоположение пользователя */}
            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={createCustomIcon("#10b981")}
              />
            )}

            {/* Местоположение арендодателя */}
            <Marker
              position={[destination.latitude, destination.longitude]}
              icon={createCustomIcon("#ef4444")}
            />

            {/* Обновление границ карты */}
            <MapUpdater bounds={bounds} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-color-lightest">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-color-medium border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-color-medium">Загрузка карты...</p>
            </div>
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-4 text-xs text-color-medium">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Ваше местоположение</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Местоположение арендодателя</span>
        </div>
      </div>
    </div>
  );
}

