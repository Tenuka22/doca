"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Map, type MapRef, Marker } from "@vis.gl/react-maplibre";
import { Hospital as HospitalIcon } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";

import { GALLE_REGION, type Hospital } from "@/data/hospitals";

interface MapViewProps {
  filteredHospitals: Hospital[];
  onMarkerPress: (hospital: Hospital) => void;
  platformHospitalNames?: string[];
  selectedHospitalId?: string;
  userLocation?: { lat: number; lng: number } | null;
}

const MapComponent = forwardRef<
  {
    animateToRegion: (
      region: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
      },
      duration: number
    ) => void;
  },
  MapViewProps
>(
  (
    {
      filteredHospitals,
      onMarkerPress,
      userLocation,
      selectedHospitalId,
      platformHospitalNames = [],
    },
    ref
  ) => {
    const mapRef = useRef<MapRef>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion(region, _duration) {
        mapRef.current?.flyTo({
          center: [region.longitude, region.latitude],
          zoom: 14,
          duration: _duration,
        });
      },
    }));

    return (
      <View className="flex-1">
        <Map
          initialViewState={{
            longitude: GALLE_REGION.longitude,
            latitude: GALLE_REGION.latitude,
            zoom: GALLE_REGION.latitudeDelta > 0.1 ? 11 : 13,
          }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
        >
          {userLocation && (
            <Marker latitude={userLocation.lat} longitude={userLocation.lng}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#3b82f6",
                  borderWidth: 3,
                  borderColor: "white",
                  boxShadow: "0 0 4px rgba(59, 130, 246, 0.5)",
                }}
              />
            </Marker>
          )}
          {filteredHospitals.map((hospital) => {
            const isSelected = hospital.name === selectedHospitalId;
            const isPlatform = platformHospitalNames.includes(hospital.name);

            return (
              <Marker
                key={hospital.name}
                latitude={hospital.latitude}
                longitude={hospital.longitude}
                onClick={() => onMarkerPress(hospital)}
                style={{
                  cursor: "pointer",
                  zIndex: isSelected ? 10 : isPlatform ? 5 : 1,
                }}
              >
                <View
                  className={`items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? "border-4 border-primary bg-primary/20"
                      : isPlatform
                        ? "border-primary bg-primary"
                        : "border-border bg-muted-foreground/40"
                  }`}
                  style={{
                    width: isSelected ? 44 : isPlatform ? 30 : 24,
                    height: isSelected ? 44 : isPlatform ? 30 : 24,
                    boxShadow: isSelected
                      ? "0 0 0 4px rgba(59,130,246,0.3), 0 4px 12px rgba(0,0,0,0.3)"
                      : isPlatform
                        ? "0 2px 4px rgba(0,0,0,0.25)"
                        : "0 1px 2px rgba(0,0,0,0.15)",
                  }}
                >
                  <HospitalIcon
                    color={isSelected || isPlatform ? "white" : "#fff"}
                    size={isSelected ? 20 : isPlatform ? 14 : 11}
                    strokeWidth={2.5}
                  />
                </View>
              </Marker>
            );
          })}
        </Map>
      </View>
    );
  }
);

MapComponent.displayName = "MapView";

export default MapComponent;
