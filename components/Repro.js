import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  Keyboard,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';

import { router, useFocusEffect, usePathname } from 'expo-router';
import * as Progress from 'react-native-progress';
import { RFValue } from 'react-native-responsive-fontsize';

import { useAds } from "@/hooks/useAds";
import dayjs from "dayjs";
import { collection, deleteDoc, doc, getDoc, increment, onSnapshot, query, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import TrackPlayer, { Event, State, useProgress } from 'react-native-track-player';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';

export default function Repro() {
  const [iconLC, setIconLC] = useState("white");
  const { loadAds, playAd } = useAds();
  const pathname = usePathname();

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [numberLikes, setNumberLikes] = useState(0);
  const [marginBottom, setMarginBottom] = useState(0);
  const [user, setUser] = useState([]);

  const [dominantColor, setDominantColor] = useState("#404040")
  const { qplaylist, icon, setIcon, musica, setMusica, colorA, setColorA, uid, setUid, estado, setEstado, estado2, setEstado2, setModoReproduccion ,modoReproduccion, currentTrack, setCurrentTrack, currentIndexRef, setCurrentIndex, reproduciendoD, setReproduciendoD, setAdT, setIsVideoReady, singleLoop } = useApp();
  const [playing, setPlaying] = useState(null);
  const { position, duration } = useProgress(1000); // actualiza cada 1000ms
  const [progress, setProgress] = useState(0);
  const lastUpdatedRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);

  useFocusEffect(
    // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
    useCallback(() => {
      // Invoked whenever the route is focused.
      console.log("Hello, I'm focused!");

      // Return function is invoked whenever the route gets out of focus.
      return () => {
        console.log('This route is now unfocused.');
      };
    }, []),
  );

  useEffect(() => {
    console.log("|||||||||||||||||||",pathname);
  }, [pathname]);

  useEffect(()=>{
    var au = duration/1000
    var ac = position/1000
    var xd = (ac/au)
    setProgress(xd)
  },[position,duration])
  
  const updateNumber2 = (name,uri,autor,img,generos,letra,dominant,qplaylist) => {
      console.log("funcion de updateNumber2");
      try{
        const now = dayjs();
        let seconds = now.second();

        const decenas = Math.floor(seconds / 10) * 10;
        const unidades = seconds % 10;
        const unidadesRedondeadas = 0;

        const newSeconds = decenas + unidadesRedondeadas;

        var date = now.set("second", newSeconds).format("ddd MMM DD YYYY HH:mm:ss").concat(name);
        let letra1 = letra ?? "";
        let dominant1 = dominant ?? "";
        
        if(lastUpdateTimeRef.current === date){
          console.log("misma fecha, no actualizo:", date);
          return;
        }
        lastUpdateTimeRef.current = date;

        const historyARef = doc(db, "people", uid, "historyA", date);
          setDoc(historyARef,{
            dateU:Timestamp.now().toDate(),
            dateS:date,
            name:name,
            autor:autor,
            uri:uri,
            img:img,
            generos:generos,
            letra:letra1,
            dominantColor:dominant1,
            tipo:"Canción",
          }).then(() => {
            console.log('Reproducción guardada en historyA:', name);
          })

        console.log("actualizando reproducciones en Repro ya seguro", "qplay:",qplaylist)
        try{
          if(qplaylist.length < 28 ){
            const ref = doc(db, "people", uid,"playlists",qplaylist,"Likes",name);
              updateDoc(ref, {
                popularity:increment(1)
              }).then(() => {
                console.log('Actualización exitosa de Repro:', name);
              })
              .catch((error) => {
                console.error('Error al actualizar:', error);
              });
            }
          }catch(err){
            console.log("no se pudo actualizar la popularidad en Repro, probablemente no exista la canción en Likes", err)
          }
          
    
          
        }catch(err){
          console.log(err)
        }
      }

  useEffect(() => {
  const fetchCurrentTrack = async () => {
    try {
      const trackId = await TrackPlayer.getCurrentTrack();
      if (trackId !== null) {
        const track = await TrackPlayer.getTrack(trackId);
        if(track){
          setMusica([track.title,track.artist,track.artwork,[track.url,track.vid],track.generos,track.letra,track.donde,track.dominantColor]);
          if(track.isAd && pathname !== "/ReproGrande"){
            console.log("despausando anuncio porque no esta en reprogrande")
            TrackPlayer.play();
          }
          console.log("trackIniReproSEsuponesoloalinicio","track",track.title);
          setCurrentTrack(track);
          currentIndexRef.current = track.id;
          
          setReproduciendoD(track.donde);
          const playbackState = await TrackPlayer.getPlaybackState();
          setEstado2(playbackState.state);
          if (playbackState.state === State.Playing ) {
            setIcon('pause');
          } else {
            setIcon('play');
          }
          if(playbackState.state === State.Ended){
            setEstado(false);
            setEstado2(State.Stopped);
          }else{
            setEstado(true);
          }
        console.log('Track actualRepro:', track.title);
        }  
      }
    } catch (error) {
      console.error('Error al obtener la pista actual:', error);
    }
  };  
  fetchCurrentTrack();
  // Escuchar cambio de pista
  try {
    const trackChangeListener = TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (e) => {
      if (e.nextTrack != null) {
        const track = await TrackPlayer.getTrack(e.nextTrack);
        setMusica([track.title,track.artist,track.artwork,[track.url,track.vid],track.generos,track.letra,reproduciendoD,track.dominantColor]);
        console.log("||Repro",track.title,"path",pathname); 
        setCurrentTrack(track);
        if(track){
          if(track.isAd && pathname !== "/ReproGrande"){ 
            console.log("despausando anuncio porque no esta en reprogrande")
            TrackPlayer.play();
          } 
          setEstado(true); 
          currentIndexRef.current = track.id
          console.log('Track cambiado e indiceRepro:', e.nextTrack,e.track,"|", track.title);
          if(!track.isAd && lastUpdatedRef.current !== track.title){
            lastUpdatedRef.current = track.title;
            updateNumber2(track.title,track.url,track.artist,track.artwork,track.generos,track.letra,track.dominantColor,track.qplaylist);
          }
          
        }
      }
    });

    // 👇 Escuchar cambio de estado de reproducción
    const playbackStateListener = TrackPlayer.addEventListener(Event.PlaybackState, async ({ state }) => {
      setEstado2(state);
      if (state === State.Playing) {
        setIcon('pause');
      } else if(state === State.Paused) {
        setIcon('play');
      }
      if (state === State.Ended) {
        console.log("endedRepro", modoReproduccion, "singleLoop:", singleLoop);
        setAdT(false);
        if (singleLoop) {
          // Force repeat current
          await TrackPlayer.seekTo(0);
          await TrackPlayer.play();
        } else {
          switch (modoReproduccion) {
            case 0:
              await TrackPlayer.reset();
              setEstado(false);
              setIcon('play');
              console.log("0");
              break;

            case 1:
            case 2:
              // La cola ya tiene las canciones cargadas en modo orden o aleatorio.
              // No hacemos nada especial aquí para dejar que la siguiente pista se reproduzca.
              console.log("1/2 - cola secuencial o aleatoria");
              break;

            case 3:
              console.log("3");
              await TrackPlayer.seekTo(0);
              await TrackPlayer.play();
              break;
          }
        }
      }


      if(state === State.Stopped){
        setEstado(false);
        setMusica([]);
        setCurrentTrack([]);
        setAdT(false);
        setIcon("play");
      }
    });

    return () => {
      trackChangeListener.remove();
      playbackStateListener.remove();
    };

  } catch (error) {
    console.error('Error al obtener la pista actual:', error);
  }
  
}, [estado,modoReproduccion,reproduciendoD, pathname, lastUpdateTimeRef, lastUpdatedRef]);

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
        ToastAndroid.showWithGravity('No hay canciones disponibles para reproducir', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
        return;
      }

      // build queue according to modoReproduccion
      const buildQueue = () => {
        if (modoReproduccion === 3) return []; // loop current
        if (modoReproduccion === 2) return shufflePlaylist(playlistSongs);
        if (modoReproduccion === 0) return [playlistSongs[0]];
        // modo 1 ordered
        return playlistSongs;
      };

      const shufflePlaylist = (pl) => {
        const copy = [...pl];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const queue = buildQueue();
      await TrackPlayer.reset();
      if (queue.length > 0) await TrackPlayer.add(queue);
      setIcon('pause');
      await TrackPlayer.play();
    } catch (err) {
      console.error(err);
    }
    console.log('Estado actual:', estado2);
  };

  useEffect(() => {
  let unsubscribe;

  if (currentTrack && uid) {
    if (currentTrack.dominantColor && colorA === "true") {
      setDominantColor(currentTrack.dominantColor);
    } else {
      setDominantColor("#404040");
    }
    try {
      var qplay = qplaylist.length < 28 ? qplaylist : "Likes";
      console.log("qplay: ",qplay, qplaylist);
      const playlistDocRef = doc(db, 'people', uid, 'playlists', qplay , 'Likes', musica[0]);
      unsubscribe = onSnapshot(playlistDocRef, (snapshot) => {
        setIconLC(snapshot.exists() ? "green" : "white");
      });
    } catch (err) {
      console.log(err);
    }
  }

  // Limpieza del listener al desmontar o cambiar musica[0]/uid
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [qplaylist, uid, currentTrack]);
  
  const getUser =async () => {
    var user = uid
    const docRef = doc(db, "people", user);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    setUser(data)
  }

  useEffect(()=>{
    let unsubscribe;
    try{
      if(uid){
        getUser()
        const q = query(collection(db, "people",uid,"playlists","Likes","Likes"));
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          var s = querySnapshot.size
          setNumberLikes(s);
        });  
        
       
      } 
    }catch(err){
      console.log(err);
    }
    return () => {
    if (unsubscribe) {
      unsubscribe();
    }
    };
  },[uid])

  const like = () => {
    var qplay = qplaylist.length < 28 ? qplaylist : "Likes";
    console.log("||",uid)
    if(!currentTrack.isAd){
      try{
        var letra = "";
        var dominant = ""
        letra = currentTrack.letra;
        dominant = currentTrack.dominantColor
        if(letra===undefined){
          letra = "";
        }
        if(dominant === undefined){
          dominant = ""
        }
          if(iconLC === "white"){
              setIconLC("green")
              const historyRef = doc(db, "people", uid, "playlists", qplay,"Likes",currentTrack.title);
              setDoc(historyRef,{
                name:currentTrack.title,
                uri:currentTrack.url,  
                img:currentTrack.artwork,
                letra:letra,
                tipo:"Canción",
                autor:currentTrack.artist,
                generos:currentTrack.generos, 
                dominantColor:dominant,
                dateU:Timestamp.now().toDate(),
                popularity: 1,
              })     
          }else{
            setIconLC("white")
            const historyRef = doc(db, "people", uid, "playlists", qplay,"Likes",currentTrack.title);
            deleteDoc(historyRef) 
          }
        }catch(err){
          console.log(err)
        }
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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // El teclado está abierto, ajusta el estilo según sea necesario
        setMarginBottom('1%');
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // El teclado se ha cerrado, restaura el estilo original
        setMarginBottom('15%');
      }
    );

    // Limpia los listeners al desmontar el componente
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const reset = () => {
    TrackPlayer.reset();
    setIcon("play");
    setEstado(false);
    setMusica([]);
    setCurrentTrack([]);
    setAdT(false);
    currentIndexRef.current = -1;
    setCurrentIndex(0);
    setModoReproduccion(0);
  };
  
  if(estado){
    try{
      return(
          <TouchableOpacity activeOpacity={0.7} onLongPress={()=>{reset()}} onPress={()=>router.push('/(screens)/ReproGrande')}  style={{ backgroundColor: dominantColor,borderRadius:7,width:"96%",alignSelf:"center",marginBottom:RFValue(22), height:RFValue(55)}}> 
        <View style={{flexDirection:"row", alignItems:"center",justifyContent:"space-between",width:"100%"}}> 
              <Image
                source={{ uri: currentTrack.artwork }} 
                style={{
                  width: RFValue(40),
                  height: RFValue(40),
                  resizeMode: 'cover',
                  borderRadius: RFValue(3),
                  marginLeft: RFValue(5),
                  alignSelf:"center",
                  marginTop:RFValue(5)
                }}></Image>
              <View style={{flexDirection:"row",justifyContent:"space-between",flex:1}}>
                <View style={{ flexDirection: 'column', marginLeft: 5, flex:1 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      color: "white",
                      fontWeight: 'bold',
                      marginTop: 10,
                      maxWidth:"90%"
                    }} 
                    numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <View style={{flexDirection:"row"}}>
                    <Text numberOfLines={1} style={{fontSize: 13,color: '#E8E8E8',marginTop: 0,marginLeft: 2, maxWidth:"90%"}}>
                      {currentTrack.artist}
                    </Text> 
                  </View>
                </View> 
                <View style={{flexDirection:"row",marginTop:7,marginRight:RFValue(10)}}>
                <TouchableOpacity
                    onPress={() => playAd()}
                    style={{alignSelf:"center", paddingRight:10}}>  
                    <Icon
                      type={'ionicon'}
                      name={"play-forward"}
                      color={"white"} 
                      size={RFValue(18)}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => like()}
                    style={{alignSelf:"center"}}>  
                    <Icon
                      type={'ionicon'}
                      name={"heart"}
                      color={iconLC} 
                      size={RFValue(32)}
                    />
                  </TouchableOpacity> 
                  <TouchableOpacity
                    onPress={() => _playAndPause()}
                    style={{alignSelf:"center"}}>  
                    <Icon
                      type={'ionicon'}
                      name={icon}
                      color={"white"} 
                      size={RFValue(34)}
                    />
                  </TouchableOpacity> 
                </View>
                </View>
              </View>  
              {typeof progress === 'number' && !isNaN(progress) && (
                <View style={{flexDirection:"column",alignSelf:"center",marginTop:5,width:RFValue(300),alignItems:"center"}}> 
                  <Progress.Bar
                    progress={progress}
                    height={2}
                    width={RFValue(300)}
                    color="white"
                    borderWidth={0}
                  />
                </View>
              )}       
            </TouchableOpacity>  
      );
    }catch(err){
      console.log(err)
    }
  }
  
}