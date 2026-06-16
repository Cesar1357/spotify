import * as Linking from 'expo-linking';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { setupTrackPlayer } from '../config/SetUpPlayer';
import { useApp } from './../context/AppContext';

export default function CatchAll() {
  const router = useRouter();
  const segments = useSegments();
  const { lastRouteRef } = useApp();
  const pathname = usePathname();

    useEffect(() => {
        setupTrackPlayer();
      }, []);

    useEffect(() => {
    Linking.getInitialURL().then((url) => {
      console.log("empezando redirect: ",url);
      console.log("path:",pathname);
        if (url === "trackplayer://notification.click") {
          // Si ya estamos en ReproGrande, no navegues
          console.log(lastRouteRef.current);
          if (lastRouteRef.current === "/(screens)/ReproGrande") {
            console.log("Ya estás en ReproGrande, no navego");
            router.back();
            return;
          }
          console.log("navegando");
          router.dismissTo("/(tabs)");
          setTimeout(() => {
            router.push("/(screens)/ReproGrande");
            lastRouteRef.current = "/(screens)/ReproGrande";
          }, 100);
        }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log("empezando redirect2");
      console.log("Catch url", url);
      console.log("path2:",pathname);
      console.log(lastRouteRef.current,"1");
      if (url) {
        console.log("||2", url);
        console.log(segments)
        if (url === "trackplayer://notification.click") {
          if (lastRouteRef.current === "/(screens)/ReproGrande") {
            console.log("Ya estás en ReproGrande, no navego2");
            return;
          }
          console.log("navegando2");
          router.dismissTo("/(tabs)");
          setTimeout(() => {
            router.push("/(screens)/ReproGrande");
            lastRouteRef.current = "/(screens)/ReproGrande";
          }, 100);
        }
      }
    });

    return () => subscription.remove();
  }, [lastRouteRef,pathname]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
      <Text></Text>
    </View>
  );
}
