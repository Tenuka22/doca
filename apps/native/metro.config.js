const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const projectRoot = import.meta.dirname;

const config = getDefaultConfig(projectRoot);

module.exports = withNativewind(config);
