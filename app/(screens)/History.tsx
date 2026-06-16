import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Dimensions,
  SectionList,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';

import { Icon } from 'react-native-elements';
import { RFValue } from 'react-native-responsive-fontsize';
import { SafeAreaView } from 'react-native-safe-area-context';
import Repro from '../../components/Repro'; // Asegúrate de que esté en esta ruta
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime);


import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, startAfter } from "firebase/firestore";
import TrackPlayer from 'react-native-track-player';

export default function History() {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [secciones, setSecciones] = useState<{ title: string; data: any[] }[]>([]);
  const [seccionesVisibles, setSeccionesVisibles] = useState<Record<string, boolean>>({});
  const [datosAgrupados, setDatosAgrupados] = useState<Record<string, any[]>>({});
  const { icon, setIcon, musica, setMusica, colorA, setColorA, playlistSongs, setPlaylistSongs, estado2, setEstado, modoReproduccion, setModoReproduccion, currentIndexRef, currentTrack, setCurrentTrack, setCurrentIndex, reproduciendoD, setReproduciendoD } = useApp();
  const [dondeA, setDondeA] = useState<any>(null);
  const [buttonIsVisible, setIsButtonVisible] = useState(true);
  const [dateA, setDateA] = useState("");
  const { uid, loading } = useAuth();

  const [index, setIndex] = useState<number | undefined>(undefined);
  const [actualizado, setActualizado] = useState(false);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  var dimen = Dimensions.get("window")

  useEffect(() => {
    if(uid){
        getHistorial(); 
        toggleSeccion("Hoy");
    }
  }, [uid]);

  useEffect(() => {
      const secciones = Object.keys(datosAgrupados).map((titulo) => ({
        title: titulo,
        data: seccionesVisibles[titulo] ? datosAgrupados[titulo] : [],
      }));
      setSecciones(secciones);
  }, [seccionesVisibles,datosAgrupados]);


    const toggleSeccion = (clave: string) => {
      setSeccionesVisibles((prev) => ({
        ...prev,
        [clave]: !prev[clave],
      }));
    };
 
  const getHistorial = () => {
    if (!uid) return;
    const q = query(collection(db, 'people', String(uid),"historyA"),limit(30),orderBy('dateU', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => doc.data() as any);
      setDondeA(querySnapshot.docs[querySnapshot.docs.length - 1]);
      const todo = docs as any[];
      const datosAgrupados = agruparPorFecha(todo);
      const secciones = Object.keys(datosAgrupados).map((titulo) => ({
        title: titulo,
        data: seccionesVisibles[titulo] ? datosAgrupados[titulo] : [],
      }));
      setAllTransactions(docs)
      setSecciones(secciones);
      setDatosAgrupados(datosAgrupados);
      if(querySnapshot.empty === true){
        setAllTransactions([]);
      }
    });
  }

  const agruparPorFecha = (data: any[]) => {
  const hoy = dayjs().startOf("day");
  const grupos: Record<string, any[]> = {};

  data.forEach((item) => {
    const fecha = dayjs(item.dateU.toDate()).startOf("day");

    let claveGrupo = '';
    if (fecha.isSame(hoy, "day")) {
      claveGrupo = "Hoy";
    } else if (fecha.isSame(hoy.subtract(1, "day"), "day")) {
      claveGrupo = "Ayer";
    } else if (fecha.isSame(hoy.subtract(2, "day"), "day")) {
      claveGrupo = "Antier";
    } else {
      claveGrupo = fecha.format("DD/MM/YYYY");
    }

    if (!grupos[claveGrupo]) {
      grupos[claveGrupo] = [];
    }
    grupos[claveGrupo].push(item);
  });

  return grupos;
};

