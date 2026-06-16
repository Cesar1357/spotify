import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated as AnimatedR,
  AppState,
  BackHandler,
  Dimensions,
  InteractionManager,
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';

import { useAds } from "@/hooks/useAds";
import { Icon } from 'react-native-elements';
import { FlatList, Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';


import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';

import { RFValue } from 'react-native-responsive-fontsize';

import NetInfo from '@react-native-community/netinfo';
import Animated, { FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useAuth } from '@/hooks/useAuth';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet/src';


import { ExternalLink } from '@/components/ExternalLink';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp } from "firebase/firestore";
import TrackPlayer, { Event, State, useProgress } from 'react-native-track-player';
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

type AnyObject = { [key: string]: any };

function delay(n: number){
  return new Promise(function(resolve){
      setTimeout(resolve,n*1000);
  });
}

export default function Repro() {
  const router = useRouter();
  const translateX = useRef(new AnimatedR.Value(0)).current;
  const { loadAds, playAd } = useAds();
  const pathname = usePathname();

  const moveLeft = async() => {
    translateX.setValue(10);
    AnimatedR.timing(translateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  const moveRight = async() => {
    translateX.setValue(-10);
    AnimatedR.timing(translateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const [iconLC, setIconLC] = useState("white"); 
  const { icon, setIcon, musica, setMusica, colorA, setColorA, lastRouteRef, currentIndexRef, estado2, setEstado2, estado, setEstado, currentTrack, setCurrentTrack, modoReproduccion, setModoReproduccion, playlistSongs, setPlaylistSongs, reproduciendoD, setReproduciendoD, AdT, setAdT, isVideoReady, setIsVideoReady, singleLoop, setSingleLoop } = useApp();
  const [allTransactionsS,setAllTransactionsS] = useState<AnyObject[]>([])
  const videoRef = useRef<any>(null);
  const [localStateP, setLocalStateP] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [buffering2, setBuffering2] = useState(false);

  const { uid, loading } = useAuth();


  const [icon2, setIcon2] = useState<string>('');

  const [dArtista, setDArtista] = useState<AnyObject | null>(null);
  const [songs, setSongs] = useState<AnyObject[]>([]);
  const [index, setIndex] = useState<number>(0);


  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [a,setA] = useState<string>('00:00');
  const [t, setT] = useState<string>('00:00');
  const [numberLikes, setNumberLikes] = useState(0);
  const [internet, setInternet] = useState("si")
  const [qplaylist, setQplaylist] = useState("Likes")

  const [currentI, setCurrentI] = useState<number>(0)
  const scrollViewRef = useRef<any>(null);
  const scrollViewRef2 = useRef<any>(null);

  const scrollRef = useRef<any>(null);
  const panRef = useRef<any>(null);
  const isAtTop = useSharedValue(true);
  const [isPaused, setIsPaused] = useState(true);

  const parsedLyrics = useMemo(() => {
    if (!musica[5] || typeof musica[5] !== 'string') return [];
    return musica[5]
      .split('/n')
      .map((line) => {
        const match = line.match(/^(\d+(?:\.\d+)?)\|(.*)$/);
        return match ? { time: parseFloat(match[1]), text: match[2].trim() } : null;
      })
      .filter((item) => item !== null);
  }, [musica[5]]);

  useEffect(() => {
    setCurrentLyric(parsedLyrics);
  }, [parsedLyrics]);
  const [videoTime, setVideoTime] = useState(0);

  const [currentLyric, setCurrentLyric] = useState<Array<{time:number;text:string}>>([])
  var window = Dimensions.get("window")

  const [modalVisible, setModalVisible] = useState(false);
  const [visibleP, setVisibleP] = useState(false);
  const [visibleL, setVisibleL] = useState(false);

  const [allPlaylists, setAllPlaylists] = useState<AnyObject[]>([]);
  const [ind, setInd] = useState(0)
  const [descargando, setDescargando] = useState(false)
  const [user, setUser] = useState<any>(null);
  var qplaylist2 = qplaylist ? qplaylist.includes("_") : false;
  var qplaylist3 = qplaylist2 ? "Likes" : qplaylist


  const [tipo, setTipo] = useState(false)
  const [millisPos, setMillisPos] = useState(0)

  const [prevLine, setPrevLine] = useState('');
  const [currentLine, setCurrentLine] = useState('');
  const [nextLine, setNextLine] = useState('');
  const animatedValue = useSharedValue(1);

  const [artista, setArtista] = useState<AnyObject>({});

  let numerosDisponibles: number[] = [];
  let numerosSeleccionados: number[] = [];

  const [userScrolling, setUserScrolling] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = useState(0);
  const { position, duration } = useProgress(200);
  const translateY = useSharedValue(0);
  const translateYScreen = useSharedValue(0);

  const modalRef = useRef<BottomSheetModal>(null);
  const modalRefL = useRef<BottomSheetModal>(null);
  const modalRefP = useRef<BottomSheetModal>(null);
  const modalRefQueue = useRef<BottomSheetModal>(null);
  const [visibleQueue, setVisibleQueue] = useState(false);
  const currentIndexRef2 = useRef(-1); // Guarda el índice anterior

  const snapPoints = useMemo(() => ['25%', '45%'], []);
  const snapPoints2 = useMemo(() => ['100%', '100%'], []);
  const snapPoints3 = useMemo(() => ['43%', '43%'], []);
  const [conexionLenta, setConexionLenta] = useState(0);

  const Option = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Icon type="ionicon" name={icon} color="gray" size={30} />
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );
  
  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.PlaybackState, async ({ state }) => {
      if (!videoRef.current) return;

      if (state === State.Playing) {
        setIsPaused(false);
      } else if (state === State.Paused) {
        setIsPaused(true);
      } else if (state === State.Stopped || state === State.Ended) {
        setIsPaused(true);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if(modalVisible){
        modalRefP.current?.close()
        return true;
      }
      if(visibleP){
        modalRef.current?.close()
        return true;
      }
      if (visibleL) { // Solo si el BottomSheet está abierto
        modalRefL.current?.close();
        return true; // Cancela la navegación
      }
      lastRouteRef.current = "/(tabs)";
      console.log("tabs-RG")
      return false; // Permite que la navegación ocurra normalmente
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [visibleL, visibleP, modalVisible]);
  

  useEffect(() => {

  if (
    appStateVisible !== "active" // ⛔ no hacer nada si no está activa
  ) {
    return;
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const fAd = async() => {
    if (isVideoReady && tipo === true && currentTrack?.vid) {
      if (Math.abs(videoTime - position) > 1.5 ) {
        // ❌ Está desfasado → Pausamos y buscamos
        if(position > 0){
          setIsPaused(true);
          await TrackPlayer.pause();
          setBuffering2(true);
          setBuffering(true);
          console.log("⚡ Corrigiendo desfase");
          await videoRef.current?.seek(position);
          // ⏳ Arranca temporizador de 3s
          await delay(1);
          if (localStateP === false && !buffering && !buffering2) {
              await TrackPlayer.play();
              setIsPaused(false);
              console.log("sincronizado y reanudando1...")
          }
          console.log("sincronizado1...",localStateP,buffering,buffering2)

          timeoutId = setTimeout(() => {
            if (Math.abs(videoTime - position) > 1) {
              console.log("🚨 Internet lento, mostrando mensaje");
              
              if(!currentTrack.isAd){
                setConexionLenta((prev) => prev + 1);
                if(conexionLenta >= 1){
                  toggleTipo();
                
                }
              }else{
                console.log("conexion lenta en anuncio")
              }
            
            }
          }, 3000);
            
          
        }else if(position === 0){
          await videoRef.current?.seek(position);
            if (localStateP === false && !buffering && !buffering2) {
              setIsPaused(false);
              await TrackPlayer.play();
              console.log("sincronizado y reanudando1...")
            }
          console.log("sincronizado2...")
        }
      }else if(position === 0 && videoTime === 0){
        if (localStateP === false && !buffering && !buffering2) {
          setIsPaused(false);
          await TrackPlayer.play();
          console.log("sincronizado y reanudando1...")
        }
      }
    }
  }
  fAd();
  return () => {
    if (timeoutId) clearTimeout(timeoutId); // limpiar temporizador si cambian dependencias
  };
}, [position, videoTime, localStateP, tipo, currentTrack, isVideoReady, appStateVisible, pathname, buffering2, buffering]);



  const closeReproGrande = useCallback(() => {
    router.back();
    lastRouteRef.current = '/(tabs)';
    console.log('tabs-RG');
  }, [router]);

  const panGestureScreen = Gesture.Pan()
  .withRef(panRef)
  .activeOffsetY([10, 1000])
  .failOffsetX([-15, 15])
  .onUpdate((event) => {
    if (isAtTop.value && event.translationY > 0) {
      translateYScreen.value = event.translationY;
    }
  })
  .onEnd(async(event) => {
    if (event.translationY > 250) {
      translateYScreen.value = withSpring(900, { duration: 1000 });
      runOnJS(closeReproGrande)();
    } else {
      translateYScreen.value = withSpring(0);
    }
  });

  const animatedStyleScreen = useAnimatedStyle(() => ({
    transform: [{ translateY: translateYScreen.value }],
  }));

  const findLyricByTime = useCallback((currentTime2: number) => {
    try {
      const currentTime = currentTime2;
      const lyricArray = parsedLyrics;

      if (lyricArray.length === 0) return;

      // Extrae los tiempos de cada línea
      const times = lyricArray.map(line => line.time);

      let nearestLineIndex = 0;

      if (currentTime >= times[times.length - 1]) {
        nearestLineIndex = times.length - 1;
      } else {
        for (let i = 0; i < times.length; i++) {
          if (currentTime >= times[i]) {
            nearestLineIndex = i;
          } else {
            break;
          }
        }
      }

      nearestLineIndex = Math.min(nearestLineIndex, lyricArray.length - 1);

      setCurrentI(nearestLineIndex);

      const currentParts = lyricArray[nearestLineIndex] || {};
      const nextParts = lyricArray[nearestLineIndex + 1] || {};
      const prevParts = lyricArray[nearestLineIndex - 1] || {};

      setCurrentLine(currentParts.text || '');
      setNextLine(nextParts.text || '');
      setPrevLine(prevParts.text || '');

      if (scrollViewRef?.current && !visibleL && nearestLineIndex >= 0 && nearestLineIndex < lyricArray.length) {
        scrollViewRef.current.scrollToIndex({
          index: nearestLineIndex,
          viewPosition: 0.5,
          animated: true,
        });
      } else if (scrollViewRef2?.current && visibleL && !userScrolling && nearestLineIndex >= 0 && nearestLineIndex < lyricArray.length) {
        scrollViewRef2.current.scrollToIndex({
          index: nearestLineIndex,
          viewPosition: 0.5,
          animated: true,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }, [parsedLyrics, visibleL, userScrolling]);

  useEffect(() => {
    // Tiempo actual
    const min = Math.floor(position / 60);
    const se = Math.floor(position % 60);
    const minStr = min < 10 ? "0" + min : min.toString();
    const seStr = se < 10 ? "0" + se : se.toString();

    // Tiempo restante
    const remaining = duration - position;
    const dma = Math.floor(remaining / 60);
    const dme = Math.floor(remaining % 60);
    const dmaStr = dma < 10 ? "0" + dma : dma.toString();
    const dmeStr = dme < 10 ? "0" + dme : dme.toString();

    setA(`${minStr}:${seStr}`);
    setT(`-${dmaStr}:${dmeStr}`);

    // Progreso
    const xd = duration > 0 ? position / duration : 0;
    setProgress(xd);
    if (parsedLyrics.length > 0) {
      findLyricByTime(position);
    }
  }, [position, duration, parsedLyrics, findLyricByTime]);

  useEffect(() => {
    const fetchCurrentTrack = async () => {
      try {
        const trackId = await TrackPlayer.getCurrentTrack();
        if (trackId != null) {
          const track = await TrackPlayer.getTrack(trackId);
          if (track) {
            if (typeof track.artist === 'string' && typeof track.title === 'string') {
              await getAutors(track.artist, track.title);
            }
            if(musica[6]){
              setMusica([track.title,track.artist,track.artwork,[track.url,track.vid],track.generos,track.letra,reproduciendoD,track.dominantColor]);
            }else{
              setMusica([track.title,track.artist,track.artwork,[track.url,track.vid],track.generos,track.letra,track.donde,track.dominantColor]);
              setReproduciendoD(track.donde);
            }
            console.log("trackIniPrimeravezSoloReproGrande")
            setAdT(track.isAd?true:false);
            setCurrentTrack(track);
            if(track.isAd){
              setTipo(true);
            }else{
              setTipo(false);
            }
            currentIndexRef.current = trackId
            
            const playbackState = await TrackPlayer.getPlaybackState();
            setEstado2(playbackState.state);
            setQplaylist(track.qplaylist);
            setEstado(true);
          
          if(playbackState.state === State.Ended){
            setEstado(false);
          }
          console.log('Track actual:', track.title);
          console.log('Playback:', playbackState);
          }
        }else{
          router.back();
        }
      } catch (error) {
        console.error('Error al obtener la pista actual:', error);
      }
    };  

    fetchCurrentTrack();
    // Escuchar cambio de pista
    try {
      const playbackStateListener = TrackPlayer.addEventListener(Event.PlaybackState, async ({ state }) => {
        if(state === State.Buffering){
          setBuffering(true);
        }else{
          setBuffering(false);
        }
        if(state === State.Stopped){
          setEstado(false);
          setMusica([]);
          setCurrentTrack([]);
          lastRouteRef.current = "/(tabs)";
          router.back();
        }
      });

      const trackChangeListener = TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (e) => {
        if (e.nextTrack != null) {
          const track = await TrackPlayer.getTrack(e.nextTrack);
          if (e.track != null) {
            const trackA = await TrackPlayer.getTrack(e.track);
            if(track){
              setMusica([track.title,track.artist,track.artwork,[track.url,track.vid],track.generos,track.letra,reproduciendoD,track.dominantColor]);
              if (trackA?.isAd) {
                console.log("✅ Anuncio terminado, regresando a música");
                await TrackPlayer.remove(e.track); // elimina el anuncio de la cola
                setBuffering(false);
                setBuffering2(false);
              }
            }
          } else if (track) {
            setMusica([track.title,track.artist,track.artwork,[track.url,track.vid],track.generos,track.letra,reproduciendoD,track.dominantColor]);
          }
            if (track) {
              if (typeof track.artist === 'string' && typeof track.title === 'string') {
                await getAutors(track.artist, track.title);
              }
              console.log("||ReproGrande",track?.title); 
              setAdT(track.isAd?true:false);
              setCurrentTrack(track);   
              
              if(track.isAd){
                setTipo(true);
              }else{
                setTipo(false);
              }
              setEstado(true); 
              
              currentIndexRef.current = e.nextTrack;
              currentIndexRef2.current = e.nextTrack;
            }
          }
      });
  
      // 👇 Escuchar cambio de estado de reproducción
      
  
      return () => {
        trackChangeListener.remove();
        playbackStateListener.remove();
      };
  
    } catch (error) {
      console.error('Error al obtener la pista actual:', error);
    }
    
  }, [currentIndexRef,estado,modoReproduccion]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined = undefined;

    const checkInternetConnection = async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.isConnected) {
          setInternet("si");
          if (musica[0] && qplaylist && !qplaylist2 && uid) {
            const playlistDocRef = doc(db, 'people', uid, 'playlists', "Likes", 'Likes', musica[0]);
            unsubscribe = onSnapshot(playlistDocRef, (snapshot) => {
              setIconLC(snapshot.exists() ? "green" : "white");
            });
          }
        } else {
          setInternet("no");
          setIconLC("white");
        }
      } catch (error) {
        console.error("Error checking internet or Firestore:", error);
        setInternet("no");
        setIconLC("white");
      }
    };

    checkInternetConnection();

    // Limpieza del listener de Firestore
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
}, [musica[0], qplaylist2, qplaylist, uid, db]);
  
  const handleUserScroll = () => {
    setUserScrolling(true); // Desactiva el seguimiento automático
    console.log("desactivado")
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current); // Reinicia el cooldown si ya estaba corriendo
    }
    cooldownRef.current = setTimeout(() => {
      setUserScrolling(false); // Reactiva el seguimiento después de 10 segundos
      console.log("activado")
    }, 2000); // 10 segundos
  };



  useEffect(()=>{
    try{
      if(uid && db){
        const q = query(collection(db, "people",uid,"playlists","Likes","Likes"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          var s = querySnapshot.size
          setNumberLikes(s) 
        });   
        obtener()
        getPlaylists()
        getUser()
      }
    }catch(err){
      console.log(err)
    }
  },[db,uid])

  const getAutors =async (artist: string, nameSong:string) => {
    try{
      console.log(" autor 1")
      if(artista.name !== artist){
        try{
          if(artist === "Anuncio"){
            setArtista({
                "name": artist,
                "uri": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkM03yBVebiMnBH5Kn2h3XazhS4sAIxn3w6w&s",
                "descripcion": "Video corto de entretenimiento",
                "tipo":"Artista",
              })
              return;
          }
          const docRef = doc(db, "autores", artist);
          const docSnap = await getDoc(docRef);
          const info = docSnap.data()
          console.log("Obteniendo datos:", docSnap.exists(), info);
          if(!docSnap.exists()){
            console.log("autor 2, no existe")
              setArtista({
                "name": artist,
                "uri": "https://s1.ppllstatics.com/canarias7/www/multimedia/201704/14/media/cortadas/462076-1g_CSN462076_MG3928385--1248x702.jpg",
                "descripcion": "No hay información disponible",
                "tipo":"Artista",
              })
          }else{
            setArtista(info ?? {});
          }
          console.log(info,"Artista");
        } catch(err){
          console.log(err)
          setArtista({
              "name": artist,
              "uri": "https://s1.ppllstatics.com/canarias7/www/multimedia/201704/14/media/cortadas/462076-1g_CSN462076_MG3928385--1248x702.jpg",
              "descripcion": "No hay información disponible",
              "tipo":"Artista",
            })
        }
      }  
    } catch(err){
      console.log(err)
      console.log(" autor 3")
      setArtista({
        "name": artist,
        "uri": "https://s1.ppllstatics.com/canarias7/www/multimedia/201704/14/media/cortadas/462076-1g_CSN462076_MG3928385--1248x702.jpg",
        "descripcion": "No hay información disponible",
        "tipo":"Artista",
      })
    }
  };
  

  const getUser = async () => {
    const docRef = doc(db, "people", uid);
    const docSnap = await getDoc(docRef);
    const info = docSnap.data()
    setUser(info ?? null)
  }
  

  const getPlaylists = async() => {
      const q = query(collection(db, "people",uid,"playlists"),orderBy('importance', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data() ?? {});
      setAllPlaylists(data);
}

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

const like = () => {  
  if(internet === "si" && AdT === false){
        var letra = "";
        var dominant = ""
        letra = musica[5]
        dominant = musica[7]
        if(letra===undefined){
          letra = "";
        }
        if(dominant === undefined){
          dominant = ""
        }

      if(iconLC === "white"){
          setIconLC("green")
          const historyRef = doc(db, "people", uid, "playlists", qplaylist3,"Likes",musica[0]);
          setDoc(historyRef,{
            name:musica[0],
            uri:musica[3],  
            img:musica[2],
            letra:letra,
            tipo:"Canción",
            autor:musica[1],
            generos:musica[4], 
            dominantColor:dominant,
            dateU:Timestamp.now().toDate(),
            popularity: 1,
          })     
      }else{
        setIconLC("white")
        const historyRef = doc(db, "people", uid, "playlists", "Likes","Likes",musica[0]);
        deleteDoc(historyRef)
      }
    }
  }

 
  
  const _playAndPause = async () => {
    try {
      const currentTrackId = await TrackPlayer.getCurrentTrack();
      if (currentTrackId !== null) {
        if (estado2 === State.Playing) {
          setIsPaused(true);
          await TrackPlayer.pause();
          setIcon('play');
          setLocalStateP(true);
        } else if (estado2 === State.Paused || estado2 === State.Ready || estado2 === State.Stopped) {
          await TrackPlayer.play();
          setIsPaused(false);
          setIcon('pause');
          setLocalStateP(false);
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
      setIsPaused(false);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Playlist helpers (unificado con Playlist.tsx logic) ---
  const shufflePlaylist = (playlist: AnyObject[]) => {
    const copy = [...playlist];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildPlaylistQueue = (playlist: AnyObject[], mode: number, currentTrackObject: AnyObject | null) => {
    if (!Array.isArray(playlist) || playlist.length === 0) return [];

    const activeIndex = currentTrackObject
      ? playlist.findIndex((item) => item.id === currentTrackObject.id || item.title === currentTrackObject.title || item.name === currentTrackObject.title)
      : -1;

    if (mode === 3) {
      // loop: keep current track only
      return currentTrackObject ? [] : [playlist[0]];
    }

    if (mode === 2) {
      const remaining = playlist.filter((_, index) => index !== activeIndex);
      return shufflePlaylist(remaining);
    }

    if (mode === 0) {
      return currentTrackObject ? [] : [playlist[0]];
    }

    // mode === 1 (ordered): start from next of active or full list
    return activeIndex >= 0 ? playlist.slice(activeIndex + 1) : playlist;
  };

  const normalizeTrack = (item: AnyObject) => {
    // Ensure the track has the fields TrackPlayer expects (url, title, artist, artwork, id)
    const url = item.url ?? (Array.isArray(item.uri) ? item.uri[0] : item.uri) ?? item.audio ?? item.src ?? null;
    const title = item.title ?? item.name ?? '';
    const artist = item.artist ?? item.autor ?? '';
    const artwork = item.artwork ?? item.img ?? item.art ?? undefined;
    const id = item.id ?? undefined;
    const out: AnyObject = {
      ...(id !== undefined ? { id } : {}),
      url,
      title,
      artist,
      artwork,
      // keep extra metadata
      ...item,
    };
    return out;
  };

  const loadPlaylist = async (playlist: AnyObject[], mode: number = 0, preserveCurrent = false) => {
    if (!Array.isArray(playlist) || playlist.length === 0) return;

    const currentTrackId = await TrackPlayer.getCurrentTrack();
    const isPlayingTrackLoaded = currentTrackId !== null;
    const queue = buildPlaylistQueue(playlist, mode, isPlayingTrackLoaded ? currentTrack : null);

    if (isPlayingTrackLoaded && preserveCurrent) {
      await TrackPlayer.removeUpcomingTracks();
      if (queue.length > 0) await TrackPlayer.add(queue.map(normalizeTrack) as any);
    } else {
      await TrackPlayer.reset();
      if (queue.length > 0) await TrackPlayer.add(queue.map(normalizeTrack) as any);
      if (queue.length > 0) currentIndexRef.current = 0;
    }
  };

  const activateA = async () => {
    const nextMode = (modoReproduccion + 1) % 4;
    setModoReproduccion(nextMode);
    let message = 'Desactivado';
    if (nextMode === 1) message = 'Reproducción automática activada';
    else if (nextMode === 2) message = 'Reproducción automática aleatoria activada';
    else if (nextMode === 3) message = 'Reproducción en bucle activada';

    ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.BOTTOM);

    const currentTrackId = await TrackPlayer.getCurrentTrack();
    if (currentTrackId !== null) {
      await loadPlaylist(playlistSongs, nextMode, true);
    }
  };

  const bucle = () => {
    try {
      setSingleLoop((prev) => {
        const next = !prev;
        ToastAndroid.showWithGravity(next ? 'Repetir pista activado' : 'Repetir pista desactivado', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
        return next;
      });
    } catch (err) {
      console.log(err);
    }
  };

const openLink = (nameA: string, autor: string) => {
    const url = `https://www.google.com/search?q=${nameA+" "+autor}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error al abrir el enlace:', err);
      ToastAndroid.showWithGravity(
      "Error al abrir el enlace",
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
    );
    });
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      console.log("AppState", appState.current);

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("📲 App volvió al foreground");
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  
  

  const handleStatusUpdateV = (status: any) => {
    try{
      console.log("||||||||||||||||||| ",status)

    }catch(err){
      console.log(err)
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

  const modalT = () => {
    if(modalVisible === true){
      setModalVisible(false)
      InteractionManager.runAfterInteractions(() => {
        modalRef.current?.close();
      });
    }else{
      setModalVisible(true)
      InteractionManager.runAfterInteractions(() => {
        modalRef.current?.present();
      });
    }
  }

  const toggleOverlayL = () => {
    if(visibleL === true){
      setVisibleL(false);
      modalRefL.current?.close();
      console.log("c");
      deactivateKeepAwake();
    }else{
      setVisibleL(true);
      modalRefL.current?.present();
      console.log("a")
      activateKeepAwakeAsync();
    }
  };

  const toggleOverlayL2 = () => {
      setVisibleL(false);
      modalRefL.current?.close();
      console.log("c") 
  };

  const toggleQueue = () => {
    if (visibleQueue) {
      setVisibleQueue(false);
      modalRefQueue.current?.close();
    } else {
      setVisibleQueue(true);
      modalRefQueue.current?.present();
    }
  };

  const deletC = async () => {
    try {
      const nombreCancion = musica[0]
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
    if(!descargando){
      const nombreArchivo = musica[0]+".mp3";
      console.log(nombreArchivo)

      const cancionExistente = allTransactionsS.find(
          (cancion) => cancion.name === musica[0]
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
        var dateU = Date.now()
        const cancion = {"name":musica[0],"img":musica[2],"autor":musica[1],"letra":musica[5],"dateU":dateU};

        const fileInfo = await FileSystem.downloadAsync(
          Array.isArray(musica[3])? musica[3][0] : musica[3], // URL del archivo
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
        setModalVisible(false)
        ToastAndroid.showWithGravity(
          `Se descargó correctamente: ${musica[0]}`,
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
    }else{
      Alert.alert("Ya se está descargando...")
    }
}

const renderPlaylist = useCallback(
    ({ item }: { item: AnyObject }) => (
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
          song.name.includes(musica[0])
        );

      if(searchLike.length === 0){
        var letra = "";
        var dominant = ""
        letra = musica[5]
        dominant = musica[7]
        if(letra===undefined){
          letra = "";
        }
        if(dominant === undefined){
          dominant = ""
        }

          const ref = doc(db, "people", uid,"playlists",playlist,"Likes",musica[0]);
          await setDoc(ref, {
            name:musica[0],
            uri:musica[3],
            img:musica[2],
            tipo:"Canción",
            autor:musica[1],
            generos:musica[4],
            dominantColor:dominant,
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
          song.name.includes(musica[0])
        );

      if(searchLike.length === 0){
        var letra = "";
        var dominant = ""
        letra = musica[5]
        dominant = musica[7]
        if(letra===undefined){
          letra = "";
        }
        if(dominant === undefined){
          dominant = ""
        }

          const ref = doc(db, "people", uid,"playlists",playlist,"Likes",musica[0]);
          await setDoc(ref, {
            name:musica[0],
            uri:musica[3],
            img:musica[2],
            tipo:"Canción",
            autor:musica[1],
            generos:musica[4],
            dominantColor:dominant,
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
  
  const cancionSiguiente = async() => {
    setIsVideoReady(false);
    setAdT(false);
    await playAd();
  }

  const cancionAnterior = async() => {
     await TrackPlayer.skipToPrevious().catch(() => {
        TrackPlayer.stop();
      });
      await TrackPlayer.play();
  }
  
  const toggleTipo =async () => {
    if(tipo){
      if(!localStateP){
        setIsPaused(false);
        await TrackPlayer.play();
      }
      setBuffering2(false);
      setBuffering(false);
      setConexionLenta(0);
    }
      setTipo((tipo)=>!tipo)
  }

  const handleVideoLoad = (data: any) => {
    console.log('Video cargado:', data.duration);
    setIsVideoReady(true); // Video listo para mostrar
  };

  // Callback cuando el video está bufferizando
  const handleBuffer = async ({ isBuffering }: { isBuffering: boolean }) => {
    console.log('Video bufferizando:', isBuffering, "isVideoReady:", isVideoReady, "tipo:", tipo,"path: ",pathname, "local:",localStateP);
    if (isBuffering && pathname === "/ReproGrande" && tipo &&  currentTrack?.vid) {
      console.log('Video bufferizando, pausando audio');
      await TrackPlayer.pause();
      setBuffering2(true);
      setIsPaused(true);
    } else if(!isBuffering && isVideoReady) {
      console.log('Buffer listo');
      setBuffering2(false);
      console.log('Buffer listo, reproduciendo audio');
    }
  };
  
  
  const renderSong2 = ({ item, index }: { item: AnyObject; index: number }) => {
    return(
      <TouchableOpacity onPress={async val => {await TrackPlayer.seekTo(item.time)}} activeOpacity={0.2}>
        <Text
          style={{
            fontSize: 30,
            color: currentI >= index ? 'green' : 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: 20,
          }}>
          {item.text}
        </Text>
      </TouchableOpacity>
    )
  }

  return( 
      <Animated.View style={[{ flex: 1, backgroundColor: 'transparent' }, animatedStyleScreen]}>  
      <ScrollView onScroll={(e) => {
          isAtTop.value = e.nativeEvent.contentOffset.y <= 0;
        }}
        scrollEventThrottle={16}   ref={scrollRef} simultaneousHandlers={panRef}>
      <LinearGradient
        colors={musica[7] && colorA === "true"? [musica[7],"#111111","#111111"] : ['#111111', '#111111']}
        style={{ flex: 1 }}>
        
        <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",alignContent:"center",paddingTop:42}}> 
          <TouchableOpacity onPress={() => router.back()} style={{marginLeft:RFValue(10)}} 
          >  
                <Icon
                  type={'ionicon'}
                  name={"chevron-down"}
                  color={"white"} 
                  size={RFValue(30)}
                />
            </TouchableOpacity>
          <View style={{marginLeft:RFValue(-10)}}>
              <Text style={{textAlign:"center",alignSelf:"center",fontSize:13,color:"gray",alignContent:"center",alignItems:"center"}}>Reproduciendo desde Playlist</Text>
              <Text style={{textAlign:"center",alignSelf:"center",fontSize:14,color:"white",alignContent:"center",alignItems:"center",fontWeight:"500"}}>{AdT?"Anuncio":reproduciendoD}</Text> 
          </View>
          <TouchableOpacity style={{marginRight:RFValue(10)}} onPress={() => modalT()}>
                <Icon type={'ionicon'} name={'ellipsis-vertical'} color={'#CBCBCB'} size={RFValue(20)} style={{}} />
            </TouchableOpacity>
          </View>
          <GestureDetector gesture={panGestureScreen}>
          <View>
          <View style={{alignSelf:"center",height:410}}>
            {currentTrack?.vid? (
              <>
                <View>
                  <Video
                    source={{
                      uri: currentTrack?.vid,
                      bufferConfig: {
                        minBufferMs: 5000,
                        maxBufferMs: 10000,   
                        bufferForPlaybackMs: 5000,  
                        bufferForPlaybackAfterRebufferMs: 5000 
                      }
                    }}
                    volume={0.0}
                    resizeMode="contain"
                    ref={videoRef}
                    poster={require('../../assets/images/icon.png')}
                    onLoad={handleVideoLoad}  // Controlar cuándo el video está cargado
                    onBuffer={handleBuffer} // Controlar el buffer
                    onPlaybackStateChanged={handleStatusUpdateV}
                    paused={isPaused}
                    onProgress={({ currentTime }) => setVideoTime(currentTime)}
                    style={{
                      // Mantener el video oculto hasta que esté listo
                      width: window.width,
                      height: isVideoReady ? window.width - 60: 0,
                      alignSelf: "center",
                      marginTop: isVideoReady ? RFValue(75): 0,
                      opacity: AdT? isVideoReady ? 1 : 0 : tipo ? 1 : 0,  // Controlar la opacidad para ocultar/mostrar el video
                      zIndex:999
                    }}
                  />
                  {user?.extra?.subtitulos && isVideoReady && tipo && !AdT ? (
                <View style={{}}>
                  <>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={{fontSize:15,color:"#C7C7C7",textAlign:"center",marginTop:-15,maxWidth:window.width,alignSelf:"center",position:"absolute"}}>{prevLine}</Text>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={{fontSize:22,color:"#C7C7C7",textAlign:"center",marginTop:2,maxWidth:window.width,alignSelf:"center",position:"absolute"}}>{currentLine}</Text>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={{fontSize:15,color:"#C7C7C7",textAlign:"center",marginTop:30,maxWidth:window.width,alignSelf:"center",position:"absolute"}}>{nextLine}</Text>
                  </>
                </View>
                )  :
                  null}
                </View>

                  <AnimatedR.Image
                  source={{ uri: musica[2] }}
                  style={{
                    width: window.width - 60,
                    height: window.width - 60,
                    alignSelf: 'center',
                    marginTop: 75,
                    position: 'absolute',
                    transform: [{ translateX: translateX }],
                    opacity: AdT
                    ? (isVideoReady ? 0 : 1) // si es anuncio, oculto la imagen cuando el video ya cargó
                    : currentTrack?.vid
                      ? (tipo ? (isVideoReady ? 0 : 1) : 1) // si es canción con video y modo video activo → ocultar imagen al cargar
                      : 1 // si no hay video → siempre mostrar imagen
                  }}
                  resizeMode="contain"
                  defaultSource={require('../../assets/images/icon.png')} // placeholder equivalente en Image nativo
                />
              </>
            ) : (

                <AnimatedR.Image
                  source={{ uri: musica[2] }}
                  style={{
                    width: window.width - 60,
                    height: window.width - 60,
                    alignSelf: 'center',
                    marginTop: 75,
                    position: 'absolute',
                    transform: [{ translateX: translateX }],
                  }}
                  resizeMode="contain"
                  defaultSource={require('../../assets/images/icon.png')} // placeholder equivalente en Image nativo
                />
            )}
            </View>
            </View>
            </GestureDetector>
            <View style={{flexDirection:"row",marginLeft:RFValue(5),width:window.width-40,alignSelf:"center",marginTop:RFValue(60),height:30}}>
              <View style={{flexDirection:"column",width:"88%"}}>
              </View>
                {currentTrack?.vid && !AdT?
                  <TouchableOpacity
                      onPress={() => toggleTipo()}
                      style={{marginLeft:RFValue(5)}}>  
                      <Icon
                        type={'material'}
                        name={tipo? "image":"movie"}
                        color={"gray"} 
                        size={RFValue(28)}
                      />
                  </TouchableOpacity>
                  :null
                }
            </View>
            <View style={{flexDirection:"row",marginLeft:RFValue(5),width:window.width-40,alignSelf:"center",marginTop:RFValue(5)}}>
              <View style={{flexDirection:"column",width:"88%"}}>
                <Text style={{fontSize:20,fontWeight:"bold",color:"white"}}>{musica[0]}</Text>
                <Text style={{fontSize:15,color:"#C7C7C7"}}>{musica[1]}</Text>
              </View>
              <View style={{flexDirection:"column"}}>
                <TouchableOpacity
                      onPress={() => like()}
                      style={{marginLeft:RFValue(3),marginTop:RFValue(0)}}>  
                      <Icon
                        type={'ionicon'}
                        name={"heart"}
                        color={iconLC} 
                        size={RFValue(30)}
                      />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 20, marginTop:RFValue(-7) }}>
              <TouchableOpacity onPress={() => activateA()}>
                <Icon type={'material'} name={modoReproduccion === 3 ? "repeat" : modoReproduccion === 2 ? "shuffle-on" : modoReproduccion === 1 ? "shuffle" : "shuffle"} color={modoReproduccion === 0 ? "white" : "green"} size={RFValue(28)} />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={()=>{cancionAnterior()}}>
                  <Icon type={'ionicon'} name={"play-skip-back"} color={"white"} size={RFValue(30)} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => _playAndPause()} style={[{ alignSelf: "center", padding: 20 }, icon === "play" ? { paddingLeft:25, marginRight:-5 } : {}]}>
                  <Icon type={'ionicon'} name={icon} color={"white"} size={RFValue(48)} />
                </TouchableOpacity>

                <TouchableOpacity onPress={()=>{cancionSiguiente()}}>
                  <Icon type={'ionicon'} name={"play-skip-forward"} color={"white"} size={RFValue(30)} />
                </TouchableOpacity>
              </View>
              <View style={{position:"absolute",alignSelf:"center",marginTop:-RFValue(55),marginLeft:"90%"}}>
                  <Icon type={'material'} name={"sync"} color={"white"} size={RFValue(28)} style={{ opacity: buffering || buffering2 ? 1 : 0 }} />
                </View>
              <TouchableOpacity onPress={() => toggleQueue()}>
                <Icon type={'ionicon'} name={"list"} color={"white"} size={RFValue(28)} />
              </TouchableOpacity>
            </View>
                
              {true && (
              <View style={{flexDirection:"column",alignSelf:"center",marginTop:-15, width:window.width-15}}> 
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    value={position}
                    minimumValue={0}
                    maximumValue={duration}
                    minimumTrackTintColor="#1DB954"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#fff"
                    onSlidingComplete={async val => {
                      await TrackPlayer.seekTo(val);
                      await videoRef.current?.seek(position);
                    }}
                  />
                  <View style={{flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: -10,
                    paddingHorizontal: 15}}>
                    <Text style={{fontSize:11,color:"white",marginLeft:0}}>{a}</Text> 
                    <Text style={{fontSize:11,color:"white",marginLeft:0}}>{t}</Text>
                  </View>
              </View>
              )}

              {typeof musica[5] === 'string' && musica[5].length > 0 && currentLyric && currentLyric.length > 0 ? (
              <Animated.View
                entering={FadeInDown.delay(500).duration(500)} 
                style={{ marginTop: 50, alignSelf:"center", flex: 1,width:window.width-40,height:window.width-60,backgroundColor:"#232323",borderRadius:20 }}>
                <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
                  <Text style={{ fontSize: 19, color: 'white', alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: 10, marginLeft:10, marginTop:5 }}>
                    Letra
                  </Text>
                  <TouchableOpacity style={{}} onPress={() => toggleOverlayL()}>
                    <Icon style={{marginRight:10}} type={'material'} name={"open-in-full"} color={"white"} size={24} />
                  </TouchableOpacity>
                </View>
                <LinearGradient
                  colors={['rgba(35, 35, 35, 1)','rgba(35, 35, 35, 0.9)', 'rgba(35, 35, 35, 0.5)', 'rgba(35, 35, 35, 0.3)', 'rgba(35, 35, 35, 0)']}
                  style={{
                    position: 'absolute',
                    top: 30,
                    left: 0,
                    right: 0,
                    height: 80,
                    zIndex: 1, // Asegura que esté encima del FlatList
                    
                  }}
                />
                <FlatList
                  ref={scrollViewRef}
                  scrollEnabled={false}
                  data={currentLyric}
                  keyExtractor={(item, index) => index.toString()}
                  nestedScrollEnabled={true}
                  indicatorStyle={'white'}
                  contentContainerStyle={{ paddingTop: window.width/2-85, paddingBottom: window.width/2-85, paddingHorizontal:10 }}
                  style={{ zIndex: 0,marginBottom:15}} // Ajusta la posición z del FlatList
                  renderItem={({item,index})=> (
                    <Text 
                      style={{
                        fontSize: 26,
                        color: currentI === index ? 'green' : 'white',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        marginBottom: 15,
                      }}>
                      {item.text}
                    </Text>
                  )}
                  />
                <LinearGradient
                  colors={['rgba(35, 35, 35, 0)', 'rgba(35, 35, 35, 0.3)', 'rgba(35, 35, 35, 0.5)', 'rgba(35, 35, 35, 0.9)', 'rgba(35, 35, 35, 1)']}
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 0,
                    right: 0,
                    height: 80,
                    borderRadius:10
                  }}
                />
              </Animated.View>
              
            ) : null}

            {artista && artista.length !== 0 && artista.uri && (
              <TouchableOpacity onPress={()=>{ router.push({
              pathname: "/(screens)/Autor",
                params: {
                  nameA: currentTrack.artist,
                }
              })}}>
              <Animated.View 
                entering={FadeInDown.delay(500).duration(1000)}
                style={{
                  marginTop: 50, // Más espacio respecto a la letra
                  marginBottom: 20,
                  borderRadius: 20,
                  marginHorizontal: 0,
                  width:window.width-40,
                  alignSelf: 'center',
                }}>
                {artista.uri && (
                  <Image
                    source={{ uri: artista.uri }}
                    style={{ width: window.width-40, height: 250, borderTopLeftRadius: 20, borderTopRightRadius: 20, opacity:0.8 }}
                    contentFit="cover"
                  />
                )}
                <Text style={{
                  fontSize: 17,
                  fontWeight: 'bold',
                  color: '#fff',
                  marginTop: 10,
                  marginLeft: 10,
                  textAlign: 'center',
                  paddingBottom: 5,
                  position: 'absolute'
                }}>
                  Acerca del artista
                </Text>

                <View style={{padding:10, backgroundColor:"#232323", borderBottomLeftRadius: 20, borderBottomRightRadius: 20}}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
                    {artista.name}
                  </Text>

                  <Text numberOfLines={3} style={{ color: '#ccc', fontSize: 14, marginBottom: 5 }}>
                    {artista.descripcion}
                  </Text>
                </View>
                
              </Animated.View>
              </TouchableOpacity>
            )}
          <View style={{marginTop:50}}>
          </View>
          </LinearGradient>
        </ScrollView>
      

      <BottomSheetModal
        ref={modalRefL}
        index={1}
        snapPoints={snapPoints2}
        enableDynamicSizing={false}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        handleComponent={() => null}
        onDismiss={toggleOverlayL2}
        stackBehavior='push'
      >
          <View style={[
          {
            backgroundColor: "#181818",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            minHeight: window.height * 0.85,
            paddingBottom: 0,
            paddingHorizontal: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
            justifyContent: "flex-end",
          }
        ]}>
              {/* Header */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 10,
                paddingTop: 50,
                paddingBottom: 8,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                backgroundColor: "#181818",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}>
                <TouchableOpacity onPress={() => toggleOverlayL()}>
                  <Icon type="ionicon" name="chevron-down" color="white" size={RFValue(30)} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: "center", marginLeft: 0 }}>
                  <Text style={{ fontSize: 16, color: "white", fontWeight: "bold" }} numberOfLines={1}>
                    {musica[0]}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#B3B3B3" }} numberOfLines={1}>
                    {musica[1]}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => toggleOverlayP()}>
                  <Icon type="ionicon" name="ellipsis-vertical" color="#CBCBCB" size={RFValue(22)} />
                </TouchableOpacity>
              </View>

              {/* Gradiente superior */}
              <LinearGradient
                colors={['#181818', 'rgba(24,24,24,0.7)', 'rgba(24,24,24,0.0)']}
                style={{ height: 100, width: "100%", position: "absolute", top: 90, left: 0, zIndex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                pointerEvents="none"
              />

              {/* Letra */}
              <FlatList
                ref={scrollViewRef2}
                data={currentLyric}
                onScrollBeginDrag={handleUserScroll}
                keyExtractor={(item, index) => index.toString()}
                nestedScrollEnabled
                indicatorStyle="white"
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 70,
                  paddingBottom: window.height / 2.5,
                }}
                style={{ zIndex: 0, marginTop: 0 }}
                renderItem={renderSong2}
                showsVerticalScrollIndicator={false}
              />

              {/* Gradiente inferior */}
              <LinearGradient
                colors={['rgba(24,24,24,0.0)', 'rgba(24,24,24,0.7)', '#181818']}
                style={{ height: 100, width: "100%", position: "absolute", bottom: 140, left: 0, zIndex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
                pointerEvents="none"
              />

              {/* Controles */}
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginHorizontal: 30,
                marginTop: 0,
                marginBottom: 10,
              }}>
                <TouchableOpacity>
                  <Icon type="ionicon" name="repeat" color="white" size={RFValue(28)} />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity>
                    <Icon type="ionicon" name="play-skip-back" color="white" size={RFValue(30)} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={_playAndPause}
                    style={[
                      { alignSelf: "center", padding: 20 },
                      icon === "play" ? { paddingLeft: 25, marginRight: -5 } : {},
                    ]}
                  >
                    <Icon type="ionicon" name={icon} color="white" size={RFValue(48)} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>{cancionSiguiente()}}>
                    <Icon type="ionicon" name="play-skip-forward" color="white" size={RFValue(30)} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <Icon type="ionicon" name="infinite" color="white" size={RFValue(28)} />
                </TouchableOpacity>
              </View>

              {/* Slider */}
              {typeof progress === 'number' && !isNaN(progress) && (
                <View style={{
                  flexDirection: "column",
                  alignSelf: "center",
                  marginTop: -40,
                  width: window.width - 30,
                  marginBottom: 30,
                }}>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    value={position}
                    minimumValue={0}
                    maximumValue={duration}
                    minimumTrackTintColor="#1DB954"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#fff"
                    onSlidingComplete={async val => {
                      await TrackPlayer.seekTo(val);
                    }}
                  />
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: -10,
                    paddingHorizontal: 15,
                  }}>
                    <Text style={{ fontSize: 12, color: "#B3B3B3" }}>{a}</Text>
                    <Text style={{ fontSize: 12, color: "#B3B3B3" }}>{t}</Text>
                  </View>
                </View>
              )}
            </View>
        </BottomSheetModal> 

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
          <Image source={{ uri: musica[2] }} style={styles.image} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.title} numberOfLines={1}>{musica[0]}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{musica[1]}</Text>
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
      ref={modalRefQueue}
      index={1}
      snapPoints={["30%","50%","80%"]}
      enableDynamicSizing={false}
      backdropComponent={BottomSheetBackdrop}
      backgroundStyle={{ backgroundColor: '#111' }}
      onDismiss={toggleQueue}
      handleIndicatorStyle={{ backgroundColor: 'gray' }}
      stackBehavior="replace"
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{fontSize:15,textAlign:"center",color:"white",fontWeight:"bold",paddingTop:5}}>
          Próximas canciones
        </Text>
        <View style={{marginTop:10}} />
        <BottomSheetFlatList
          data={buildPlaylistQueue(playlistSongs, modoReproduccion, currentTrack)}
          keyExtractor={(item, index) => (item.id ?? index).toString()}
          renderItem={({item, index}) => (
                  <TouchableOpacity onPress={async () => {
              try{
                if (item.id !== undefined) {
                  await TrackPlayer.skip(item.id);
                } else {
                  // fallback: reset and add this track first
                  await TrackPlayer.reset();
                  await TrackPlayer.add(normalizeTrack(item) as any);
                }
                setVisibleQueue(false);
                modalRefQueue.current?.close();
              }catch(err){console.log(err)}
            }} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'}}>
              <Text style={{color:'white',fontSize:16}} numberOfLines={1}>{item.title ?? item.name}</Text>
              <Text style={{color:'#aaa',fontSize:13}} numberOfLines={1}>{item.artist ?? item.autor}</Text>
            </TouchableOpacity>
          )}
        />
      </BottomSheetView>
    </BottomSheetModal>

      <BottomSheetModal
        ref={modalRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        onDismiss={modalT}
        stackBehavior='replace'
      >
        <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
          <View style={styles.infoRow}>
            <Image
              source={{ uri: musica[2] }}
              style={styles.image}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.title} numberOfLines={1}>{musica[0]}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{musica[1]}</Text>
            </View>
          </View>

          <Option icon="add-circle-outline" label="Agregar a una playlist" onPress={() => toggleOverlayP()} />
          <Option icon="cloud-download-outline" label="Descargar" onPress={() => {descargarYGuardarArchivoLocalmente()}} />
          <Option icon="person" label="Ir al artista" onPress={() => {
            router.push({
              pathname: "/(screens)/Autor",
              params: {
                nameA: musica[1],
              }
            });
            modalRef.current?.close();
            modalRefL.current?.close();
            modalRefP.current?.close();
          }} />
          <ExternalLink style={{}} href={`https://www.google.com/search?q=${musica[0]+" "+musica[1]}`}>
            <View style={styles.option}>
              <Icon type={'ionicon'} name={"globe-outline"} color={"gray"} size={34} />
              <Text style={styles.optionText}>Abrir en la web</Text>
            </View>
          </ExternalLink>
        </View>
      </BottomSheetModal>        
    </Animated.View>
  );
  
}

const styles = StyleSheet.create({
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
