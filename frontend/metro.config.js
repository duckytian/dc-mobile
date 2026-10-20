const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite on web loads a .wasm binary; Metro must treat it as an asset.
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

module.exports = withNativeWind(config, { input: "./global.css" });
