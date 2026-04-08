const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove .mjs from source extensions to prevent Metro from resolving
// zustand's ESM build which uses import.meta (breaks on web)
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

module.exports = config;
