import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, usePathname } from "expo-router";

import { useAuth } from '@/hooks/useAuth';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import TrackPlayer, { State } from 'react-native-track-player';

import { ExternalLink } from '@/components/ExternalLink';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet/src';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { Modal, Searchbar } from 'react-native-paper';
import { RFValue } from 'react-native-responsive-fontsize';
import { SafeAreaView } from 'react-native-safe-area-context';
import Repro from '../../components/Repro'; // Asegúrate de que esté en esta ruta
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp, writeBatch } from "firebase/firestore";

type Track = {
  id?: number | string;
  url: string;
  vid?: any;
  title?: string;
  artist?: string;
  artwork?: string;
  dominantColor?: string;
  generos?: any;
  letra?: any;
  qplaylist?: string;
  donde?: string;
  isLocal?: boolean;
  [key: string]: any;
};

export default function Search() {
  const [lists, setLists] = useState<any[]>([]);
  const [allSee, setAllSee] = useState<Track[]>([]);
  const { setQplaylist, icon, setIcon, musica, setMusica, colorA, setColorA, playlistSongs, setPlaylistSongs, estado2, modoReproduccion, setModoReproduccion, currentIndexRef, currentTrack, setCurrentTrack, setCurrentIndex, reproduciendoD, setReproduciendoD } = useApp();
  const [allTransactionsS,setAllTransactionsS] = useState<any[]>([])
  const [allPlaylists, setAllPlaylists] = useState<any[]>([]);
  const pathname = usePathname();
  
  const [iconLC, setIconLC] = useState("white"); 

  const { qplaylist, publica, publicaN } = useLocalSearchParams();
  const qp = Array.isArray(qplaylist) ? qplaylist[0] : (qplaylist ?? 'Likes');
  const [nameAP, setNameAP] = useState("");
  const [uidAP, setUidAP] = useState("");
  const [popularityAP, setPopularityAP] = useState(0);
  const [dateAP, setDateAP] = useState("");

  const [actualS2, setActualS2] = useState<any>({});

  const [visibleN, setVisibleN] = useState(false)
  const [visibleP, setVisibleP] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [filtro, setFiltro] = useState("dateU");
  const [internet, setInternet] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [nD, setND] = useState(0)
  const [nT, setNT] = useState(0)

  const [buscar, setBuscar] = useState(false);
  const [busquedaA, setBusquedaA] = useState(false);

  const [textB, setTextB] = useState("")

  const [dominantColor, setDominantColor] = useState("#404040")
  const [Nnombre, setNnombre] = useState("");

  const { uid, loading } = useAuth();
  const [user, setUser] = useState<any>(null);
  var dimen = Dimensions.get("window")

  const searchRef = useRef<TextInput>(null);
  const searchVersionRef = useRef(0);
  const [visibleI, setVisibleI] = useState(false);
  const [visibleA, setVisibleA] = useState(false);
  
  const modalRef = useRef<BottomSheetModal>(null);
  const modalRefP = useRef<BottomSheetModal>(null);
  const modalRefD = useRef<BottomSheetModal>(null);
  const modalRefPO = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '45%'], []);
  const snapPoints2 = useMemo(() => ['40%', '40%'], []);
  const snapPoints3 = useMemo(() => ['15%', '25%'], []);
  const snapPoints4 = useMemo(() => ['40%', '40%'], []);


  const Option: React.FC<{ icon: string; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
      <TouchableOpacity style={styles.option} onPress={onPress}>
        <Icon type="ionicon" name={icon} color="gray" size={30} />
        <Text style={styles.optionText}>{label}</Text>
      </TouchableOpacity>
    );

  useEffect(() => {
  setQplaylist(qp);

  const cargarPlaylist = async () => {
    if (lists) {
      const qplaylist2 = publica ? "Likes" : qp;

      // 🔄 Revisamos todas las canciones en paralelo
      const playlist = await Promise.all(
        lists.map(async (item, index) => {
          const nombreArchivo = `${item.name}.mp3`;
          const rutaLocal = `${FileSystem.documentDirectory}${nombreArchivo}`;
          let urlFinal = Array.isArray(item.uri) ? item.uri[0] : item.uri;
          let isLocal = false;

          try {
            const fileInfo = await FileSystem.getInfoAsync(rutaLocal);
            if (fileInfo.exists) {
              //console.log("✅ Archivo local encontrado:", rutaLocal);
              urlFinal = rutaLocal;
              isLocal = true; // 👉 marcar que es local
            } else {
              //console.log("🌐 Usando URL remota:", urlFinal);
            }
          } catch (error) {
            console.warn("⚠️ Error revisando archivo local:", error);
          }
          
          return {
            id: index,
            url: urlFinal,
            vid: Array.isArray(item.uri) ? item.uri[1] : null,
            title: item.name,
            artist: item.autor,
            artwork: item.img,
            dominantColor: item.dominantColor,
            generos: item.generos,
            letra: item.letra,
            qplaylist: qplaylist2,
            donde: qplaylist2,
            isLocal: isLocal, // 👈 nuevo campo
          };
        })
      );
      console.log("cargando playlist");
      setPlaylistSongs(playlist);
      setAllSee(playlist);
    }
  };

  cargarPlaylist();
}, [publica, pathname, lists]);


  useEffect(() => {
      const backAction = () => {
        if(visibleP){
          modalRefP.current?.close()
          return true;
        }
        if(modalVisible){
          modalRef.current?.close()
          return true;
        }
        setQplaylist("Likes");
        return false; // Permite que la navegación ocurra normalmente
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
      return () => backHandler.remove();
    }, [ visibleP, modalVisible]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined = undefined;
    let unsubscribe2: (() => void) | undefined = undefined;

    const checkInternetConnection = async () => {
      try{
        obtener(false);
        const state = await NetInfo.fetch();
        if(busquedaA === false && qplaylist !== "Descargas"){
          if (state.isConnected) {
            if(uid){
              getUser()
              getPlaylists();
              if(!publica){
                const q = query(collection(db, 'people', String(uid),"playlists",String(qp),"Likes"),orderBy(filtro, 'desc'));
                unsubscribe = onSnapshot(q, (querySnapshot) => {
                  if(querySnapshot.empty){
                    setLists([]);
                    setAllSee([])
                  } else { 
                    const data = querySnapshot.docs.map(doc => doc.data());
                    setLists(data);             
                    setNT(data.length)
                  }
                });
              }else{
                console.log("es una playlist publica")
                const q = query(collection(db, 'playlists', String(qp), String(publicaN)),orderBy(filtro, 'desc'));
                unsubscribe = onSnapshot(q, (querySnapshot) => {
                  if(querySnapshot.empty){
                    setLists([]);
                    setAllSee([])
                  } else { 
                    const data = querySnapshot.docs.map(doc => doc.data());
                    setLists(data);
                    console.log(data);
                    setNT(data.length)
                  }
                });
              }
            }        
          }else{
            obtener(true);
            setInternet(false)
          }
        }
      }catch(err){
        console.log(err)
      }
    }

    console.log(qplaylist)
    checkInternetConnection()

    return () => {
      if(unsubscribe){
        unsubscribe(); // Limpia el primer escucha
      }
      if (unsubscribe2) {
        (unsubscribe2 as any)();
      }
    };

  }, [busquedaA,filtro,uid,qplaylist,publica,publicaN]);

  useEffect(() => {
    const f = async() => {
      if(publica){
        const docRef = doc(db, "playlists", String(qp));
        const docSnap = await getDoc(docRef);
        const info = docSnap.data();
        if(info){
          setNameAP(info.byN ?? '');
          setPopularityAP(info.popularity ?? 0);
          setUidAP(info.by ?? '');
          const date = info.dateU?.toDate?.()
          ? info.dateU.toDate().toString().split(' ').splice(0,5).join(' ')
          : '';
          setDateAP(date);
        }
      }
    }
    f();
  },[publica,publicaN]); 

  useEffect(() => {
    if(musica[7] && colorA === "true"){
      setDominantColor(musica[7])
    }else{
      setDominantColor("#404040")
    }
  },[musica[0]]); 
  
  const getUser =async () => {
    const docRef = doc(db, "people", String(uid));
    const docSnap = await getDoc(docRef);
    const info = docSnap.data()
    setUser(info)
  }

  const obtener = async (si: boolean = false) => {
    console.log("obteniendo")
  try {
    // Cargar la colección desde AsyncStorage
    const coleccionGuardada = await AsyncStorage.getItem("descargas");
    if (coleccionGuardada !== null) {
      // Parsear la colección
      const coleccionParseada = JSON.parse(coleccionGuardada);
      console.log("Colección cargada desde AsyncStorage:");
      // Ordenar la colección por el campo dateU en orden descendente
      
      var coleccionOrdenada;
      if(filtro === "dateU"){
        coleccionOrdenada = coleccionParseada.sort((a: any, b: any) => b.dateU - a.dateU);
      }else if(filtro === "popularity"){
        coleccionOrdenada = coleccionParseada.sort((a: any, b: any) => b.popularity - a.popularity);
      }
      // Actualizar el estado local con la colección ordenada
      setAllTransactionsS(coleccionOrdenada);

      if (si === true || internet == false || qplaylist === "Descargas") {
        console.log("mostrando descargas");
        setLists(coleccionOrdenada);
        setAllSee(coleccionOrdenada) 
        setNT(coleccionOrdenada.length)
      }
    }
  } catch (error) {
    console.error('Error al cargar la colección:', error);
  }
};

  const getPlaylists = () => {
    const q = query(collection(db, 'people', String(uid),"playlists"),orderBy('importance', 'desc'));
    const unsubscribeLocal = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs
      .map((doc) => doc.data() ?? {})
      .filter((playlist: any) => playlist.name !== qp);
      setAllPlaylists(docs)
    });
    return unsubscribeLocal;
  }


  const change = async (uri: any, name: string, autor: string, img: string, generos: any, letra: any, dominant: any, index: number) => {  
    console.log("indice Change",index,"||",currentIndexRef.current)
      if(musica[2] !== "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkM03yBVebiMnBH5Kn2h3XazhS4sAIxn3w6w&s"){
          try {
            // Verificamos si el archivo existe
            const nombreArchivo = name+".mp3"
            const rutaLocal = `${FileSystem.documentDirectory}${nombreArchivo}`;
            const fileInfo = await FileSystem.getInfoAsync(rutaLocal);
            if (fileInfo.exists) {
              console.log("ex")
              setMusica([name,autor,img,uri,generos,letra,qplaylist,dominant])
              await TrackPlayer.load({
                id: index,
                url: rutaLocal,
                vid: Array.isArray(uri)?uri[1]:null,
                title: name,
                artist: autor,
                artwork: img,
                dominantColor: dominant,
                generos: generos,
                letra: letra,
                qplaylist:qplaylist,
                donde:qplaylist,
                isLocal: true
              })
              await TrackPlayer.play();
            } else {
              console.log("noex")
              try {
                setMusica([name,autor,img,uri,generos,letra,qplaylist,dominant])
                await TrackPlayer.load({
                id: index,
                url: Array.isArray(uri)?uri[0]:uri,
                vid: Array.isArray(uri)?uri[1]:null,
                title: name,
                artist: autor,
                artwork: img,
                dominantColor: dominant,
                generos: generos,
                letra: letra,
                qplaylist:qplaylist,
                donde:qplaylist,
                isLocal: false
              })
              await TrackPlayer.play();
              } catch (error) {
                ToastAndroid.showWithGravity(
                  "Error al reproducir la canción",
                  ToastAndroid.SHORT,
                  ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
                );
              }
            }
           currentIndexRef.current = index;
          } catch (error) {
            console.error('Error al verificar el archivo:', error);
          }
        }
      };

  const shufflePlaylist = (playlist: Track[]) : Track[] => {
    const copy = [...playlist];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildPlaylistQueue = (playlist: Track[], mode: number, currentTrackObject?: Track | null): Track[] => {
    if (!Array.isArray(playlist) || playlist.length === 0) {
      return [];
    }

    const activeIndex = currentTrackObject
      ? playlist.findIndex(
          (item) => item.id === currentTrackObject.id || item.title === currentTrackObject.title
        )
      : -1;

    if (mode === 3) {
      return currentTrackObject ? [] : [playlist[0]];
    }

    if (mode === 2) {
      const remaining = playlist.filter((item, index) => index !== activeIndex);
      return shufflePlaylist(remaining);
    }

    if (mode === 0) {
      return currentTrackObject ? [] : [playlist[0]];
    }

    // mode === 1 or fallback order mode
    return activeIndex >= 0 ? playlist.slice(activeIndex + 1) : playlist;
  };

  const loadPlaylist = async (playlist: Track[] | any, mode = 0, preserveCurrent = false): Promise<void> => {
    if (!Array.isArray(playlist) || playlist.length === 0) {
      return;
    }

    const currentTrackId = await TrackPlayer.getCurrentTrack();
    const isPlayingTrackLoaded = currentTrackId !== null;
    const queue = buildPlaylistQueue(playlist, mode, isPlayingTrackLoaded ? currentTrack : null);

    const normalizeTrack = (item: any) => {
      const url = item.url ?? (Array.isArray(item.uri) ? item.uri[0] : item.uri) ?? item.audio ?? item.src ?? null;
      return {
        ...(item.id !== undefined ? { id: item.id } : {}),
        url,
        title: item.title ?? item.name ?? '',
        artist: item.artist ?? item.autor ?? '',
        artwork: item.artwork ?? item.img ?? undefined,
        ...item,
      };
    };

    if (isPlayingTrackLoaded && preserveCurrent) {
      await TrackPlayer.removeUpcomingTracks();
      if (queue.length > 0) {
        await TrackPlayer.add(queue.map(normalizeTrack) as any);
      }
    } else {
      await TrackPlayer.reset();
      if (queue.length > 0) {
        await TrackPlayer.add(queue.map(normalizeTrack) as any);
      }
      if (queue.length > 0) {
        currentIndexRef.current = 0;
      }
    }
  };


const _playAndPause = async () => {
  try {
    const currentTrackId = await TrackPlayer.getCurrentTrack();
    if (currentTrackId !== null) {
      if (estado2 === State.Playing) {
        setIcon('play');
        await TrackPlayer.pause();
      } else if (estado2 === State.Paused || estado2 === State.Ready || estado2 === State.Stopped) {
        setIcon('pause');
        await TrackPlayer.play();
      }
      return;
    }

    if (!playlistSongs || playlistSongs.length === 0) {
      ToastAndroid.showWithGravity(
        'No hay canciones disponibles para reproducir',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
      return;
    }

    await loadPlaylist(playlistSongs, 2, false);
    setIcon('pause');
    await TrackPlayer.play();

    setModoReproduccion(2);
    let message = 'Reproducción automática aleatoria activada';
    ToastAndroid.showWithGravity(
      message,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM
    );

    if (modoReproduccion === 0) {
      ToastAndroid.showWithGravity(
        'Reproducción iniciada',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } else if (modoReproduccion === 1) {
      ToastAndroid.showWithGravity(
        'Reproducción automática activada',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } else if (modoReproduccion === 2) {
      ToastAndroid.showWithGravity(
        'Reproducción automática aleatoria activada',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } else if (modoReproduccion === 3) {
      ToastAndroid.showWithGravity(
        'Reproducción en bucle activada',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    }
  } catch (error) {
    console.error('Error al reproducir o pausar la canción:', error);
    ToastAndroid.showWithGravity(
      'Error al reproducir o pausar la canción',
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM
    );
  }
};

async function descargarYGuardarCanciones() {
  if (descargando) {
    alert("Ya se está descargando");
    return;
  }else{
    setDescargando(true);

    try {
      const nuevasCanciones = [];
      // Crear una lista de promesas de descarga
      var promesasDescarga = [...lists].reverse();
      for (const cancion of promesasDescarga) {
        const nombreArchivo = `${cancion.name}.mp3`;
        const cancionExistente = await FileSystem.getInfoAsync(
          FileSystem.documentDirectory + nombreArchivo
        );

        if (cancionExistente.exists) {
          const cancionExistente2 = allTransactionsS.find(
            (c) => c.name === cancion.name
          );
          if (!cancionExistente2) {
            nuevasCanciones.push({
              name: cancion.name,
              img: cancion.img,
              autor: cancion.autor,
              letra: cancion.letra,
              dateU: Date.now(),
              dominantColor: cancion.dominantColor
            });
          }else{
            console.log(`La canción ${cancion.name} ${cancion.uri} ya está descargada`);
          }
          setND((prevND) => prevND + 1);
        } else {
          try {
            var uriR = Array.isArray(cancion.uri) ? cancion.uri[0] : cancion.uri
            await FileSystem.downloadAsync(
              uriR,
              FileSystem.documentDirectory + nombreArchivo
            );
            nuevasCanciones.push({
              name: cancion.name,
              img: cancion.img,
              autor: cancion.autor,
              letra: cancion.letra,
              dateU: Date.now(),
            });
            console.log(`Se descargó correctamente: ${cancion.name}`);
            setND((prevND) => prevND + 1);
          } catch (error) {
            console.error(
              `Error al descargar y guardar el archivo localmente (${cancion.name}):`,
              error
            );
          }
        }
      }

      // Esperar a que todas las descargas se completen
      await Promise.all(promesasDescarga);

      // Agrega las nuevas canciones a la lista
      const nuevaLista = [...allTransactionsS, ...nuevasCanciones];
      // Guarda la lista actualizada localmente
      await AsyncStorage.setItem('descargas', JSON.stringify(nuevaLista));

      // Después de descargar y actualizar todas las canciones, realiza otras acciones necesarias
      ToastAndroid.showWithGravity(
        `Se descargó correctamente la playlist: ${qplaylist} con ${nuevasCanciones.length} canciones`,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );

      // Actualiza el estado
      obtener();
    } catch (error) {
      Alert.alert("Error", `Error al agregar las canciones a la lista: ${String(error)}`);
    } finally {
      setDescargando(false);
      setVisibleN(false);
      setND(0);
    }
  }
}

async function eliminarCanciones() {
  if (descargando) {
    alert("Ya se está eliminando...");
    return;
  }else{
    setDescargando(true);

    try {
      var promesasDescarga = [...lists];

      for (const cancion of promesasDescarga) {

        const nombreArchivo = `${cancion.name}.mp3`;
        const rutaArchivo = `${FileSystem.documentDirectory}${nombreArchivo}`;
        await FileSystem.deleteAsync(rutaArchivo);

        setND((prevND) => prevND + 1);

      }

      // Esperar a que todas las descargas se completen
      await Promise.all(promesasDescarga);

      await AsyncStorage.removeItem('descargas');

      // Después de descargar y actualizar todas las canciones, realiza otras acciones necesarias
      ToastAndroid.showWithGravity(
        `Se eliminó correctamente la playlist: ${qplaylist}`,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );

      // Actualiza el estado
      obtener();
    } catch (error) {
      Alert.alert("Error", `Error al eliminar las canciones a la lista: ${String(error)}`);
    } finally {
      setDescargando(false);
      setVisibleN(false);
      setND(0);
    }
  }
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
    }else{
    try {
      var dateU = Date.now()
      const cancion = {"name":actualS2.name,"img":actualS2.img,"autor":actualS2.autor,"letra":actualS2.letra,"dateU":dateU, "dominantColor":actualS2.dominantColor}; 

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
}

  const deleteCFP = async() => {
    const ref = doc(db, "people", String(uid),"playlists", String(qp),"Likes", String(actualS2.name));
    await deleteDoc(ref).then((e)=>{
      ToastAndroid.showWithGravity(
        "Canción eliminada de esta playlist correctamente",
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
      );
    })
    setModalVisible(false)
  }

  const toggleOverlayP = () => {
    if(visibleP === false){
      setVisibleP(true);
      modalRefP.current?.present()
    }else{
      setVisibleP(false);
      modalRefP.current?.close()
    }
    
  };

  const modalT = (uri: any, name: string, autor: string, tipo: any, img: string, generos: any, letra: any, dominantColor: any) => {
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


    const toggleOverlay2 = () => {
      if(visibleN === false){
        setVisibleN(true);
      }else{
        setActualS2({}) 
        setVisibleN(false);
      }
      
    };


const renderItem = ({ item, index }: { item: any; index: number }) => {
  const isActive = currentTrack?.title === item.title;

  const color = isActive ? 'green' : 'white';

  return (
    <TouchableOpacity style={{ padding: 8 }} onPress={() =>
      change(item.url, item.title, item.artist, item.artwork, item.generos, item.letra, item.dominantColor, index)
    }>
      <View style={styles.box}>
        <Image
          source={{ uri: item.artwork }}
          style={{ width: 55, height: 55, resizeMode: 'cover', marginLeft: 3 }}
        />
        <View style={{ flexDirection: 'column', marginLeft: 5, width: '75%' }}>
          <Text
            style={{ fontSize: 16, color: color, fontWeight: 'bold', marginLeft: 5, marginTop: 2 }}
            adjustsFontSizeToFit numberOfLines={1}
          >
            {item.title}
          </Text>
           <View style={{ flexDirection: 'row', alignItems:"center" }}>
            <Text
              style={{ fontSize: 13, color: '#9F9F9F', marginTop: 4, marginLeft: 5 }}
              adjustsFontSizeToFit numberOfLines={1}
              >
             {item.artist} 
            </Text>
            {item.isLocal?
            <Icon
              type="material"
              name="download-done"
              color="green"
              size={15}
              style={{ marginLeft: 5 }}
            />
            :null}
          </View>
        </View>
        <TouchableOpacity onPress={() =>
          modalT(item.url, item.title, item.artist, item.tipo, item.artwork, item.generos, item.letra, item.dominantColor)
        }>
          <Icon
            type="ionicon"
            name="ellipsis-vertical"
            color="#CBCBCB"
            size={RFValue(20)}
            style={{ marginTop: 0 }}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};


  const renderItem2 = ({ item, index }: { item: any; index: number }) => {
    var color = "white";
    console.log("current",currentTrack)
    if(currentTrack?.title === item.name){
      color = "green"
    }
    

    return (
      <TouchableOpacity style={{padding:8}} onPress={() => change(`${item.name}`,`${item.autor}`,`${item.img}`,`${item.uri}`,item.letra,index,item.dominantColor,index)}>
        <View style={styles.box}>
          <Image
            source={{ uri: `${item.img}` }}
            style={{
              width: 50,
              height: 50,
              resizeMode: 'cover',
              borderRadius: 0,
              marginLeft: 3,
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
                }}>
                Descarga
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
                {item.autor}
              </Text>
            </View>
          </View>
           <TouchableOpacity onPress={(()=>modalT(`${item.uri}`, item.name, item.autor, item.tipo, item.img,item.generos,item.letra,item.dominantColor))}>
              <Icon type={'ionicon'} name={'ellipsis-vertical'} color={'#CBCBCB'} size={RFValue(20)} style={{marginTop:5}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  

  const renderPlaylist = useCallback(
    ({ item }: { item: any }) => (
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
   ),
    []
  );

const getLikesPlaylist = async (playlist: string) => {
  const q = query(collection(db, "people",uid,"playlists",playlist,"Likes"), orderBy('popularity', 'desc'));
  const docs = await getDocs(q)
  const a = docs.docs.map(doc => doc.data());

  if(user.premium === false){
    if(docs.size < 100){

      var searchLike = a.filter((song) => 
          song.name.includes(actualS2.name)
        );

      if(searchLike.length === 0){
        var letra = "";
        var dominant = ""
        letra = actualS2.letra
        dominant = actualS2.dominantColor
        if(letra===undefined){
          letra = "";
        }
        if(dominant === undefined){
          dominant = ""
        }

          const ref = doc(db, "people", uid,"playlists",playlist,"Likes",actualS2.name);
          await setDoc(ref, {
            name:actualS2.name,
            uri:actualS2.uri,
            img:actualS2.img,
            tipo:actualS2.tipo,
            autor:actualS2.autor,
            generos:actualS2.generos,
            dominantColor:dominant,
            letra:letra, 
            dateU:Timestamp.now().toDate(),
            popularity: 1,
          }).then(() => {
            setActualS2({}) 
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
        var dominant = ""
        letra = actualS2.letra
        dominant = actualS2.dominantColor
        if(letra===undefined){
          letra = "";
        }
        if(dominant === undefined){
          dominant = ""
        }

          const ref = doc(db, "people", uid,"playlists",playlist,"Likes",actualS2.name);
          await setDoc(ref, {
            name:actualS2.name,
            uri:actualS2.uri,
            img:actualS2.img,
            tipo:actualS2.tipo,
            autor:actualS2.autor,
            generos:actualS2.generos,
            dominantColor:dominant,
            letra:letra, 
            dateU:Timestamp.now().toDate(),
            popularity: 1,
          }).then(() => {
            setActualS2({}) 
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


const activateA = async () => {
  const nextMode = (modoReproduccion + 1) % 4;
  setModoReproduccion(nextMode);

  let message = 'Desactivado';
  if (nextMode === 1) {
    message = 'Reproducción automática activada';
  } else if (nextMode === 2) {
    message = 'Reproducción automática aleatoria activada';
  } else if (nextMode === 3) {
    message = 'Reproducción en bucle activada';
  }

  ToastAndroid.showWithGravity(
    message,
    ToastAndroid.SHORT,
    ToastAndroid.BOTTOM
  );

  const currentTrackId = await TrackPlayer.getCurrentTrack();
  if (currentTrackId !== null) {
    await loadPlaylist(playlistSongs, nextMode, true);
  }
};


  const cambiarF = () => {
    if(lists.length !== 0){
      if(filtro === "dateU"){
        setFiltro("popularity")
        ToastAndroid.showWithGravity(
          `Ordenado por más popular`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      }
      if(filtro === "popularity"){
        setFiltro("dateU")
        ToastAndroid.showWithGravity(
          `Ordenado por más reciente`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      }
    }
  }

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // El teclado está abierto, ajusta el estilo según sea necesario
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // El teclado se ha cerrado, restaura el estilo original
        searchRef.current?.blur();
        if(textB.length === 0){
          setBuscar(false)
        }
      }
    );

    // Limpia los listeners al desmontar el componente
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [textB,buscar]);
  
  const toggleInfo = () => {
    if(visibleI === false){
      setVisibleI(true);
      modalRefPO.current?.present()
    }else{
      setVisibleI(false);
      modalRefPO.current?.close()
    }
  }

  const getSongs = async (text: string) => {
  console.log(text);
  setTextB(text);
  const searchId = ++searchVersionRef.current;
  let a = text;

  if (a === "") {
    setAllSee(playlistSongs);
    setBusquedaA(false);
    return;
  }

  console.log("2b");
  const findtext = a.toLowerCase();

  const searchData = lists.filter((song) =>
    String(song.name).toLowerCase().includes(findtext)
  );

  setBusquedaA(true);

  // 👇 AQUI el await
  const playlistF = await Promise.all(
    searchData.map(async (item, index) => {
        const nombreArchivo = `${item.name}.mp3`;
        const rutaLocal = `${FileSystem.documentDirectory}${nombreArchivo}`;
        let urlFinal = Array.isArray(item.uri) ? item.uri[0] : item.uri;
        let isLocal = false;

        try {
          const fileInfo = await FileSystem.getInfoAsync(rutaLocal);
          if (fileInfo.exists) {
            urlFinal = rutaLocal;
            isLocal = true;
          }
        } catch (error) {
          console.warn("⚠️ Error revisando archivo local:", error);
        }

        return {
          id: index,
          url: urlFinal,
          vid: Array.isArray(item.uri) ? item.uri[1] : null,
          title: item.name,
          artist: item.autor,
          artwork: item.img,
          dominantColor: item.dominantColor,
          generos: item.generos,
          letra: item.letra,
          qplaylist: String(qp),
          donde: String(qp),
          isLocal: isLocal,
        };
      })
    );

    // 👇 y ahora sí, ya está listo el arreglo
    if (searchId === searchVersionRef.current) {
      setAllSee(playlistF);
    }
  }
  
  const AddPlaylist = async() => {

    var nombres: string[] = [];
    allPlaylists.map((a: any) => {
      nombres.push(String(a.name).toLowerCase())
    })
    if(!nombres.includes(Nnombre.toLowerCase())){
    
        const gamesCollection = doc(db, "people", uid,"playlists",Nnombre);
        setDoc(gamesCollection, {
          name: Nnombre,
          uri:"https://firebasestorage.googleapis.com/v0/b/spotify-20a57.appspot.com/o/music%2Fimage%20(1).png?alt=media&token=ff5ca481-48cf-4433-a0c9-e8f7ff855c16",
          importance:0,
          estado:false
        })

        const batch = writeBatch(db);
  
        // Itera sobre la lista de documentos
        lists.forEach((documentData) => {
          var namec = documentData.name;
          // Añade documentos al lote
          const documentRef = doc(db, "people", uid,"playlists",Nnombre,"Likes", namec);
          setDoc(documentRef, documentData, { merge: true });
        });
  
        // Escribe el lote
        await batch.commit();
  
        console.log('Documentos escritos exitosamente');

        ToastAndroid.showWithGravity(
          `Playlist ${Nnombre} creada correctamente`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );  
        setVisibleA(false);
        setNnombre("");
    }else{
      Alert.alert("Error","Nombre ya en uso, prueba con otro")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView keyboardShouldPersistTaps={'always'} style={{}} stickyHeaderIndices={[1]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf:"center"}}>
      <Searchbar
          placeholder="¿Qué buscas?"
          onChangeText={getSongs}
          value={textB}
          autoFocus={false}
          ref={searchRef}
          style={{width:"95%",alignSelf:"center", marginTop:30}}
      />
      </View>

      <View style={styles.upperContainer}>
      <View style={{flexDirection:"row",justifyContent:"space-between",width:"100%"}}>
        <View style={{flexDirection:"row",alignItems:"center"}}>
          <TouchableOpacity style={{}} onPress={(()=>toggleOverlay2())}>
            <Text
              style={{
                fontSize: 25,
                marginLeft: 5,
                color: 'white',
                fontWeight: 'bold',
              }}>
              {publica?publicaN:qplaylist}
            </Text>
          </TouchableOpacity>
          {publica?
          <TouchableOpacity onPress={(()=>toggleInfo())}> 
              <Text
                style={{
                  fontSize: 15,
                  marginLeft: 5,
                  color: '#929292',
                  fontWeight: 'bold',
                }}>
                  by {nameAP}
              </Text>
            </TouchableOpacity>
            :null}
          <TouchableOpacity style={{marginLeft:5}} onPress={()=>{searchRef.current?.focus()}}>
            <Icon type={'material'} name={"search"} color={"gray"} size={28} />
          </TouchableOpacity>
        </View>
        
        <View style={{flexDirection:"row",marginRight:10,alignItems:"center",justifyContent:"flex-end"}}>
          <TouchableOpacity style={{}} onPress={(()=>cambiarF())}>
            <Icon type={'ionicon'} name={"filter"} color={"white"} size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={{marginLeft:10}} onPress={(()=>activateA())}>
            <Icon type={'material'} name={modoReproduccion === 3?"repeat":modoReproduccion === 2?"shuffle-on":modoReproduccion === 1?"shuffle":modoReproduccion === 0?"shuffle":"shuffle"} color={modoReproduccion === 0?"white":"green"} size={34} />
          </TouchableOpacity>
          <TouchableOpacity style={{marginLeft:10}} onPress={(()=>_playAndPause())}>
            <Icon type={'ionicon'} name={icon === "play"?"play-circle":"pause-circle"} color={"green"} size={60} />
          </TouchableOpacity>
        </View>
        </View>
      </View>
      
      <View>
      {internet ?
      <FlatList
        style={{ marginTop: 10 }}
        data={allSee}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item.id ?? item.title ?? index)}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
        persistentScrollbar={true}
        keyboardShouldPersistTaps="always"
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 70,
          offset: 70 * index,
          index,
        })}
        scrollsToTop={false}
        ListFooterComponent={<View style={{ height: RFValue(200) }} />}
        ListEmptyComponent={
          lists.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginTop: dimen.height / 3 }}>
                ¡No tienes canciones!
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'gray' }}>
                Agrega algunas para llenarlo
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginTop: dimen.height / 3 }}>
                ¡No encontramos esta canción!
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'gray' }}>
                :(
              </Text>
            </View>
          )
        }
      />
      :
      <FlatList
        style={{ marginTop: 10}} 
        data={allSee}
        renderItem={renderItem2}
        extraData={currentIndexRef}
        showsVerticalScrollIndicator={true}
        scrollsToTop={false}
        indicatorStyle={'white'}
        persistentScrollbar={true}
        keyExtractor={(item, index) => String(item.id ?? item.name ?? index)}
        keyboardShouldPersistTaps={'always'}
        ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", marginTop:dimen.height/3 }}>
                ¡No tienes canciones descargadas!
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "gray" }}>
                Descarga algunas para llenarlo
              </Text>
            </View>
        }
        ListFooterComponent={
          <View style={{height:RFValue(200)}}></View>
        }
      />}
      </View>
      </ScrollView>
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
          ref={modalRefPO}
          index={1}
          snapPoints={snapPoints4}
          enableDynamicSizing={false}
          detached={true}
          containerStyle={{width:"80%",marginLeft:"10%"}}
          style={{marginTop:-220}}
          backdropComponent={BottomSheetBackdrop}
          backgroundStyle={{ backgroundColor: '#111' }}
          onDismiss={toggleInfo}
          handleIndicatorStyle={{ backgroundColor: 'gray' }}
          stackBehavior='switch'
        >
          <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
            <Text style={{fontSize:23,textAlign:"center",color:"white",fontWeight:"bold",paddingTop:5}}>Información</Text>
            <Text style={{fontSize:18,textAlign:"center",color:"gray",fontWeight:"bold",marginTop:20}}>Creada por: {nameAP} con uid: {uidAP}</Text>
            <Text style={{fontSize:23,textAlign:"center",color:"white",fontWeight:"bold",borderBottomWidth:1,marginTop:30}}>Estadísticas</Text>
            <Text style={{fontSize:18,textAlign:"center",color:"gray",fontWeight:"bold",marginTop:20}}>{popularityAP} visitas</Text>
            <Text style={{color:"gray",fontSize:14,textAlign:"center",marginTop:20,fontWeight:"bold",borderTopWidth:1,paddingTop:15}}>Publicada el: </Text>
            <Text style={{color:"gray",fontSize:14,textAlign:"center",marginTop:5,fontWeight:"bold"}}>{dateAP}</Text>
          </View>
      </BottomSheetModal> 
      <BottomSheetModal
        ref={modalRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        onDismiss={()=>modalT(undefined as any, '', '', undefined as any, '', undefined as any, undefined as any, undefined as any)}
        stackBehavior='push'
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
          <Option icon="person" label="Ir al artista" onPress={() => {
            router.push({
              pathname: "/(screens)/Autor",
              params: {
                nameA: actualS2.autor,
              }
            });
            modalRef.current?.close();
          }} />
          <ExternalLink style={{}} href={`https://www.google.com/search?q=${musica[0]+" "+musica[1]}`}>
            <View style={styles.option}>
              <Icon type={'ionicon'} name={"globe-outline"} color={"gray"} size={34} />
              <Text style={styles.optionText}>Abrir en la web</Text>
            </View>
          </ExternalLink>
        </View>
      </BottomSheetModal>

      <Modal
          style={{marginTop:-320}}
          onDismiss={toggleOverlay2}
          visible={visibleN}
          contentContainerStyle={{backgroundColor:"#111",justifyContent:"center",alignItems:"center", alignContent:"center",alignSelf:"center",marginTop:"80%",borderRadius:20,padding:20}}
        >
        {qplaylist !== "Descargas"?
          <View style={{flexDirection:"column",justifyContent:"center",alignItems:"center",padding:20, alignSelf:"center",alignContent:"center"}}>
            <Text style={{fontSize:25,textAlign:"center",color:"white",fontWeight:"bold"}}>Descargar playlist</Text>
            <TouchableOpacity style={{marginTop:RFValue(10),marginLeft:10}} onPress={(()=>descargarYGuardarCanciones())}>
              <Icon type={'ionicon'} name={"cloud-download-outline"} color={descargando? "gray": "green"} size={40} />
            </TouchableOpacity>
            {descargando?
            <Text style={{fontSize:15,textAlign:"center",color:"white",maxWidth:300,marginTop:10}}>Esto va a tardar un rato, no salgas de la playlist</Text>
            : null}
            {descargando?
            <Text style={{fontSize:15,textAlign:"center",color:"white",maxWidth:300,marginTop:10}}>{`${nD} de ${nT}`}</Text>
            : null}
          </View>
        :
        <View>
          <Text style={{fontSize:25,textAlign:"center",color:"white",fontWeight:"bold"}}>Eliminar playlist</Text>
          <TouchableOpacity style={{marginTop:RFValue(10),marginLeft:10}} onPress={(()=>eliminarCanciones())}>
            <Icon type={'material'} name={"delete-sweep"} color={descargando? "gray": "red"} size={40} />
          </TouchableOpacity>
          {descargando?
          <Text style={{fontSize:20,textAlign:"center",color:"white",maxWidth:300,marginTop:10}}>Esto va a tardar un rato, no salgas de la playlist</Text>
          : null}
          {descargando?
          <Text style={{fontSize:20,textAlign:"center",color:"white",maxWidth:300,marginTop:10}}>{`${nD} de ${nT}`}</Text>
          : null}
        </View>
        }

        {publica ? (
  <View>
    <Text style={{fontSize:22,textAlign:"center",color:"white",fontWeight:"bold"}}>
      Agregar a mis playlists
    </Text>

    {visibleA ? (
      <View>
        <TextInput
          style={{
            backgroundColor: 'white',
            fontWeight: 'bold',
            borderColor: 'white',
            color: '#666664',
            minWidth: 100,
            alignSelf: 'center',
            borderRadius: 5,
            height: 45,
            marginTop: 20,
            fontSize:15,
            textAlign:"center",
            paddingLeft:10,
            paddingRight:10
          }}
          onChangeText={(text) => setNnombre(text)}
          placeholder="Nuevo nombre"
          maxLength={20}
          placeholderTextColor="#666664"
          keyboardAppearance="dark"
          keyboardType="web-search"
        />

        <TouchableOpacity
          style={{
            width: 150,
            height: 40,
            backgroundColor: '#2E2E34',
            borderRadius: 30,
            alignSelf:"center",
            marginTop:30
          }}
          onPress={AddPlaylist}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              alignSelf: 'center',
              marginTop: 5,
              color: '#34904F',
            }}
          >
            Agregar
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View>
        <TouchableOpacity
          style={{marginTop:RFValue(10),marginLeft:10}}
          onPress={() => setVisibleA(true)}
        >
          <Icon type="material" name="playlist-add" color="green" size={40} />
        </TouchableOpacity>
      </View>
    )}
  </View>
) : null}

  </Modal>
    
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
    </SafeAreaView>
  );
}
 


const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: '#111111',
    height:"90%"
  },
  upperContainer: {
    backgroundColor: '#111111',
    flexDirection:"row",
    alignItems:"center",
    marginTop:15,
    marginBottom:-10
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
