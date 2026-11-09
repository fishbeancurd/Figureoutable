import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Grandstander_600SemiBold, Grandstander_700Bold } from '@expo-google-fonts/grandstander';
import { Mulish_400Regular, Mulish_600SemiBold, Mulish_700Bold, Mulish_800ExtraBold } from '@expo-google-fonts/mulish';
import { StoreProvider, useStore } from '@/lib/store';
import { CelebrateProvider } from '@/components/Celebrate';
import { C } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useStore();
  useEffect(() => {
    if (ready && fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsReady]);
  if (!ready || !fontsReady) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="log/[type]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Grandstander_600SemiBold,
    Grandstander_700Bold,
    Mulish_400Regular,
    Mulish_600SemiBold,
    Mulish_700Bold,
    Mulish_800ExtraBold,
  });
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider>
        <StoreProvider>
          <CelebrateProvider>
            <StatusBar style="dark" />
            <Gate fontsReady={fontsLoaded || !!fontError} />
          </CelebrateProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
