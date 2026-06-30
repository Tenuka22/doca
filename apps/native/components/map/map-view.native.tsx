"use client";

import { Hospital as HospitalIcon, User } from "lucide-react-native";
import { forwardRef } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

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

const MapComponent = forwardRef<MapView, MapViewProps>(
  (
    {
      filteredHospitals,
      doctorMarkers = [],
      onMarkerPress,
      onDoctorMarkerPress,
      selectedHospitalId,
      platformHospitalNames = [],
    },
    ref
  ) => (
    <MapView
      className="flex-1"
      initialRegion={GALLE_REGION}
      ref={ref}
      showsUserLocation
    >
      {/* Doctor markers */}
      {doctorMarkers.map((doc) => (
        <Marker
          coordinate={{
            latitude: doc.latitude,
            longitude: doc.longitude,
          }}
          key={`doc-${doc.doctorId}-${doc.latitude}-${doc.longitude}`}
          onPress={() => onDoctorMarkerPress?.(doc.doctorId)}
          tracksViewChanges={false}
        >
          <View
            className="items-center justify-center rounded-full border-2 border-blue-500 bg-blue-500"
            style={{
              width: 24,
              height: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <User color="white" size={13} strokeWidth={3} />
          </View>
        </Marker>
      ))}

      {/* Hospital markers */}
      {filteredHospitals.map((hospital) => {
        const isSelected = hospital.name === selectedHospitalId;
        const isPlatform = platformHospitalNames.includes(hospital.name);

        return (
          <Marker
            coordinate={{
              latitude: hospital.latitude,
              longitude: hospital.longitude,
            }}
            key={hospital.name}
            onPress={() => onMarkerPress(hospital)}
            tracksViewChanges={isSelected}
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
                shadowColor: isSelected || isPlatform ? "#ef4444" : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.4 : isPlatform ? 0.25 : 0.12,
                shadowRadius: isSelected ? 8 : isPlatform ? 4 : 2,
                elevation: isSelected ? 10 : isPlatform ? 4 : 2,
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
    </MapView>
  )
);

MapComponent.displayName = "MapView";
export default MapComponent;
