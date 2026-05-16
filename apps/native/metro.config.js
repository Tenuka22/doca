const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

// biome-ignore lint/correctness/noGlobalDirnameFilename: Needed
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
