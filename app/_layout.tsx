import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { setupTrackPlayer } from '../config/SetUpPlayer';
import { AppProvider } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    setupTrackPlayer();
    onFetchUpdateAsync();
  }, []);

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PaperProvider>
          <AppProvider>
            
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'black' },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name="(sesion)/create" options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name="(sesion)/login" options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name="(screens)/Playlist" options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name="(screens)/Autor" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
                <Stack.Screen name="(screens)/Settings" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
                <Stack.Screen name="(screens)/History" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
                <Stack.Screen
                  name="(screens)/ReproGrande"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'slide_from_bottom',
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                />
                <Stack.Screen
                  name="[...catchAll]"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'none',
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
          </AppProvider>
        </PaperProvider>
      </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
