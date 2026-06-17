"use client";

import { Stack } from "expo-router";
import { View, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";
import { H1, Body, BodySm } from "@/components/design/typography";

export default function LandingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-bg-app overflow-hidden">
        <View
          className="absolute -top-10 -right-10 w-[280px] h-[280px] rounded-full bg-accent-terracotta opacity-40"
        />
        <View
          className="absolute top-10 -right-20 w-[300px] h-[450px] rounded-[150px] bg-[#E8E1D5] opacity-60"
          style={{ transform: [{ rotate: '-35deg' }] }}
        />

        <View
          className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-[200px] bg-[#E5E3D8] opacity-50"
          style={{ transform: [{ rotate: '15deg' }] }}
        />

        <View
          className="absolute bottom-[10%] -right-40 w-[450px] h-[600px] rounded-[200px] bg-brand-primary opacity-30"
          style={{ transform: [{ rotate: '40deg' }] }}
        />

        <SafeAreaView className="flex-1 px-8 pt-6 pb-6">
          <View className="pb-12 w-auto">
            <Image
              source={require("@/assets/images/icon-stripped.png")}
              resizeMode="contain"
              style={{height:300,width:"auto"}}
            />
          </View>

          {/* Hero Section */}
          <View className="flex-1">
            <View className="mb-10">
              <H1 className="text-[72px] leading-[0.9] text-brand-primary font-serif">Suwa</H1>
            </View>

            <View className="mb-6">
              <Body className="text-[32px] leading-tight text-text-charcoal font-medium">Your health.</Body>
              <Body className="text-[32px] leading-tight text-text-charcoal font-medium">Your privacy.</Body>
              <Body className="text-[32px] leading-tight text-accent-terracotta font-medium">Always.</Body>
            </View>

            {/* Separator Line */}
            <View className="w-12 h-[1px] bg-accent-terracotta opacity-50 mb-8" />

            <View className="max-w-[240px]">
              <BodySm className="text-[17px] leading-relaxed text-text-charcoal font-medium">
                Anonymous by design.{"\n"}Care that understands.
              </BodySm>
            </View>
          </View>

          <View className="mt-auto">
            <View className="flex-row items-center mb-10">
              <Pressable
                className="bg-brand-primary rounded-full px-10 py-6 flex-1 mr-4 shadow-sm active:opacity-90"
              >
                <Body className="text-text-muted font-semibold text-center text-lg">Begin your journey</Body>
              </Pressable>

              <Pressable
                className="bg-white rounded-full p-6 border border-border shadow-sm active:opacity-90"
              >
                <ArrowRight size={28} color="#2D3E35" />
              </Pressable>
            </View>

            {/* Pagination Dots */}
            <View className="flex-row justify-center gap-4 pb-2">
              <View className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
              <View className="w-2.5 h-2.5 rounded-full bg-border" />
              <View className="w-2.5 h-2.5 rounded-full bg-border" />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
