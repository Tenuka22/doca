"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Map, type MapRef, Marker } from "@vis.gl/react-maplibre";
import { Hospital as HospitalIcon, MapPin, User } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { GALLE_REGION, type Hospital } from "@/data/hospitals";

interface DoctorMarker {
  doctorId: string;
  doctorName: string;
  headline: string | null;
  latitude: number;
  longitude: number;
  tenantName: string;
}

interface MapViewProps {
  filteredHospitals: Hospital[];
  doctorMarkers?: DoctorMarker[];
  onMarkerPress: (hospital: Hospital) => void;
  onDoctorMarkerPress?: (doctorId: string) => void;
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
      doctorMarkers = [],
      onMarkerPress,
      onDoctorMarkerPress,
      userLocation,
      selectedHospitalId,
      platformHospitalNames = [],
    },
    ref
  ) => {
    const mapRef = useRef<MapRef>(null);
    const [loaded, setLoaded] = useState(false);

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
      <View className="flex-1 bg-[#f2efe9]">
        {!loaded && (
          <View className="absolute inset-0 items-center justify-center z-10">
            <MapPin className="text-foreground-muted/20" size={48} strokeWidth={1.5} />
            <ActivityIndicator className="mt-4 text-foreground-muted/40" size="small" />
          </View>
        )}
        <Map
          attributionControl={false}
          initialViewState={{
            longitude: GALLE_REGION.longitude,
            latitude: GALLE_REGION.latitude,
            zoom: GALLE_REGION.latitudeDelta > 0.1 ? 10.5 : 12,
          }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          onLoad={() => setLoaded(true)}
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
        >
          {userLocation && (
            <Marker latitude={userLocation.lat} longitude={userLocation.lng}>
              <View
                className="border-background bg-red-500"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  borderWidth: 3,
                  boxShadow: "0 0 0 3px rgba(239,68,68,0.3)",
                }}
              />
            </Marker>
          )}
          {doctorMarkers.map((doc) => (
            <Marker
              key={`doc-${doc.doctorId}-${doc.latitude}-${doc.longitude}`}
              latitude={doc.latitude}
              longitude={doc.longitude}
              onClick={() => onDoctorMarkerPress?.(doc.doctorId)}
              style={{ cursor: "pointer", zIndex: 3 }}
            >
              <View className="items-center justify-center rounded-full border-2 border-blue-500 bg-blue-500"
                style={{ width: 24, height: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              >
                <User color="white" size={13} strokeWidth={3} />
              </View>
            </Marker>
          ))}
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
                      ? "border-red-500 bg-red-500/15"
                      : isPlatform
                        ? "border-red-500 bg-red-500"
                        : "border-red-500/40 bg-red-500/10"
                  }`}
                  style={{
                    width: isSelected ? 44 : isPlatform ? 30 : 22,
                    height: isSelected ? 44 : isPlatform ? 30 : 22,
                    boxShadow: isSelected
                      ? "0 0 0 3px rgba(239,68,68,0.35), 0 4px 12px rgba(0,0,0,0.25)"
                      : isPlatform
                        ? "0 2px 6px rgba(239,68,68,0.3)"
                        : "0 1px 3px rgba(0,0,0,0.12)",
                  }}
                >
                  <HospitalIcon
                    color={isPlatform ? "white" : "#ef4444"}
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
