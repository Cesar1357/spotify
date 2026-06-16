import { Image } from 'expo-image';
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Linking,
  ListRenderItem,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import TrackPlayer, { State } from 'react-native-track-player';

import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet/src';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Icon } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';
import { RFValue } from 'react-native-responsive-fontsize';
import { SafeAreaView } from 'react-native-safe-area-context';
import Repro from '../../components/Repro'; // Asegúrate de que esté en esta ruta

import { ExternalLink } from '@/components/ExternalLink';
import { MotiView } from 'moti';

import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useAuth } from '@/hooks/useAuth';
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp, where } from "firebase/firestore";

import { BottomSheetView } from '@gorhom/bottom-sheet';
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

type Artista = { uri: string; name: string; descripcion: string };

export default function Search() {
  const [artista, setArtista] = useState<Artista>({ uri: 'https://s1.ppllstatics.com/canarias7/www/multimedia/201704/14/media/cortadas/462076-1g_CSN462076_MG3928385--1248x702.jpg', name: '', descripcion: '' });
  const [songs, setSongs] = useState<any[]>([]);
  const [allSee, setAllSee] = useState<any[]>([])
  
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const [actualS2, setActualS2] = useState<any>({});
  const [visibleP, setVisibleP] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [allPlaylists, setAllPlaylists] = useState<any[]>([]);


  const [index, setIndex] = useState<number | undefined>(undefined);
  const [allTransactionsS,setAllTransactionsS] = useState<any[]>([])
  const showMiniHeader = useSharedValue(0); // 0 = oculto, 1 = visible
  const [actualizado, setActualizado] = useState(false);
  const [textB, setTextB] = useState("")
  const [kActive, setKActive] = useState(false);
  const searchRef = useRef<any>(null);
  let numerosSeleccionados = [];
  const [visible, setVisible] = useState(false);
  const { icon, setIcon, musica, setMusica, colorA, setColorA, playlistSongs, setPlaylistSongs, estado2, setEstado, modoReproduccion, setModoReproduccion, currentIndexRef, currentTrack, setCurrentTrack, setCurrentIndex, reproduciendoD, setReproduciendoD } = useApp();
  const { user, uid, loading } = useAuth() as any;
  const userAny = user as any;
  const { nameA } = useLocalSearchParams();

  const modalRef = useRef<BottomSheetModal>(null);
  const modalRefL = useRef<BottomSheetModal>(null);
  const modalRefP = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['35%', '35%'], []);
  const snapPoints2 = useMemo(() => ['100%', '100%'], []);
  const snapPoints3 = useMemo(() => ['30%', '40%'], []);

  const Option: React.FC<{ icon: string; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Icon type="ionicon" name={icon} color="gray" size={30} />
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );

  useEffect(()=>{
      try{
        getTransactionsP();
      }catch(err){
        console.log(err)
      }
    },[])

  useEffect(()=>{
      try{
        console.log("nnnnn",nameA)
        if(uid && db){
            obtener()
            getAutors();      
            getPlaylists();
        }
      }catch(err){
        console.log(err)
      }
    },[db,uid,nameA])

  useAnimatedReaction(
    () => showMiniHeader.value,
    (current, previous) => {
        if (current !== previous) {
        runOnJS(setVisible)(current === 1); // React se entera
        }
    },
    []
  );

  const animatedMiniHeaderStyle = useAnimatedStyle(() => {
  return {
    opacity: withTiming(showMiniHeader.value, { duration: 400 }),
    transform: [
      {
        translateY: withTiming(showMiniHeader.value ? 0 : -20, { duration: 400 }),
      },
    ],
  };
});
  

  const getAutors = async () => {
    const docRef = doc(db, "autores", String(nameA));
    const docSnap = await getDoc(docRef);
    const info = docSnap.data();
    if (!info) {
      setArtista({ uri: 'https://s1.ppllstatics.com/canarias7/www/multimedia/201704/14/media/cortadas/462076-1g_CSN462076_MG3928385--1248x702.jpg', name: String(nameA), descripcion: 'No se encontró información sobre este artista' });
      Alert.alert("No se encontró este artista","¿Quieres buscarlo en la web?", [
        {
          text: 'Si',
          onPress: () => {
            openLink(String(nameA));
          },
        },{
          text: 'No',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        }],{cancelable: true})
      return;
    }
    setArtista({
      uri: String(info?.uri ?? artista.uri),
      name: String(info?.name ?? nameA),
      descripcion: String(info?.descripcion ?? ''),
    });

  };

  const openLink = (searchText: string) => {
    const url = `https://www.google.com/search?q=${searchText}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error al abrir el enlace:', err);
      ToastAndroid.showWithGravity(
      "Error al abrir el enlace",
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
    );
    });
  };

  const obtener = async (si: boolean = false) => {
    try {
      // Cargar la colección desde AsyncStorage
      const coleccionGuardada = await AsyncStorage.getItem("descargas");
      if (coleccionGuardada !== null) {
         // Actualizar el estado local con la colección cargada
         setAllTransactionsS(JSON.parse(coleccionGuardada));
      }
    } catch (error) {
      console.error('Error al cargar la colección:', error);
    }
  }

  const getPlaylists = () => {
    const q = query(collection(db, 'people',String(uid),"playlists"),orderBy('importance', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => doc.data() as any);
      setAllPlaylists(docs)
    }); 
}

  const getTransactionsP = async() => {
      const q = query(collection(db, "musica"), where("autor","==", String(nameA)));
      const docs = await getDocs(q);
      const data = docs.docs.map(doc => doc.data() as any);
      setSongs(data);
      setAllSee(data);
}

const deletC = async () => {
    try {
      const nombreCancion = actualS2.name
      // Elimina la canción de la lista local
      const nuevaLista = allTransactionsS.filter(cancion => cancion.name !== nombreCancion);

      // Guarda la lista actualizada localmente
      await AsyncStorage.setItem('descargas', JSON.stringify(nuevaLista));

      // Elimina el archivo local
      const nombreArchivo = `${nombreCancion}.mp3`;
      const rutaArchivo = `${FileSystem.documentDirectory}${nombreArchivo}`;
      await FileSystem.deleteAsync(rutaArchivo);

      ToastAndroid.showWithGravity(
      `Se eliminó correctamente: ${nombreCancion}`,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
    );
      obtener()
    } catch (error) {
      console.error('Error al eliminar la canción y el archivo', error);
  }
};

async function descargarYGuardarArchivoLocalmente() {
  const nombreArchivo = actualS2.name+".mp3";

  const cancionExistente = allTransactionsS.find(
      (cancion) => cancion.name === actualS2.name
    );

    if (cancionExistente) {
      // La canción ya está descargada
       Alert.alert("Esta canción ya esta descargada","¿Quieres eliminarla?", [
      {
        text: 'Si',
        onPress: () => deletC(),
      },{
        text: 'No',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      }],{cancelable: true})
      return; // Salir de la función si la canción ya está descargada
    }

  try {
    const cancion = {"name":actualS2.name,"img":actualS2.img,"autor":actualS2.autor,"letra":actualS2.letra,"dateU":Date.now()};

    const fileInfo = await FileSystem.downloadAsync(
      actualS2.uri, // URL del archivo
      FileSystem.documentDirectory + nombreArchivo // Ruta local de destino
    );

    try {
      // Agrega la canción a la lista
      const nuevaLista = [...allTransactionsS, cancion];

      // Guarda la lista actualizada localmente
      await AsyncStorage.setItem('descargas', JSON.stringify(nuevaLista));
    } catch (error) {
      console.error('Error al agregar la canción a la lista', error);
    }
    ToastAndroid.showWithGravity(
      `Se descargó correctamente: ${actualS2.name}`,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
    );

    obtener()
  } catch (error) {
    console.error('Error al descargar y guardar el archivo localmente', error);
    ToastAndroid.showWithGravity(
      `Sucedió un error al descagar esta canción :c ${error}`,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
    );
  }
}

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
  

  const shufflePlaylist = (playlist: any[]) => {
    const copy = [...playlist];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildPlaylistQueue = (playlist: any[], mode: number, currentTrackObject: any) => {
    if (!Array.isArray(playlist) || playlist.length === 0) return [];
    const activeIndex = currentTrackObject
      ? playlist.findIndex((item) => item.id === currentTrackObject.id || item.title === currentTrackObject.title || item.name === currentTrackObject.title)
      : -1;

    if (mode === 3) return currentTrackObject ? [] : [playlist[0]];
    if (mode === 2) return shufflePlaylist(playlist.filter((_, idx) => idx !== activeIndex));
    if (mode === 0) return currentTrackObject ? [] : [playlist[0]];
    return activeIndex >= 0 ? playlist.slice(activeIndex + 1) : playlist;
  };

  const loadPlaylist = async (playlist: any[], mode = 0, preserveCurrent = false) => {
    if (!Array.isArray(playlist) || playlist.length === 0) return;
    const currentTrackId = await TrackPlayer.getCurrentTrack();
    const isPlayingTrackLoaded = currentTrackId !== null;
    const queue = buildPlaylistQueue(playlist, mode, isPlayingTrackLoaded ? currentTrack : null);

    if (isPlayingTrackLoaded && preserveCurrent) {
      await TrackPlayer.removeUpcomingTracks();
      if (queue.length > 0) await TrackPlayer.add(queue);
    } else {
      await TrackPlayer.reset();
      if (queue.length > 0) await TrackPlayer.add(queue);
    }
  };

  const _playAndPause = async () => {
    try {
      const currentTrackId = await TrackPlayer.getCurrentTrack();
      if (currentTrackId !== null) {
        if (estado2 === State.Playing) {
          setIcon('play');
          await TrackPlayer.pause();
        } else {
          setIcon('pause');
          await TrackPlayer.play();
        }
        return;
      }

      if (!playlistSongs || playlistSongs.length === 0) {
        ToastAndroid.showWithGravity('No hay canciones disponibles para reproducir', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
        return;
      }

      await loadPlaylist(playlistSongs, modoReproduccion, false);
      setIcon('pause');
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error al reproducir o pausar la canción:', error);
      ToastAndroid.showWithGravity('Error al reproducir o pausar la canción', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
    }
  };

  const renderPlaylist = ({ item }: { item: any }) => {
    try {
    return(
    <TouchableOpacity style={{padding:8,flexDirection:"row"}} onPress={() => getLikesPlaylist(item.name)}>
          <View style={{flexDirection:"row"}}>
            <Image
              source={{ uri: item.uri }} 
              style={{
                width: 50,
                height: 50,
                resizeMode: 'cover',
                borderRadius: 0,
                marginLeft: 5,
              }}></Image>
            <View style={{ marginLeft: 5}}>
              <Text
                style={{
                  fontSize: 20,
                  color: "white",
                  fontWeight: 'bold',
                  marginTop: 10,
                }}
                >
                {item.name}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
    );
  } catch (error) {
    console.error('Error al renderizar la playlist:', error);
    return null; // O manejar el error de otra manera
  }
}

  const change = async (uri: any, name: string, autor: string, img: string, generos: any, letra: any, dominant: any, index: number) => {  
      console.log("indice Change",index,"||",currentIndexRef.current)
        if(musica[2] !== "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkM03yBVebiMnBH5Kn2h3XazhS4sAIxn3w6w&s"){
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
                qplaylist: artista.name,
                donde: "Likes",
                dominantColor: dominant,
                isLocal: fileInfo.exists,
              };
              setMusica([name,autor,img,uri,generos,letra,artista.name,dominant]);
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
          }
        };




  const toggleOverlayP = () => {
    if(visibleP === false){
      setVisibleP(true);
      modalRefP.current?.present()
    }else{
      setVisibleP(false);
      modalRefP.current?.close()
    }
    
  };

  const activateA = () => {
    setModoReproduccion((prev) => (prev + 1) % 4);
  };

  const closeModal = () => {
    setModalVisible(false);
    modalRef.current?.close();
  };

  const modalT = (uri: any, name: string, autor: string, tipo: string, img: string, generos: any, letra: any, dominantColor: any) => {
    if(modalVisible === true){
      setModalVisible(false)
      modalRef.current?.close()
    }else{
      console.log(uri)
      setActualS2({"uri":uri,"name":name,"autor":autor,"tipo":tipo,"img":img,"generos":generos,"letra":letra,"dominantColor":dominantColor}) 
      setModalVisible(true)
      modalRef.current?.present()
    }
  }


  const getLikesPlaylist = async (playlist: string) => {
    if (!uid) {
      return;
    }
    const q = query(collection(db, "people", String(uid), "playlists", playlist, "Likes"), orderBy('popularity', 'desc'));
    const docs = await getDocs(q)
    const a = docs.docs.map(doc => doc.data());

    if (!userAny?.premium) {
      if(docs.size < 100){
  
        var searchLike = a.filter((song) => 
            song.name.includes(actualS2.name)
          );
  
        if(searchLike.length === 0){
          var letra = "";
          letra = actualS2.letra 
          if(letra===undefined){
            letra = "";
          }
  
            const ref = doc(db, "people", String(uid), "playlists", playlist, "Likes", actualS2.name);
            await setDoc(ref, {
              name:actualS2.name,
              uri:actualS2.uri,
              img:actualS2.img,
              tipo:actualS2.tipo,
              autor:actualS2.autor,
              generos:actualS2.generos,
              letra:letra, 
              dateU:Timestamp.now().toDate(),
              popularity: 1,
            }).then(() => {
              setVisibleP(false);
              ToastAndroid.showWithGravity(
                "Agregada correctamente a "+playlist,
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
              );
            })
            .catch((error) => {
              console.error('Error al actualizar:', error);
            });    
          }else{
            ToastAndroid.showWithGravity(
              "¡Esta canción ya se encuentra en esta playlist!",
              ToastAndroid.SHORT,
              ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
            );
          }
        }else{
          ToastAndroid.showWithGravity(
            "Has alcanzado el número máximo de likes :c",
            ToastAndroid.SHORT,
            ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
          );
        }
      }else{
  
        var searchLike = a.filter((song) => 
            song.name.includes(actualS2.name)
          );
  
        if(searchLike.length === 0){
          var letra = "";
          letra = actualS2.letra 
          if(letra===undefined){
            letra = "";
          }
  
            const ref = doc(db, "people", String(uid), "playlists", playlist, "Likes", actualS2.name);
            await setDoc(ref, {
              name:actualS2.name,
              uri:actualS2.uri,
              img:actualS2.img,
              tipo:actualS2.tipo,
              autor:actualS2.autor,
              generos:actualS2.generos,
              letra:letra, 
              dateU:Timestamp.now().toDate(),
              popularity: 1,
            }).then(() => {
              setVisibleP(false);
              ToastAndroid.showWithGravity(
                "Agregada correctamente a "+playlist,
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
              );
            })
            .catch((error) => {
              console.error('Error al actualizar:', error);
            });    
          }else{
            ToastAndroid.showWithGravity(
              "¡Esta canción ya se encuentra en esta playlist!",
              ToastAndroid.SHORT,
              ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
            );
          }
      }
    };

  
const renderItem: ListRenderItem<any> = ({ item, index }) => {
  try{
    var color = "white";
    if(musica[0] === item.name){
      color = "green"
      setIndex(index)
    }
    

    return (
      <TouchableOpacity style={{padding:8}} onPress={() => change(item.uri, item.name, item.autor,item.img,item.generos,item.letra,item.dominantColor,index)}>
        <View style={styles.box}>
          <Image
            source={{ uri: `${item.img}` }}
            style={{
              width: 55,
              height: 55,
              resizeMode: 'cover',
              marginLeft: 3,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"75%" }}>
            <Text
              style={{
                fontSize: 16,
                color: color,
                fontWeight: 'bold',
                marginLeft:5,
                marginTop: 2,
              }}
              adjustsFontSizeToFit={true} numberOfLines={1}>
              {item.name}
            </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: '#9F9F9F',
                  marginTop: 4,
                  marginLeft: 5,
                }}
                adjustsFontSizeToFit={true} numberOfLines={1}>
                {item.autor}
              </Text>
          </View>
           <TouchableOpacity onPress={(()=>modalT(`${item.uri}`, `${item.name}`, `${item.autor}`, `${item.tipo}`, `${item.img}`,item.generos,item.letra,item.dominantColor))} style={{marginLeft:"auto", marginRight:10, paddingTop:10}}>
              <Icon type={'ionicon'} name={'ellipsis-vertical'} color={'#CBCBCB'} size={RFValue(20)} style={{marginTop:0}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  } catch (error) {
    console.error('Error al renderizar el elemento:', error);
    return null; // O manejar el error de otra manera
  };
}

const getSongs = (text: string) => {
    console.log(text)
    setTextB(text)
    var a = ""

      a = text

    if(a === ""){
      setAllSee(songs)
    }else{
    const songs2 = songs;
    const findtext = a.toLowerCase();

      var searchData = songs2.filter(
        (song) => 
          song.name.toLowerCase().includes(findtext)
      );
      setAllSee(searchData); 
    }
  };

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    const y = event.contentOffset.y;
    showMiniHeader.value = y > 80 ? withTiming(1, { duration: 200 }) : withTiming(0, { duration: 100 });
  },
});


  return (
    <View style={{ backgroundColor: '#111111', flex: 1 }}>
      <SafeAreaView style={{ marginTop:RFValue(20)}} />
      {visible && (
      <Animated.View
        style={[
          {
            position: 'absolute',
            backgroundColor: '#111111',
            width: '100%',
            top: RFValue(30),
            zIndex: 2,
            flexDirection: 'column',
            alignItems: 'center',
            paddingVertical: 10,
            justifyContent: 'space-between',
          },
          animatedMiniHeaderStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth:"70%"}}>
            <Image
              source={{ uri: artista.uri }}
              style={{
                width: 45,
                height: 45,
                borderRadius: 5,
                marginRight: 8,
                marginLeft: 10,
              }}
            />
              <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', width:"90%" }} adjustsFontSizeToFit={true} numberOfLines={2}>
                {artista.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}>
              <TouchableOpacity style={{marginLeft:10}} onPress={() => activateA()}>
                <Icon type={'ionicon'} name={"repeat"} color={"white"} size={34} />
              </TouchableOpacity>
              <TouchableOpacity style={{}} onPress={(()=>_playAndPause())}>
                <Icon type={'ionicon'} name={icon === "play"?"play-circle":"pause-circle"} color={"green"} size={60} />
              </TouchableOpacity>
            </View>
          </View>
      </Animated.View>
      )}

      <Animated.ScrollView
        onScroll={scrollHandler}
        keyboardShouldPersistTaps="always"
        scrollEventThrottle={16}
      > 
        <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000 }}
            className="items-center mt-6"
        > 
          <View style={{ flexDirection: 'row', alignItems: 'center', width: "100%", alignSelf:"center",borderRadius:10,justifyContent:"center",padding:5,backgroundColor:"transparent",zIndex:showMiniHeader.value === 0? 3 : 0 }}>
            <Searchbar
                placeholder="¿Qué buscas?"
                onChangeText={getSongs}
                value={textB}
                ref={searchRef}
                style={{width:"95%",alignSelf:"center"}}
                onClearIconPress={() => {
                  setTextB("");
                  setAllSee(songs);
                  searchRef.current?.blur(); // Limpiar el campo de búsqueda
                }}
            />
          </View>
          {!kActive && (
            <TouchableOpacity onPress={()=>openLink(artista.name)} style={styles.profileImageContainer}>
            <Image
              source={{ uri: artista.uri }}
              style={{
                width: "90%",
                height: 200,
                backgroundColor: 'gray',
                borderRadius: 10,
                resizeMode: 'cover',
              }}></Image>
            <View style={{ marginTop: 10, width:"100%", justifyContent: "space-between", flexDirection: 'row', }}>
                {/* Texto centrado */}
                <Text
                adjustsFontSizeToFit={true}
                numberOfLines={2}
                  style={{
                    color: 'white',
                    fontSize: 30,
                    fontWeight: 'bold',
                    position: 'relative',
                    alignSelf: 'center',
                    textAlign: 'center',
                    width: '65%',
                    marginLeft:"auto"
                    
                  }}
                >
                  {artista.name}
                </Text>
                <TouchableOpacity style={{paddingLeft:"auto", paddingRight:10}} onPress={() => _playAndPause()}>
                    <Icon
                      type={'ionicon'}
                      name={icon === 'play' ? 'play-circle' : 'pause-circle'}
                      color={'green'}
                      size={60}
                    />
                  </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          </MotiView>
            
          <FlatList
            style={{ marginTop: 50}} 
            data={allSee}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            scrollsToTop={false}
            indicatorStyle={'white'}
            keyboardShouldPersistTaps="always"
            persistentScrollbar={true}
            keyExtractor={(item, index) => index.toString()}
            ListFooterComponent={
              <View style={{height:RFValue(200)}}></View>
            }
          />
        </Animated.ScrollView>  

        <BottomSheetModal
      ref={modalRefP}
      index={1}
      snapPoints={["20%", "40%", "60%", "80%", "100%"]} // 👈 alturas con scroll
      enableDynamicSizing={false} // usamos snapPoints
      backdropComponent={BottomSheetBackdrop}
      backgroundStyle={{ backgroundColor: '#111' }}
      onDismiss={toggleOverlayP}
      handleIndicatorStyle={{ backgroundColor: 'gray' }}
      stackBehavior="replace"
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{fontSize:15,textAlign:"center",color:"white",fontWeight:"bold",paddingTop:5}}>
          Añadir a una Playlist
        </Text>

        <View style={styles.infoRow}>
          <Image source={{ uri: actualS2.img }} style={styles.image} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.title} numberOfLines={1}>{actualS2.name}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{actualS2.autor}</Text>
          </View>
        </View>

          <BottomSheetFlatList
            data={allPlaylists}
            renderItem={renderPlaylist}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                  ¡No tienes más playlists! 
                </Text>
              </View>
            }
          />
      </BottomSheetView>
    </BottomSheetModal>

      <BottomSheetModal
        ref={modalRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onDismiss={() => {
          setModalVisible(false);
          modalRef.current?.close();
        }}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        stackBehavior='replace'
      >
        <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
          <View style={styles.infoRow}>
            <Image
              source={{ uri: actualS2.img }}
              style={styles.image}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.title} numberOfLines={1}>{actualS2.name}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{actualS2.autor}</Text>
            </View>
          </View>

          <Option icon="add-circle-outline" label="Agregar a una playlist" onPress={() => toggleOverlayP()} />
          <Option icon="cloud-download-outline" label="Descargar" onPress={() => {descargarYGuardarArchivoLocalmente()}} />
          <ExternalLink style={{}} href={`https://www.google.com/search?q=${musica[0]+" "+musica[1]}`}>
            <View style={styles.option}>
              <Icon type={'ionicon'} name={"globe-outline"} color={"gray"} size={34} />
              <Text style={styles.optionText}>Abrir en la web</Text>
            </View>
          </ExternalLink>
        </View>
      </BottomSheetModal> 
      <View
        style={{
          position: 'absolute',
          bottom: RFValue(40),
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Repro />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  box: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems:"center",
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomColor: '#444',
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 10,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginTop: 5,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 5,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 13,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
});
