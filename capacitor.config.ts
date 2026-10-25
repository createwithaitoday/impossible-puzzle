import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.impossible.puzzle',
  appName: 'IMPOSSIBLE',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#05060a',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#05060a',
      showSpinner: false,
      launchShowDuration: 600,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#05060a',
    },
  },
}

export default config
