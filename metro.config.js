const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle native-only modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add explicit aliases for native-only modules
config.resolver.extraNodeModules = {
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'web-stubs/codegenNativeCommands.js'),
  'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'web-stubs/codegenNativeComponent.js'),
};

// Add custom resolver to handle native-only modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle native-only modules when building for web
  if (platform === 'web') {
    if (moduleName === 'react-native/Libraries/Utilities/codegenNativeCommands') {
      return {
        filePath: path.resolve(__dirname, 'web-stubs/codegenNativeCommands.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'react-native/Libraries/Utilities/codegenNativeComponent') {
      return {
        filePath: path.resolve(__dirname, 'web-stubs/codegenNativeComponent.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Fall back to the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
