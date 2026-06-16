"use client";

import { Hospital as HospitalIcon } from "lucide-react-native";
import { forwardRef } from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { GALLE_REGION, type Hospital } from "@/data/hospitals";

interface MapViewProps {
  filteredHospitals: Hospital[];
  onMarkerPress: (hospital: Hospital) => void;
  platformHospitalNames?: string[];
  selectedHospitalId?: string;
  userLocation?: { lat: number; lng: number } | null;
}

const MapComponent = forwardRef<MapView, MapViewProps>(
  (
    {
      filteredHospitals,
      onMarkerPress,
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
                  ? "border-4 border-primary bg-primary/20"
                  : isPlatform
                    ? "border-primary bg-primary"
                    : "border-border bg-muted-foreground/40"
              }`}
              style={{
                width: isSelected ? 44 : isPlatform ? 30 : 24,
                height: isSelected ? 44 : isPlatform ? 30 : 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.4 : isPlatform ? 0.25 : 0.15,
                shadowRadius: isSelected ? 8 : 4,
                elevation: isSelected ? 10 : isPlatform ? 4 : 2,
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
    </MapView>
  )
);

MapComponent.displayName = "MapView";
export default MapComponent;
