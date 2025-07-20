# SafeTravel - Google Maps Integration

## 🗺️ Google Maps Setup

### 1. Create a New API Key

**IMPORTANT**: The API key you shared publicly has been compromised. You must:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. **Delete the old API key** immediately
4. Create a new API key

### 2. Enable Required APIs

Enable these APIs in your Google Cloud project:
- **Maps SDK for Android**
- **Maps SDK for iOS** 
- **Geocoding API**
- **Places API** (optional, for place search)

### 3. Restrict Your API Key

**Critical Security Step**: Restrict your API key to prevent unauthorized usage:

#### For Web/Development:
- **Application restrictions**: HTTP referrers
- **Website restrictions**: Add your domains:
  - `http://localhost:*`
  - `https://yourdomain.com/*`
  - `https://*.yourdomain.com/*`

#### For Mobile Apps:
- **Application restrictions**: Android apps / iOS apps
- **Add your app's bundle identifier**

#### API Restrictions:
- Restrict to only the APIs you need:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Geocoding API

### 4. Environment Setup

1. **Never commit API keys to version control**
2. Create a `.env` file (already in .gitignore):

```bash
# Replace with your NEW restricted API key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_new_restricted_api_key_here
```

3. For production, set environment variables in your hosting platform

### 5. Platform Configuration

#### Android (`app.json`):
```json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_ANDROID_MAPS_API_KEY"
      }
    }
  }
}
```

#### iOS (`app.json`):
```json
{
  "ios": {
    "config": {
      "googleMapsApiKey": "YOUR_IOS_MAPS_API_KEY"
    }
  }
}
```

## 🚀 Features Added

### Enhanced Location Screen
- **Interactive Google Maps** with real-time location tracking
- **Emergency trail visualization** with polylines and markers
- **Toggle between map and list view** for location history
- **Dark mode support** with custom map styling
- **Improved geocoding** using Google's Geocoding API

### Map Features
- **Current location marker** with blue pin
- **Emergency session trails** with connected polylines
- **Multiple location markers** with numbered sequence
- **Zoom to fit** all locations automatically
- **User location button** and compass controls

### Security Improvements
- **Environment variable management** for API keys
- **Fallback geocoding** if Google API fails
- **Error handling** for network issues
- **Type-safe environment** variables

## 📱 Usage

1. **Location Tab**: View current location and emergency sessions
2. **Map View**: Interactive map showing location trails
3. **List View**: Detailed list of location points with timestamps
4. **Emergency Sessions**: Select any session to view its trail

## 🔒 Security Best Practices

1. **API Key Restrictions**: Always restrict API keys by domain/app
2. **Environment Variables**: Never hardcode API keys
3. **Regular Rotation**: Rotate API keys periodically
4. **Monitor Usage**: Set up billing alerts in Google Cloud
5. **Principle of Least Privilege**: Only enable required APIs

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:web
```

## 📋 TODO

- [ ] Add place search functionality
- [ ] Implement offline map caching
- [ ] Add custom map markers for different emergency types
- [ ] Integrate real-time traffic data
- [ ] Add geofencing for safe zones

---

**Remember**: Always keep your API keys secure and never share them publicly! 🔐
