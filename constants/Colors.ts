export const LightColors = {
  primary: '#2563EB', // Blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  
  secondary: '#10B981', // Green
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  
  danger: '#DC2626', // Red
  dangerLight: '#EF4444',
  dangerDark: '#B91C1C',
  
  warning: '#F59E0B', // Amber
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
  },
  
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#6B7280',
  },
  
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.25)',
  }
};

export const DarkColors = {
  primary: '#3B82F6', // Blue
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  secondary: '#34D399', // Green
  secondaryLight: '#6EE7B7',
  secondaryDark: '#10B981',
  
  danger: '#EF4444', // Red
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  
  warning: '#FBBF24', // Amber
  warningLight: '#FCD34D',
  warningDark: '#F59E0B',
  
  success: '#34D399',
  successLight: '#6EE7B7',
  successDark: '#10B981',
  
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#111827',
  },
  
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
    dark: '#000000',
  },
  
  border: {
    light: '#374151',
    medium: '#4B5563',
    dark: '#6B7280',
  },
  
  shadow: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.4)',
    dark: 'rgba(0, 0, 0, 0.6)',
  }
};

// Export the current theme colors
export const Colors = LightColors; // This will be dynamically set based on theme
