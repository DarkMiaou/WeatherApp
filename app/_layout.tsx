import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }} />
    </>
  );
}
