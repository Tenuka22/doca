import "@expo/metro-runtime";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  const { registerGlobals } = require("react-native-webrtc");
  registerGlobals();
}

import "expo-router/entry";
