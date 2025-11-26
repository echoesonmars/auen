"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { normalizeCityName, isCityName } from "@/lib/cityNormalizer";
import { useToast } from "@/components/ui/toast";

// Исправление иконок для Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
    city: string;
  }) => void;
  initialLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
  };
  error?: string;
}

// Компонент для обновления центра карты
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  error,
}: LocationPickerProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || "");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
    city: string;
  } | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? {
          address: initialLocation.address || "",
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          city: initialLocation.city || "",
        }
      : null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation?.latitude && initialLocation?.longitude
      ? [initialLocation.latitude, initialLocation.longitude]
      : [51.1694, 71.4491] // Алматы по умолчанию
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Получение текущего местоположения пользователя
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru&addressdetails=1`
            );
            const data = await response.json();
            if (data) {
            const address = data.display_name || "";
            // Пытаемся получить город из структурированного адреса
            let city = data.address?.city || data.address?.town || data.address?.village || "";
            
            // Если не нашли в структурированном адресе, извлекаем из строки
            if (!city) {
              const addressParts = address.split(",").map((part: string) => part.trim());
              
              // Исключаем страну и области из поиска
              const excludedParts = ["казахстан", "kazakhstan", "россия", "russia"];
              const regionKeywords = ["область", "region", "район", "district"];
              
              // Ищем город, начиная с конца, но пропуская страну и области
              for (let i = addressParts.length - 1; i >= 0; i--) {
                const part = addressParts[i].toLowerCase();
                
                // Пропускаем страну
                if (excludedParts.some(excluded => part.includes(excluded))) {
                  continue;
                }
                
                // Пропускаем области/регионы
                if (regionKeywords.some(keyword => part.includes(keyword))) {
                  continue;
                }
                
                // Проверяем, является ли это городом
                const originalPart = addressParts[i];
                if (isCityName(originalPart)) {
                  city = normalizeCityName(originalPart);
                  break;
                }
              }
            } else {
              // Нормализуем найденный город
              city = normalizeCityName(city);
            }
            
            // Проверяем, что извлеченный город является валидным
            if (!city || !isCityName(city)) {
              showToast("Не удалось определить город. Пожалуйста, выберите место на карте.", "warning");
              return;
            }

            const normalizedCity = normalizeCityName(city);
            
            const location = {
              address,
              latitude,
              longitude,
              city: normalizedCity,
            };
            setSelectedLocation(location);
            setMapCenter([latitude, longitude]);
            setSearchQuery(address);
            onLocationSelect(location);
            }
          } catch (error) {
            console.error("Error getting location:", error);
          } finally {
            setIsSearching(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsSearching(false);
        }
      );
    }
  };

  // Поиск местоположения
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru&countrycodes=kz&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data || []);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Обработка изменения поискового запроса
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(searchQuery);
      }, 500);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Обработка клика вне области подсказок
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Выбор местоположения из подсказок
  const selectSuggestion = (suggestion: { 
    display_name: string; 
    lat: string; 
    lon: string; 
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
    };
  }) => {
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    const address = suggestion.display_name;
    
    // Пытаемся использовать структурированный адрес из Nominatim, если доступен
    let city = "";
    if (suggestion.address) {
      // Nominatim возвращает структурированный адрес с полями city, town, village, municipality
      city = suggestion.address.city || 
             suggestion.address.town || 
             suggestion.address.village || 
             suggestion.address.municipality || 
             suggestion.address.county || 
             "";
      
      if (city && isCityName(city)) {
        city = normalizeCityName(city);
      } else {
        city = "";
      }
    }
    
    // Если не нашли в структурированном адресе, парсим display_name
    if (!city) {
      // Извлекаем город из адреса
      // Обычно формат: "улица, район, город, область, Казахстан" или "город, Казахстан"
      const addressParts = address.split(",").map((part: string) => part.trim());
      
      // Исключаем страну и области из поиска
      const excludedParts = ["казахстан", "kazakhstan", "россия", "russia"];
      const regionKeywords = ["область", "region", "район", "district"];
      
      // Ищем город, начиная с конца, но пропуская страну и области
      for (let i = addressParts.length - 1; i >= 0; i--) {
        const part = addressParts[i].toLowerCase();
        
        // Пропускаем страну
        if (excludedParts.some(excluded => part.includes(excluded))) {
          continue;
        }
        
        // Пропускаем области/регионы
        if (regionKeywords.some(keyword => part.includes(keyword))) {
          continue;
        }
        
        // Проверяем, является ли это городом
        const originalPart = addressParts[i];
        if (isCityName(originalPart)) {
          city = normalizeCityName(originalPart);
          break;
        }
      }
    }

    // Проверяем, что извлеченный город является валидным
    if (!city || !isCityName(city)) {
      showToast("Не удалось определить город. Пожалуйста, выберите место на карте или введите название города вручную.", "warning");
      return;
    }

    const normalizedCity = normalizeCityName(city);
    
    const location = {
      address,
      latitude,
      longitude,
      city: normalizedCity,
    };

    setSelectedLocation(location);
    setMapCenter([latitude, longitude]);
    setSearchQuery(address);
    setSuggestions([]);
    onLocationSelect(location);
  };

  // Компонент для обработки кликов на карте
  function MapClickHandler() {
    useMapEvents({
      click: async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setIsSearching(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
          );
          const data = await response.json();
          if (data) {
            const address = data.display_name || "";
            // Пытаемся получить город из структурированного адреса
            let city = data.address?.city || data.address?.town || data.address?.village || "";
            
            // Если не нашли в структурированном адресе, извлекаем из строки
            if (!city) {
              const addressParts = address.split(",").map((part: string) => part.trim());
              
              // Исключаем страну и области из поиска
              const excludedParts = ["казахстан", "kazakhstan", "россия", "russia"];
              const regionKeywords = ["область", "region", "район", "district"];
              
              // Ищем город, начиная с конца, но пропуская страну и области
              for (let i = addressParts.length - 1; i >= 0; i--) {
                const part = addressParts[i].toLowerCase();
                
                // Пропускаем страну
                if (excludedParts.some(excluded => part.includes(excluded))) {
                  continue;
                }
                
                // Пропускаем области/регионы
                if (regionKeywords.some(keyword => part.includes(keyword))) {
                  continue;
                }
                
                // Проверяем, является ли это городом
                const originalPart = addressParts[i];
                if (isCityName(originalPart)) {
                  city = normalizeCityName(originalPart);
                  break;
                }
              }
            } else {
              // Нормализуем найденный город
              city = normalizeCityName(city);
            }
            
            // Проверяем, что извлеченный город является валидным
            if (!city || !isCityName(city)) {
              showToast("Не удалось определить город. Пожалуйста, выберите другое место на карте или введите название города вручную.", "warning");
              setIsSearching(false);
              return;
            }

            const normalizedCity = normalizeCityName(city);
            
            const location = {
              address,
              latitude: lat,
              longitude: lng,
              city: normalizedCity,
            };
            setSelectedLocation(location);
            setSearchQuery(address);
            onLocationSelect(location);
          }
        } catch (error) {
          console.error("Error getting location:", error);
          showToast("Ошибка при получении адреса", "error");
        } finally {
          setIsSearching(false);
        }
      },
    });
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Поиск местоположения */}
      <div className="relative" ref={suggestionsRef}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск места или адреса..."
              className={`w-full px-4 py-3 pr-10 rounded-lg border ${
                error ? "border-red-500" : "border-color-light"
              } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-color-medium border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {!isSearching && searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLocation(null);
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-color-medium hover:text-color-dark"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-4 py-3 bg-color-lightest text-color-dark rounded-lg hover:bg-color-light transition-all border border-color-light"
            title="Использовать мое местоположение"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          </button>
        </div>

        {/* Подсказки поиска */}
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-color-light max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-color-lightest transition-colors border-b border-color-light last:border-b-0"
              >
                <p className="text-sm text-color-dark font-medium">{suggestion.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Карта */}
      <div className="h-64 sm:h-80 rounded-lg overflow-hidden border border-color-light">
        <MapContainer
          center={mapCenter}
          zoom={selectedLocation ? 15 : 10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />
          {selectedLocation && (
            <>
              <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
              <MapUpdater center={[selectedLocation.latitude, selectedLocation.longitude]} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Выбранное местоположение */}
      {selectedLocation && (
        <div className="p-3 bg-color-lightest rounded-lg border border-color-light">
          <p className="text-sm text-color-medium mb-1">Выбранное местоположение:</p>
          <p className="text-sm font-medium text-color-dark">{selectedLocation.address}</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

