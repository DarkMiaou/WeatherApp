import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { ExpoRoot } from 'expo-router';
import { auth } from './src/firebase';
import { inMemoryPersistence } from 'firebase/auth';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await auth.setPersistence(inMemoryPersistence);
        await auth.signOut();

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error('Error during initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // @ts-ignore:
  const ctx = require.context('./app');
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ExpoRoot context={ctx} />
    </View>
  );
}