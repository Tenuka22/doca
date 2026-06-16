"use client";

import { useQuery } from "@tanstack/react-query";
import { type Href, Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock,
  Globe,
  Hospital as HospitalIcon,
  Info,
  List,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
  Star,
  Stethoscope,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type MapView from "react-native-maps";

import MapComponent from "@/components/map/map-view";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ScreenBottomBar } from "@/components/ui/screen-bottom-bar";
import { Tag } from "@/components/ui/tag";
import {
  type CATEGORIES,
  hospitals as staticHospitals,
} from "@/data/hospitals";

interface TenantListItem {
  address: string;
  clinicCount: number;
  contactInfo: string | null;
  doctorCount: number;
  id: string;
  latitude: string | null;
  logo: string | null;
  longitude: string | null;
  name: string;
  phone: string | null;
  services: string[];
  status: string;
  type: "PRIVATE_HOSPITAL" | "PUBLIC_HOSPITAL";
  website: string | null;
}

import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";
import { useUserLocation } from "@/utils/use-user-location";

type FilterCategory = (typeof CATEGORIES)[number];

const FILTER_ACTIONS = [
  { icon: Building2, label: "Private", value: "Private hospital" },
  { icon: Building2, label: "Government", value: "Government hospital" },
  { icon: HospitalIcon, label: "Hospital", value: "Hospital" },
  { icon: Stethoscope, label: "Medical", value: "Medical Center" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function MapScreen() {
  const colors = useThemeColor();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { location: userLocation, requestLocation } = useUserLocation();

  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    } else {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "All",
  ]);
  const [selectedHospital, setSelectedHospital] = useState<
    (typeof staticHospitals)[number] | null
  >(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDoctorTenantIds, setSelectedDoctorTenantIds] = useState<
    string[] | null
  >(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  const doctorsQuery = useQuery(
    orpc.listDoctors.queryOptions({
      input: { page: 1, pageSize: 50, search },
    })
  );

  const tenantsQuery = useQuery(
    orpc.listTenants.queryOptions({
      input: selectedDoctorTenantIds
        ? { tenantIds: selectedDoctorTenantIds }
        : undefined,
    })
  );

  const filteredTenants = useMemo(() => {
    const allTenants = (tenantsQuery.data?.tenants ??
      []) as unknown as TenantListItem[];
    if (selectedCategories.includes("All")) {
      return allTenants;
    }
    return allTenants.filter((t) => {
      const typeLabel =
        t.type === "PRIVATE_HOSPITAL"
          ? "Private hospital"
          : t.type === "PUBLIC_HOSPITAL"
            ? "Government hospital"
            : "Hospital";
      return selectedCategories.includes(typeLabel);
    });
  }, [tenantsQuery.data, selectedCategories]);

  const platformHospitalNames = useMemo(
    () => filteredTenants.map((t) => t.name),
    [filteredTenants]
  );

  const allMapHospitals = useMemo(() => {
    const platformNames = new Set(platformHospitalNames);
    const merged = [...staticHospitals];
    for (const t of filteredTenants) {
      if (!platformNames.has(t.name)) {
        merged.push({
          name: t.name,
          address: t.address,
          rating: 4.0,
          reviewCount: 0,
          latitude: Number.parseFloat(t.latitude ?? "0"),
          longitude: Number.parseFloat(t.longitude ?? "0"),
          phone: t.phone,
          website: t.website,
          category:
            t.type === "PRIVATE_HOSPITAL"
              ? "Private hospital"
              : t.type === "PUBLIC_HOSPITAL"
                ? "Government hospital"
                : "Hospital",
          hours: null,
        });
      }
    }
    if (selectedCategories.includes("All")) {
      return merged;
    }
    return merged.filter((h) => selectedCategories.includes(h.category));
  }, [filteredTenants, selectedCategories, platformHospitalNames]);

  const handleMarkerPress = useCallback(
    (hospital: (typeof staticHospitals)[number]) => {
      setSelectedHospital(hospital);
      setShowDetailModal(false);
      mapRef.current?.animateToRegion(
        {
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    },
    []
  );

  const doctors = doctorsQuery.data?.doctors ?? [];

  const openMapsNavigation = useCallback(
    (hospital: (typeof staticHospitals)[number]) => {
      const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
      const appleUrl = `https://maps.apple.com/?daddr=${hospital.latitude},${hospital.longitude}`;
      Linking.openURL(userLocation ? googleUrl : appleUrl);
    },
    [userLocation]
  );

  const filteredDoctors = useMemo(() => {
    if (!search.trim()) {
      return [];
    }
    return doctors.filter((d) => {
      const name = d.profile.displayName?.toLowerCase() ?? "";
      const headline = d.profile.headline?.toLowerCase() ?? "";
      const q = search.toLowerCase();
      return name.includes(q) || headline.includes(q);
    });
  }, [doctors, search]);

  const togglePanel = useCallback(() => {
    const toValue = showPanel ? 0 : 1;
    Animated.timing(panelAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setShowPanel(!showPanel);
  }, [showPanel, panelAnim]);

  const screenWidth = Dimensions.get("window").width;
  const panelWidth = Math.min(screenWidth * 0.75, 320);
  const panelTranslateX = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [panelWidth, 0],
  });

  const detailTenant =
    showDetailModal && selectedHospital
      ? filteredTenants.find(
          (t) =>
            t.name === selectedHospital.name ||
            t.phone === selectedHospital.phone
        )
      : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-background">
        <MapComponent
          filteredHospitals={allMapHospitals}
          onMarkerPress={(hospital) => {
            const tenant = filteredTenants.find(
              (t) => t.name === hospital.name && t.address === hospital.address
            );
            if (tenant) {
              setSelectedHospital({
                name: tenant.name,
                address: tenant.address,
                rating: 4.0,
                reviewCount: 0,
                latitude: Number.parseFloat(tenant.latitude ?? "0"),
                longitude: Number.parseFloat(tenant.longitude ?? "0"),
                phone: tenant.phone,
                website: tenant.website,
                category:
                  tenant.type === "PRIVATE_HOSPITAL"
                    ? "Private hospital"
                    : tenant.type === "PUBLIC_HOSPITAL"
                      ? "Government hospital"
                      : "Hospital",
                hours: null,
              });
              setShowDetailModal(false);
              mapRef.current?.animateToRegion(
                {
                  latitude: Number.parseFloat(tenant.latitude ?? "0"),
                  longitude: Number.parseFloat(tenant.longitude ?? "0"),
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                },
                400
              );
            } else {
              handleMarkerPress(hospital);
            }
          }}
          platformHospitalNames={platformHospitalNames}
          ref={mapRef}
          selectedHospitalId={selectedHospital?.name}
          userLocation={userLocation}
        />

        <View className="absolute top-0 right-0 left-0 px-4 pt-14">
          <View className="relative">
            <View className="flex-row items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 shadow-lg">
              <Search
                color={colors.mutedForeground}
                size={16}
                strokeWidth={2.5}
              />
              <TextInput
                className="flex-1 font-sans text-base text-foreground"
                onChangeText={(text) => {
                  setSearch(text);
                  setShowDropdown(text.length > 0);
                }}
                onFocus={() => setShowDropdown(search.length > 0)}
                placeholder="Search doctors..."
                placeholderTextColor="#a1a1aa"
                ref={searchInputRef}
                value={search}
              />
              {search.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearch("");
                    setShowDropdown(false);
                    setSelectedDoctorTenantIds(null);
                  }}
                >
                  <X
                    color={colors.mutedForeground}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Pressable>
              )}
            </View>

            {showDropdown && (
              <View className="mt-1.5 max-h-64 overflow-hidden rounded-xl border-2 border-border bg-card shadow-lg">
                <ScrollView className="p-1">
                  {doctorsQuery.isPending && (
                    <View className="items-center py-4">
                      <ActivityIndicator color={colors.primary} size="small" />
                    </View>
                  )}

                  {!doctorsQuery.isPending && filteredDoctors.length === 0 && (
                    <View className="items-center py-4">
                      <Text className="font-medium font-sans text-muted-foreground text-xs uppercase tracking-wider">
                        No clinicians found
                      </Text>
                    </View>
                  )}

                  {!doctorsQuery.isPending &&
                    filteredDoctors.map(({ profile, affiliations }) => (
                      <Pressable
                        className="flex-row items-start gap-3 rounded-lg p-3 active:bg-secondary"
                        key={profile.userId}
                        onPress={() => {
                          setShowDropdown(false);
                          searchInputRef.current?.blur();
                          const tenantIds = affiliations.map((a) => a.tenantId);
                          if (tenantIds.length > 0) {
                            setSelectedDoctorTenantIds(tenantIds);
                          }
                        }}
                      >
                        <View className="mt-1 h-9 w-9 items-center justify-center rounded-full bg-secondary">
                          <Stethoscope
                            color={colors.mutedForeground}
                            size={16}
                            strokeWidth={2}
                          />
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="font-bold font-sans text-foreground text-sm uppercase tracking-tight">
                            {profile.displayName ?? "Clinician"}
                          </Text>
                          {profile.headline && (
                            <Text
                              className="font-medium font-sans text-muted-foreground text-xs"
                              numberOfLines={1}
                            >
                              {profile.headline}
                            </Text>
                          )}
                          {affiliations.length > 0 && (
                            <View className="flex-row flex-wrap gap-1">
                              {affiliations.map((aff) => (
                                <Tag
                                  key={aff.tenantId}
                                  size="sm"
                                  variant="muted"
                                >
                                  {aff.tenantName}
                                </Tag>
                              ))}
                            </View>
                          )}
                        </View>
                        {profile.specialties?.slice(0, 1).map((s) => (
                          <Tag key={s} size="sm">
                            {s}
                          </Tag>
                        ))}
                      </Pressable>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <Pressable
          className="absolute top-44 right-0 z-10 h-12 w-10 items-center justify-center rounded-l-xl border-2 border-border border-r-0 bg-card shadow-lg"
          onPress={togglePanel}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: -2, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          <List color={colors.foreground} size={18} strokeWidth={2.5} />
        </Pressable>

        <Animated.View
          className="absolute top-0 right-0 bottom-0 z-20 border-border border-l-2 bg-card shadow-xl"
          style={{
            width: panelWidth,
            transform: [{ translateX: panelTranslateX }],
          }}
        >
          <View className="flex-row items-center justify-between border-border border-b px-4 py-3">
            <View className="flex-1 flex-row items-center gap-2">
              <Text className="font-black font-sans text-foreground text-sm uppercase tracking-tight">
                Hospitals
              </Text>
              {selectedDoctorTenantIds && (
                <Tag size="sm" variant="primary">
                  Filtered by doctor
                </Tag>
              )}
            </View>
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
              onPress={togglePanel}
            >
              <X color={colors.mutedForeground} size={14} strokeWidth={2.5} />
            </Pressable>
          </View>

          {tenantsQuery.isPending && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          )}

          {!tenantsQuery.isPending && filteredTenants.length === 0 && (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-center font-medium font-sans text-muted-foreground text-xs uppercase tracking-wider">
                {selectedDoctorTenantIds
                  ? "This doctor has no affiliated hospitals"
                  : "No hospitals found"}
              </Text>
            </View>
          )}

          {!tenantsQuery.isPending && filteredTenants.length > 0 && (
            <ScrollView className="flex-1">
              {filteredTenants.map((tenant) => {
                const isSelected = selectedHospital?.name === tenant.name;
                return (
                  <Pressable
                    className={`flex-row items-center gap-3 border-border border-b px-4 py-3 ${isSelected ? "bg-primary/10" : ""}`}
                    key={tenant.id}
                    onPress={() => {
                      setSelectedDoctorTenantIds(null);
                      setSelectedHospital({
                        name: tenant.name,
                        address: tenant.address,
                        rating: 4.0,
                        reviewCount: 0,
                        latitude: Number.parseFloat(tenant.latitude ?? "0"),
                        longitude: Number.parseFloat(tenant.longitude ?? "0"),
                        phone: tenant.phone,
                        website: tenant.website,
                        category:
                          tenant.type === "PRIVATE_HOSPITAL"
                            ? "Private hospital"
                            : tenant.type === "PUBLIC_HOSPITAL"
                              ? "Government hospital"
                              : "Hospital",
                        hours: null,
                      });
                      setShowDetailModal(false);
                      mapRef.current?.animateToRegion(
                        {
                          latitude: Number.parseFloat(tenant.latitude ?? "0"),
                          longitude: Number.parseFloat(tenant.longitude ?? "0"),
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        },
                        400
                      );
                    }}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                      <HospitalIcon
                        color={colors.primary}
                        size={16}
                        strokeWidth={2}
                      />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text
                        className="font-bold font-sans text-foreground text-xs uppercase tracking-tight"
                        numberOfLines={1}
                      >
                        {tenant.name}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        <Star
                          color={colors.warning}
                          fill={colors.warning}
                          size={10}
                          strokeWidth={2}
                        />
                        <Text className="font-medium font-sans text-[10px] text-muted-foreground">
                          {tenant.doctorCount} doctors
                        </Text>
                        <Tag size="sm" variant="muted">
                          {tenant.type === "PRIVATE_HOSPITAL"
                            ? "Private"
                            : "Government"}
                        </Tag>
                        <Tag size="sm" variant="secondary">
                          {tenant.clinicCount} clinics
                        </Tag>
                      </View>
                    </View>
                    <ChevronRight
                      color={colors.mutedForeground}
                      size={14}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {selectedHospital && !showDetailModal && (
          <View className="absolute right-4 bottom-24 left-4">
            <View className="gap-3 rounded-xl border-2 border-border bg-card p-4 shadow-lg">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 gap-1 pr-4">
                  <Text className="font-black font-sans text-base text-foreground uppercase leading-tight tracking-tight">
                    {selectedHospital.name}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1">
                      <Star
                        color={colors.warning}
                        fill={colors.warning}
                        size={12}
                        strokeWidth={2.5}
                      />
                      <Text className="font-bold font-sans text-foreground text-xs">
                        {selectedHospital.rating}
                      </Text>
                    </View>
                    <Tag size="sm" variant="secondary">
                      {selectedHospital.category}
                    </Tag>
                  </View>
                  <View className="mt-1 flex-row items-start gap-1.5">
                    <MapPin
                      color={colors.mutedForeground}
                      size={12}
                      strokeWidth={2}
                    />
                    <Text
                      className="flex-1 font-medium font-sans text-muted-foreground text-xs leading-snug"
                      numberOfLines={2}
                    >
                      {selectedHospital.address}
                    </Text>
                  </View>
                </View>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
                  onPress={() => {
                    setSelectedHospital(null);
                    setSelectedDoctorTenantIds(null);
                  }}
                >
                  <X
                    color={colors.mutedForeground}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                {selectedHospital.phone && (
                  <Button
                    className="flex-1"
                    onPress={() =>
                      Linking.openURL(`tel:${selectedHospital.phone}`)
                    }
                    size="sm"
                    variant="primary"
                  >
                    <View className="flex-row items-center gap-1.5">
                      <Phone color="white" size={14} strokeWidth={2.5} />
                      <Text className="font-bold font-sans text-[10px] text-primary-foreground uppercase">
                        Call
                      </Text>
                    </View>
                  </Button>
                )}
                {selectedHospital.website && (
                  <Button
                    className="flex-1"
                    onPress={() => Linking.openURL(selectedHospital.website!)}
                    size="sm"
                    variant="secondary"
                  >
                    <View className="flex-row items-center gap-1.5">
                      <Globe
                        color={colors.foreground}
                        size={14}
                        strokeWidth={2.5}
                      />
                      <Text className="font-bold font-sans text-[10px] text-foreground uppercase">
                        Website
                      </Text>
                    </View>
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onPress={() => openMapsNavigation(selectedHospital)}
                  size="sm"
                  variant="outline"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Navigation
                      color={colors.foreground}
                      size={14}
                      strokeWidth={2.5}
                    />
                    <Text className="font-bold font-sans text-[10px] text-foreground uppercase">
                      Navigate
                    </Text>
                  </View>
                </Button>
              </View>

              <Pressable
                className="flex-row items-center justify-center gap-2 rounded-lg border-2 border-border bg-secondary/50 px-4 py-2.5"
                onPress={() => {
                  const selectedTenant = filteredTenants.find(
                    (t) =>
                      t.name === selectedHospital.name &&
                      t.phone === selectedHospital.phone
                  );
                  if (selectedTenant) {
                    setSelectedHospital(null);
                    router.push(`/hospitals/${selectedTenant.id}` as Href);
                  }
                }}
              >
                <Info
                  color={colors.mutedForeground}
                  size={14}
                  strokeWidth={2}
                />
                <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                  View hospital details
                </Text>
                <ChevronRight
                  color={colors.mutedForeground}
                  size={14}
                  strokeWidth={2.5}
                />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
        transparent
        visible={showDetailModal}
      >
        <View className="flex-1 bg-black/50">
          <View className="mt-auto max-h-[85%] rounded-t-3xl border-2 border-border bg-card">
            <View className="flex-row items-center justify-between border-border border-b px-5 py-4">
              <Text
                className="flex-1 font-black font-sans text-foreground text-lg uppercase tracking-tight"
                numberOfLines={1}
              >
                {detailTenant?.name ?? selectedHospital?.name}
              </Text>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
                onPress={() => setShowDetailModal(false)}
              >
                <X color={colors.mutedForeground} size={16} strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView
              className="px-5 py-4"
              contentContainerClassName="gap-5 pb-8"
            >
              <View className="gap-3">
                {selectedHospital && (
                  <>
                    <View className="flex-row items-center gap-2">
                      <Star
                        color={colors.warning}
                        fill={colors.warning}
                        size={14}
                        strokeWidth={2.5}
                      />
                      <Text className="font-bold font-sans text-foreground text-sm">
                        {selectedHospital.rating}
                      </Text>
                      <Tag size="sm" variant="secondary">
                        {selectedHospital.category}
                      </Tag>
                    </View>

                    <View className="flex-row items-start gap-2">
                      <MapPin
                        color={colors.mutedForeground}
                        size={14}
                        strokeWidth={2}
                      />
                      <Text className="flex-1 font-medium font-sans text-muted-foreground text-sm leading-snug">
                        {selectedHospital.address}
                      </Text>
                    </View>

                    {selectedHospital.phone && (
                      <Pressable
                        className="flex-row items-center gap-2"
                        onPress={() =>
                          Linking.openURL(`tel:${selectedHospital.phone}`)
                        }
                      >
                        <Phone
                          color={colors.primary}
                          size={14}
                          strokeWidth={2}
                        />
                        <Text className="font-medium font-sans text-primary text-sm">
                          {selectedHospital.phone}
                        </Text>
                      </Pressable>
                    )}

                    {selectedHospital.website && (
                      <Pressable
                        className="flex-row items-center gap-2"
                        onPress={() =>
                          Linking.openURL(selectedHospital.website!)
                        }
                      >
                        <Globe
                          color={colors.primary}
                          size={14}
                          strokeWidth={2}
                        />
                        <Text
                          className="flex-1 font-medium font-sans text-primary text-sm"
                          numberOfLines={1}
                        >
                          {selectedHospital.website}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>

              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <HospitalIcon
                    color={colors.mutedForeground}
                    size={14}
                    strokeWidth={2}
                  />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    Clinics & Services
                  </Text>
                </View>
                <View className="rounded-xl border-2 border-border bg-background p-4">
                  {detailTenant && detailTenant.services.length > 0 ? (
                    <View className="flex-row flex-wrap gap-1.5">
                      {detailTenant.services.map((service) => (
                        <Tag key={service} size="sm" variant="secondary">
                          {service}
                        </Tag>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-center font-medium font-sans text-muted-foreground text-xs leading-relaxed">
                      No services information available yet
                    </Text>
                  )}
                </View>
              </View>

              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Clock
                    color={colors.mutedForeground}
                    size={14}
                    strokeWidth={2}
                  />
                  <Text className="font-bold font-sans text-foreground text-xs uppercase tracking-wider">
                    Operating Hours
                  </Text>
                </View>
                <View className="rounded-xl border-2 border-border bg-background p-3">
                  {selectedHospital?.hours ? (
                    DAYS.map((day) => {
                      const hours = selectedHospital.hours?.[day];
                      return (
                        <View
                          className="flex-row items-center justify-between py-1.5"
                          key={day}
                        >
                          <Text className="font-bold font-sans text-foreground text-xs">
                            {day}
                          </Text>
                          <Text className="font-medium font-sans text-muted-foreground text-xs">
                            {hours ?? "Not available"}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <View className="py-2">
                      <Text className="text-center font-medium font-sans text-muted-foreground text-xs">
                        Hours not yet available
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {detailTenant && (
                <Pressable
                  className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/10 px-4 py-3"
                  onPress={() => {
                    setShowDetailModal(false);
                    setSelectedHospital(null);
                    router.push(`/hospitals/${detailTenant.id}` as Href);
                  }}
                >
                  <HospitalIcon
                    color={colors.primary}
                    size={16}
                    strokeWidth={2}
                  />
                  <Text className="font-bold font-sans text-primary text-xs uppercase tracking-wider">
                    View full hospital page
                  </Text>
                  <ChevronRight
                    color={colors.primary}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScreenBottomBar
        actions={FILTER_ACTIONS.map((a) => ({
          icon: a.icon,
          label: a.label,
          value: a.value,
        }))}
        hasNext={false}
        hasPrev={false}
        onToggleAction={(value) => {
          setSelectedCategories((prev) => {
            if (value === "All" || prev.includes(value)) {
              return ["All"];
            }
            return [value];
          });
        }}
        selectedValues={selectedCategories}
      >
        <View className="flex-1 flex-row overflow-hidden rounded-control border-2 border-border bg-background">
          {FILTER_ACTIONS.map(({ icon: Icon, label, value }) => {
            const isActive = selectedCategories.includes(value);

            return (
              <Pressable
                accessibilityLabel={label}
                className="flex-1 items-center justify-center border-border border-r-2 last:border-r-0"
                key={value}
                onPress={() => {
                  setSelectedCategories((prev) => {
                    if (prev.includes(value)) {
                      return ["All"];
                    }
                    return [value];
                  });
                }}
              >
                {({ pressed }) => (
                  <View
                    className={`h-14 w-full items-center justify-center ${isActive ? "bg-primary" : pressed ? "bg-primary/10" : "bg-background"}`}
                  >
                    <Icon
                      color={isActive ? "#ffffff" : colors.mutedForeground}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <IconButton
          icon={LocateFixed}
          iconSize={16}
          onPress={centerOnUserLocation}
        />

        {selectedHospital && (
          <View className="flex-row gap-2">
            {selectedHospital.phone && (
              <IconButton
                icon={Phone}
                iconSize={16}
                onPress={() => Linking.openURL(`tel:${selectedHospital.phone}`)}
              />
            )}
            <IconButton
              icon={Navigation}
              iconSize={16}
              onPress={() => openMapsNavigation(selectedHospital)}
            />
          </View>
        )}

        <IconButton
          icon={ArrowLeft}
          iconSize={16}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        />
      </ScreenBottomBar>
    </>
  );
}
