const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

// DO NOT CHANGE
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
