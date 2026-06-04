module.exports = (api) => {
  api.cache(true);
  const plugins = [];

  plugins.push("nativewind/babel");

  plugins.push("react-native-worklets/plugin");

  return {
    presets: ["babel-preset-expo"],

    plugins,
  };
};