const getMoreHistorial =async () => {
  if (!uid || !dondeA) return;
  const q = query(collection(db, 'people', String(uid),"historyA"),orderBy('dateU', 'desc'),limit(15),startAfter(dondeA));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => doc.data() as any);

      var todo = allTransactions.concat(docs as any[])
      const datosAgrupados = agruparPorFecha(todo);
      const secciones = Object.keys(datosAgrupados).map((titulo) => ({
        title: titulo,
        data: seccionesVisibles[titulo] ? datosAgrupados[titulo] : [],
      }));
      
      setAllTransactions(todo)
      setDatosAgrupados(datosAgrupados);
      setSecciones(secciones);
      setDondeA(querySnapshot.docs[querySnapshot.docs.length - 1]);
    });
}

  const errase = async(name: string) => {
    const ref = doc(db, "people", uid,"historyA",name);
    await deleteDoc(ref)
  }

   const change = async (uri: any, name: string, autor: string, img: string, generos: any, letra: any, dominant: any, index: number) => {  
      console.log("indice Change",index,"||",currentIndexRef.current)
            try {
              // Verificamos si el archivo existe
              const nombreArchivo = name+".mp3"
              const rutaLocal = `${FileSystem.documentDirectory}${nombreArchivo}`;
              const fileInfo = await FileSystem.getInfoAsync(rutaLocal);
              const trackData = {
                title: name,
                artist: autor,
                artwork: img,
                url: Array.isArray(uri)?uri[0]:uri,
                vid: Array.isArray(uri)?uri[1]:null,
                generos,
                letra,
                qplaylist: "Historial",
                donde: "Historial",
                dominantColor: dominant,
                isLocal: fileInfo.exists,
              };
              setMusica([name,autor,img,uri,generos,letra,"Historial",dominant]);
              setCurrentTrack(trackData);
              setEstado(true);
              if (fileInfo.exists) {
                console.log("ex")
                await TrackPlayer.load({
                  id: index,
                  url: rutaLocal,
                  vid: trackData.vid,
                  title: trackData.title,
                  artist: trackData.artist,
                  artwork: trackData.artwork,
                  dominantColor: trackData.dominantColor,
                  generos: trackData.generos,
                  letra: trackData.letra,
                  qplaylist: trackData.qplaylist,
                  donde: trackData.donde,
                  isLocal: true
                })
              } else {
                console.log("noex")
                await TrackPlayer.load({
                  id: index,
                  url: trackData.url,
                  vid: trackData.vid,
                  title: trackData.title,
                  artist: trackData.artist,
                  artwork: trackData.artwork,
                  dominantColor: trackData.dominantColor,
                  generos: trackData.generos,
                  letra: trackData.letra,
                  qplaylist: trackData.qplaylist,
                  donde: trackData.donde,
                  isLocal: false
                })
              }
              await TrackPlayer.play();
              setIcon('pause');
              currentIndexRef.current = index;
            } catch (error) {
              console.error('Error al verificar el archivo:', error);
              ToastAndroid.showWithGravity(
                "Error al reproducir la canción",
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM
              );
            }
        };
        
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('AppState', appState.current);
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    var color = "white";
    var dateA = item.dateS.slice(16,21)

    if(musica[8] === item.dateU && musica[0] === item.name){ 
      color = "green"
      setIndex(index)
    }

   
    return (
      <TouchableOpacity style={{padding:8}} onPress={() => change(item.uri, item.name, item.autor, item.img,item.generos,item.letra,item.dominantColor,index)}>
        <View style={styles.box}>      
          <Image
            source={{ uri: `${item.img}` }}
            style={{
              width: 50,
              height: 50,
              resizeMode: 'cover',
              borderRadius: 0,
              marginLeft: 5,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"75%" }}>
            <Text
              style={{
                fontSize: 15,
                color: color,
                fontWeight: 'bold',
                marginTop: 2,
              }}
              adjustsFontSizeToFit={true} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{flexDirection:"row"}}>
              <Text
                style={{
                  fontSize: 13,
                  color: 'white',
                  marginTop: 2,
                  marginLeft: 2,
                  maxWidth:"60%"
                }}
                numberOfLines={1}>
                {item.autor}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight:"bold",
                  color: 'white',
                  marginLeft: 5,
                  marginTop:-4
                }}>
                 · 
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: 'white',
                  marginTop: 2,
                  marginLeft: 5,
                }}
                adjustsFontSizeToFit={true} numberOfLines={1}>
                {dateA}
              </Text>
            </View>
          </View>
           <TouchableOpacity onPress={(()=>errase(item.dateS))}>
              <Icon type={'ionicon'} name={'close'} color={'white'} size={RFValue(30)} style={{marginTop:5}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );

  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const isLastMessageVisible = offsetY !== 0;

    setIsButtonVisible(!isLastMessageVisible);
    
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<any> }) => {
    try {
      if (viewableItems.length > 0) {
        const firstVisibleItem = viewableItems[viewableItems.length-1];
        
        if (firstVisibleItem !== undefined && firstVisibleItem.item.dateU !== undefined) {
          const firstVisibleIndex = firstVisibleItem.item.dateS;
          const firstVisibleIndex2 = firstVisibleItem.item.dateU;
          const fecha = dayjs(firstVisibleItem.item.dateU.toDate());
          let claveGrupo = '';
          if (fecha.isToday()) {
            claveGrupo = 'Hoy';
          } else if (fecha.isYesterday()) {
            claveGrupo = 'Ayer';
          } else if (dayjs().diff(fecha, 'day') === 2) {
            claveGrupo = 'Antier';
          } else {
            claveGrupo = fecha.format('DD/MM/YYYY');
          }
          if (claveGrupo.length > 1 && claveGrupo !== dateA) {
            setDateA(claveGrupo);
          }
        }
      } else {
        console.log('No hay elementos visibles en este momento');
      }
    } catch (error) {
      console.error('Error al procesar los elementos visibles:', error);
    }
  }).current;

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.container}>
      <View style={{backgroundColor: '#111111',flexDirection:"row",alignItems:"center",alignContent:"center",marginTop:30,marginBottom:40,justifyContent:"space-between"}}> 
        <Text
          style={{
            fontSize: 27,
            marginLeft: 5,
            color: 'white',
            fontWeight: 'bold',
          }}>
          {buttonIsVisible? "Historial" : dateA}
        </Text>
      </View>

      <SectionList
        sections={secciones}
        onViewableItemsChanged={onViewableItemsChanged}
        onScroll={handleScroll}
        keyExtractor={(item, index) => item.dateU + index}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <TouchableOpacity
            onPress={() => toggleSeccion(title)}
            style={{ paddingVertical: 10, backgroundColor: '#1a1a1a', paddingHorizontal: 10 }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {title} {seccionesVisibles[title] ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          allTransactions.length !== 0 ? (
            <TouchableOpacity style={{ width: "25%", alignSelf: "center", marginBottom: 150 }} onPress={getMoreHistorial}>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "white" }}>Cargar más...</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", marginTop: dimen.height / 3 }}>
              ¡Tu historial está vacío!
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "gray" }}>
              Escucha canciones para llenarlo
            </Text>
          </View>
        }
      /> 
      <View
        style={{
            position: 'absolute',
            bottom: RFValue(25),
            width: '100%',
            alignItems: 'center',
        }}
        >
        <Repro />
        </View>  
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: '#111111',
  },

  upperContainer: {
    backgroundColor: '#111111',
  },
  box: {
    backgroundColor: '#111111',
    flexDirection: 'row',
  },
});
