import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Tabs } from 'expo-router';
import { Icon } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Repro from '../../components/Repro'; // Asegúrate de que esté en esta ruta

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={({ route }) => ({
            tabBarActiveTintColor: "green",
            headerShown: false,
            tabBarActiveBackgroundColor:"rgba(0, 0, 0, 0)",
            tabBarShowLabel:false,
            tabBarButton: HapticTab,
            animation: "shift",
            tabBarStyle: Platform.select({
              default: {
                borderTopWidth: 0,
                position:'absolute',
                backgroundColor: 'rgba(0, 0, 0, 0)', // 🔥 importante: no pongas color aquí
                elevation: 0,  
                overflow: 'visible'
              },
            }),
          })}>
          <Tabs.Screen
            name="index"
            options={{
              tabBarIcon: ({ color }) =>  <Ionicons name={"home"} size={30} color={color} style={{overflow: 'visible',width:40,height:40,marginTop:27}}/>,
            }}
          />
          <Tabs.Screen
            name="Search"
            options={{
              title: 'Buscar',
              tabBarIcon: ({ color }) => <IconSymbol size={33} style={{overflow: 'visible',width:40,height:40,marginTop:27}} name="magnifyingglass" color={color} />,
            }}
          />
          <Tabs.Screen
            name="Biblioteca"
            options={{
              title: 'Biblioteca',
              tabBarIcon: ({ color }) => <Icon type={'material'} name={"queue-music"}  size={35} color={color} style={{overflow: 'visible',width:40,height:40,marginTop:25}}/>,
            }}
          />
        </Tabs>
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + 30,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Repro />
          </View>
      </View>
    </>
  );
}
