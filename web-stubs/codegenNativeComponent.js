// Web stub for react-native/Libraries/Utilities/codegenNativeComponent
// This provides a no-op implementation for web builds

const React = require('react');

module.exports = function codegenNativeComponent() {
  // Return a basic View component for web
  return React.forwardRef((props, ref) => {
    return React.createElement('div', { ...props, ref });
  });
};
