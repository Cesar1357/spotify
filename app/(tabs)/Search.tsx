import { ExternalLink } from '@/components/ExternalLink';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet/src';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { Searchbar } from 'react-native-paper';
import { RFValue } from 'react-native-responsive-fontsize';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { collection, deleteDoc, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import TrackPlayer, { Event, Track } from 'react-native-track-player';
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

function delay(n){
    return new Promise(function(resolve){
        setTimeout(resolve,n*1000);
    });
}
export default function Search() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [allTransactionsS,setAllTransactionsS] = useState([])
  const { icon, setIcon, musica, setMusica, colorA, setColorA } = useApp();

  const [songs, setSongs] = useState([]);
  const [autors, setAutors] = useState([]);

  const [actualS2, setActualS2] = useState({});

  const modalRef = useRef<BottomSheetModal>(null);
  const modalRefL = useRef<BottomSheetModal>(null);
  const modalRefP = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['45%', '45%'], []);
  const snapPoints2 = useMemo(() => ['100%', '100%'], []);
  const snapPoints3 = useMemo(() => ['30%', '40%'], []);

  const Option = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Icon type="ionicon" name={icon} color="gray" size={30} />
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );

  const [likes, setLikes] = useState([])

  const [visibleP, setVisibleP] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [actualPlaylistLikes, setActualPlaylistLikes] = useState([]);
  const [index, setIndex] = useState();
  const [playlistsO, setPlaylistsO] = useState([]);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [text,setText] = useState("")
  var dimen = Dimensions.get("window")

  const [user, setUser] = useState([]);
  const [actualizado, setActualizado] = useState(false);
  const { uid, loading } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isReady, setIsReady] = useState(false);
  
      useEffect(() => {
      const fetchCurrentTrack = async () => {
        try {
          const trackId = await TrackPlayer.getCurrentTrack();
          if (trackId !== null) {
            const track = await TrackPlayer.getTrack(trackId);
            setCurrentTrack(track);
            console.log('Track actual:', track);
          }
        } catch (error) {
          console.error('Error al obtener la pista actual:', error);
        }
      };
  
      fetchCurrentTrack();
  
      // Escuchar cambios de pista
      const listener = TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (e) => {
        if (e.nextTrack != null) {
          const track = await TrackPlayer.getTrack(e.nextTrack);
          setCurrentTrack(track);
          console.log('Track cambiado:', track);
        }
      });
  
      return () => {
        listener.remove(); // Limpia el listener al desmontar
      };
    }, []);

  useEffect(() => {
    if(!loading && uid !== null){
      try{
        obtener()
        getHistorial();
        getTransactions2();
        getSongs1();
        getAutors();
        getPlaylists();
        getPlaylistsOthers();
        getUser()
      }catch(err){
        console.log(err)
      }
    }
  }, [loading,uid]);
  
  useEffect(() => {
      if(actualizado === false){
        console.log("Re-rendering Search screen","Buscar",musica[0]);
        if(musica[0] && allTransactions.some(song => song.name === musica[0])){
          console.log("Updating musica in Search screen:", musica[0]);
          setMusica([musica[0],musica[1],musica[2],musica[3],musica[4],musica[5],"Buscar",musica[7]])
          console.log("Musica updated in Search screen:", musica[0]);
          setActualizado(true);
        }
      }
    },[allTransactions,actualizado,musica[0]]);

const obtener = async() => {
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

const getTransactions2 = () => {
  try{
  const q = query(collection(db, "people", uid,"playlists","Likes","Likes"));
  const unsub = onSnapshot(q, (snapshot) => {
    const likesData = snapshot.docs.map(doc => doc.data());
    setLikes(likesData)
  });
  }catch(err){
    console.log(err)
  }
}

const getUser =async () => {
    const docRef = doc(db, "people", uid);
    const docSnap = await getDoc(docRef);
    const info = docSnap.data()
    setUser(info)
  }

  const getPlaylists = () => {
    const q = query(collection(db, 'people',uid,"playlists"),orderBy('importance', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => doc.data());
      setAllPlaylists(docs)
    });
}

  const getSongs1 = async() => {
    const q = query(collection(db, "musica"), orderBy('popularity', 'desc'));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    setSongs(data)
  };

 
  const getHistorial = async() => {
    const q = query(collection(db, "people",uid,"history"),limit(10), orderBy('dateU', 'desc'));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    setAllTransactions(data)
  }

  const getAutors = async() => {
    const q = query(collection(db, "autores"));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    setAutors(data)
  };

  const getPlaylistsOthers = async() => { 
    const q = query(collection(db, "playlists"));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    setPlaylistsO(data)
  };

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
 console.log(nombreArchivo)
 
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
      const cancion = {"name":actualS2.name,"img":actualS2.img,"autor":actualS2.autor,"letra":actualS2.letra,"dateU":dateU}; 
      console.log(actualS2);

      const fileInfo = await FileSystem.downloadAsync(
        Array.isArray(actualS2.uri)?actualS2.uri[0]:actualS2.uri, // URL del archivo
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

 
  const updateNumber2 = async(name) => {
    const ref = doc(db, "musica", name);
    await updateDoc(ref, {
      popularity:increment(1)
    }).then(() => {
      console.log('Actualización exitosa');
    })
    .catch((error) => {
      console.error('Error al actualizar:', error);
    });
  };

  const updateH = (name,autor,uri,image,generos,letra,dominant) => { 
    var letra1 = ""
    letra1 = letra;
    if(letra1 === undefined){
      letra1 = ""
    }
    var dominant1 = ""
    dominant1 = dominant
    if(dominant1 === undefined){
      dominant1 = ""
    }

    var date = Timestamp.now()
    .toDate()
    .toString()
    .split(' ')
    .splice(0, 5)
    .join(' ');

    const historyRef = doc(db, "people", uid, "history", name);
    const historyARef = doc(db, "people", uid, "historyA", date);
    setDoc(historyRef,{
      dateU:Timestamp.now().toDate(),
      name:name,
      autor:autor,
      uri:uri,
      img:image,
      generos:generos,
      letra:letra1,
      tipo:"Historial",
      dominantColor:dominant1,
      popularity:0
    })

    setDoc(historyARef,{
      dateU:Timestamp.now().toDate(),
      dateS:date,
      name:name,
      autor:autor,
      uri:uri,
      img:image,
      generos:generos,
      dominantColor:dominant1,
      letra:letra1,
      tipo:"Canción",
    })

  }

  const updateH2 = (name,uri) => {
    router.push({
      pathname: "/(screens)/Autor",
      params: {
        nameA: name,
      }
    });

    const historyRef = doc(db, "people", uid, "history",name);
    setDoc(historyRef,{
      dateU:Timestamp.now().toDate(),
      name:name,
      uri:uri,
      tipo:"HistorialAr",
    })
  }

  const updatePla = async(uid,name,nameA) => { 
    var a = uid+"_"+name
    router.push({
      pathname: "/(screens)/Playlist",
      params: {
        qplaylist: a,
        publicaN: name,
        publica: true
      }
    });
     const ref = doc(db, "playlists", a);
     await updateDoc(ref, {
      popularity:increment(1)
    }).then(() => {
      console.log('Actualización exitosa');
    })
    .catch((error) => {
      console.error('Error al actualizar:', error);
    });

    const historyRef = doc(db, "people", uid, "history", a);
    setDoc(historyRef,{
      dateU:Timestamp.now().toDate(),
      name:a,
      nameP:name,
      autor:nameA,
      uid:uid,
      tipo:"HistorialPl"
    })

  }

  const errase = async(name) => {
    const ref = doc(db, "people", uid,"history",name);
    await deleteDoc(ref).then((e)=>{
      getHistorial();
    })
  }

  useEffect(()=>{
    try{
      const collectionRef = collection(db, "people",uid, "history"); // Reemplaza 'tuColeccion' con el nombre de tu colección
      const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
        // Verifica si la colección existe
        if (querySnapshot.empty) {
          setAllTransactions([])
        }
      });
    }catch(err){
      console.log(err)
    }
  },[uid])

  const getSongs = (text) => {
    setText(text)
    if(text === ""){
      getHistorial()
    }else{
    
    const songs2 = songs;
    const songs3 = autors; 

      var findtext = text.toLowerCase();
      var searchData = songs2.filter(
        (song) => 
          song.name.toLowerCase().includes(findtext)
      );
      var searchData2 = songs3.filter(
        (autor) => 
          autor.name.toLowerCase().includes(findtext)
      ); 
      var searchData3 = playlistsO.filter(
        (list) => 
          list.nameP.toLowerCase().includes(findtext)
      ); 
      var todo = searchData.concat(searchData2,searchData3)
      var todo2 = todo.slice(0,20)
      setAllTransactions(todo2); 

    }
    
   
  };



  const toggleOverlayP = () => {
    if(visibleP === false){
      setVisibleP(true);
      modalT()
    }else{
      setActualS2({}) 
      setVisibleP(false);
    }
    
  };


  const modalT = (uri, name, autor, tipo, img, generos, letra, dominant) => {
    if(modalVisible === true){
      setModalVisible(false)
      modalRef.current?.close()
    }else{
      setActualS2({"uri":uri,"name":name,"autor":autor,"tipo":tipo,"img":img,"generos":generos,"letra":letra,"dominantColor":dominant}) 
      setModalVisible(true)
      modalRef.current?.present()
    }
  }

  const change = async (uri, name, autor, img, generos,letra,dominant) => {  
      if(musica[2] !== "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkM03yBVebiMnBH5Kn2h3XazhS4sAIxn3w6w&s"){
          try {
            // Verificamos si el archivo existe
            const nombreArchivo = name+".mp3"
            const rutaLocal = `${FileSystem.documentDirectory}${nombreArchivo}`;
            const fileInfo = await FileSystem.getInfoAsync(rutaLocal);
            if (fileInfo.exists) {
              console.log("ex")
              setMusica([name,autor,img,uri,generos,letra,"Search",dominant])
              await TrackPlayer.load({
                  url: rutaLocal, // Load media from the network
                  title: name,
                  artist: autor,
                  artwork: img, // Load artwork from the network
                  uri: uri,
                  generos: generos,
                  letra: letra,
                  qplaylist: "Likes",
                  donde: "Search",
                  dominantColor: dominant,
                  isLocal: true
                });
              await TrackPlayer.play();
            } else {
              console.log("noex")
                setMusica([name,autor,img,uri,generos,letra,"Search",dominant])
                await TrackPlayer.load({
                  url: Array.isArray(uri)?uri[0]:uri, // Load media from the network
                  vid: Array.isArray(uri)?uri[1]:null,
                  title: name,
                  artist: autor,
                  artwork: img, // Load artwork from the network
                  uri: uri,
                  generos: generos,
                  letra: letra,
                  qplaylist: "Likes",
                  donde: "Search",
                  dominantColor: dominant,
                  isLocal: false
                });
                await TrackPlayer.play();    
            }
            updateNumber2(name);
            updateH(name,autor,uri,img,generos,letra,dominant)
          } catch (error) {
            console.error('Error al verificar el archivo:', error);
            ToastAndroid.showWithGravity(
              "Error al reproducir la canción",
              ToastAndroid.SHORT,
              ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
            );
          }
        }
      };

  const openLink = (nameA,autor) => {
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

  const _onPlaybackStatusUpdate = playbackStatus => { 
    console.log("xd")
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(
          `Encountered a fatal error during playback: ${playbackStatus.error}`
        );
        // Send Expo team the error on Slack or the forums so we can help you debug!
      }
    } else {
      // Update your UI for the loaded state

      if (playbackStatus.isPlaying) {
        // Update your UI for the playing state
        if(appState.current === "active"){
          var au = playbackStatus.durationMillis/1000
          var ac = playbackStatus.positionMillis/1000
          var xd = (ac/au)
          setProgress(xd);
        }
       
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
          setPlayingStatus("nosound");
          setIconLC("white");
          setMusica([]);
          setIcon("play")
          // The player has just finished playing and will stop. Maybe you want to play something else?
        
      }
    }
  };

  const renderItem = ({ item, i, index }) => {
    var color = "white";
    if(musica[0] === item.name){
      color = "green"
      setIndex(index)
    }
     

    if(item.tipo === "Canción"){
    return (
      <TouchableOpacity style={{padding:4}} onPress={() => change(item.uri, item.name, item.autor,item.img,item.generos,item.letra,item.dominantColor)}>
        <View style={styles.box}>
          <Image
            source={{ uri: `${item.img}` }}
            style={{
              width: 68,
              height: 68,
              resizeMode: 'cover',
              borderTopLeftRadius:10,
              borderBottomLeftRadius:10,
              marginLeft: 0,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"70%" }}>
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
           <TouchableOpacity onPress={(()=>modalT(item.uri, item.name, item.autor, item.tipo, item.img,item.generos,item.letra,item.dominantColor))}>
              <Icon type={'ionicon'} name={'ellipsis-vertical'} color={'#A0A0A0'} size={RFValue(20)} style={{marginTop:0}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
    }
    if(item.tipo === "Historial"){
    return (
      <TouchableOpacity style={{padding:4}} onPress={() => change(item.uri, item.name, item.autor, item.img,item.generos,item.letra,item.dominantColor)}>
        <View style={styles.box}>      
          <Image
            source={{ uri: `${item.img}` }}
            style={{
              width: 68,
              height: 68,
              resizeMode: 'cover',
              borderTopLeftRadius:10,
              borderBottomLeftRadius:10,
              marginLeft: 0,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"68%" }}>
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
                {item.tipo}
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
           <TouchableOpacity onPress={(()=>errase(item.name))}>
              <Icon type={'ionicon'} name={'close'} color={'white'} size={RFValue(30)} style={{marginTop:0}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
    }
    if(item.tipo === "HistorialAr"){
    return (
      <TouchableOpacity style={{padding:4}} onPress={() => updateH2(item.name,item.uri)}> 
        <View style={styles.box}>      
          <Image
            source={{ uri: `${item.uri}` }}
            style={{
              width: 68,
              height: 68,
              resizeMode: 'cover',
              borderTopLeftRadius:10,
              borderBottomLeftRadius:10,
              marginLeft: 0,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"68%" }}>
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
                Artista · Historial
              </Text>
            </View>
          </View>
           <TouchableOpacity onPress={(()=>errase(item.name))}>
              <Icon type={'ionicon'} name={'close'} color={'white'} size={RFValue(30)} style={{marginTop:0}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
    }
    if(item.tipo === "Artista"){
      return (
      <TouchableOpacity onPress={(()=>updateH2(item.name,item.uri))} style={{padding:4}} >
        <View style={styles.box}>
          <Image
            source={{ uri: `${item.uri}` }}
            style={{
              width: 68,
              height: 68,
              resizeMode: 'cover',
              borderTopLeftRadius:10,
              borderBottomLeftRadius:10,
              marginLeft: 0,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"78%" }}>
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
                {item.tipo}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
    }
    if(item.tipo === "Playlist"){
    return (
      <TouchableOpacity style={{padding:4}} onPress={() => updatePla(item.by,item.nameP,item.byN)}> 
        <View style={styles.box}>      
          <Image
            source={{ uri: "https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png" }} 
            style={{
              width: 68,
              height: 68,
              resizeMode: 'cover',
              borderTopLeftRadius:10,
              borderBottomLeftRadius:10,
              marginLeft: 0,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"75%" }}>
            <Text
              style={{
                fontSize: 15,
                color: "white",
                fontWeight: 'bold',
                marginTop: 2,
              }}
              adjustsFontSizeToFit={true} numberOfLines={1}>
              {item.nameP}
            </Text>
            <View style={{flexDirection:"row"}}>
              <Text
                style={{
                  fontSize: 13,
                  color: 'white',
                  marginTop: 2,
                  marginLeft: 2,
                }}>
                {item.tipo}
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
                {item.byN}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
    }
    if(item.tipo === "HistorialPl"){
    return (
      <TouchableOpacity style={{padding:4}} onPress={() => updatePla(item.uid,item.nameP,item.autor)}> 
        <View style={styles.box}>      
          <Image
            source={{ uri: "https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png" }} 
            style={{
              width: 68,
              height: 68,
              resizeMode: 'cover',
              borderTopLeftRadius:10,
              borderBottomLeftRadius:10,
              marginLeft: 0,
            }}></Image>
          <View style={{ flexDirection: 'column', marginLeft: 5, width:"68%" }}>
            <Text
              style={{
                fontSize: 15,
                color: color,
                fontWeight: 'bold',
                marginTop: 2,
              }}
              adjustsFontSizeToFit={true} numberOfLines={1}>
              {item.nameP}
            </Text>
            <View style={{flexDirection:"row"}}>
              <Text
                style={{
                  fontSize: 13,
                  color: 'white',
                  marginTop: 2,
                  marginLeft: 2,
                }}>
               {item.autor} · Historial 
              </Text>
            </View>
          </View>
           <TouchableOpacity onPress={(()=>errase(item.name))}>
              <Icon type={'ionicon'} name={'close'} color={'white'} size={RFValue(30)} style={{marginTop:0}} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
    }
  };

  const renderPlaylist = ({ item, i }) => {
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
}
const getLikesPlaylist =async (playlist) => {
  try{
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
  }catch(err){
    console.log(err)
  }
  };

  const handleOverlayPress = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    const isInsideModal = locationX > 0 && locationY > 0 && locationX < modalRef.current.width && locationY < modalRef.current.height;

    if (!isInsideModal) {
      modalT();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView style={{flex:1,backgroundColor:"#111111"}} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'} persistentScrollbar={true}>
      <View style={styles.upperContainer}>
        <Text
          style={{
            fontSize: 27,
            marginTop: 30,
            marginLeft: 5,
            color: 'white',
            fontWeight: 'bold',
          }}>
          Buscar
        </Text>
      </View>

      <Searchbar
          placeholder="¿Qué quieres escuchar?"
          onChangeText={getSongs}
          value={text}
          
          style={{width:"95%",alignSelf:"center", paddingTop:10}}
      />
      

      <FlatList
        style={{ marginTop: 20}} 
        data={allTransactions}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={true}
        scrollsToTop={false}
        indicatorStyle={'white'}
        persistentScrollbar={true}
        keyExtractor={(item, index) => index.toString()}
        keyboardShouldPersistTaps={'always'}
        ListFooterComponent={
          <View> 
            <Text style={{height:RFValue(200)}}></Text>    
          </View> 
        }
        ListEmptyComponent={
          text !== ""?
          <TouchableOpacity style={{marginBottom:1,alignSelf:"center",backgroundColor:"#111111",marginTop:"50%"}}> 
            <Text style={{fontSize:25,color:"white",fontWeight:"bold",textAlign:"center",borderColor:"gray",borderTopWidth:2}}>No la encontramos</Text>
            <Text style={{fontSize:25,color:"white",fontWeight:"bold",textAlign:"center",borderColor:"gray",borderBottomWidth:2}}>¡Agrégala!</Text>
          </TouchableOpacity>
          :
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", marginTop:dimen.height/3-20 }}>
              ¡No tienes busquedas recientes!
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "gray" }}>
              Busca algo para llenarlo
            </Text>
          </View>
        }
      />
      <BottomSheetModal
      ref={modalRefP}
      index={1}
      snapPoints={snapPoints3}
      enableDynamicSizing={false}
      detached={true}
      containerStyle={{width:"80%",marginLeft:"10%"}}
      style={{marginTop:-220}}
      backdropComponent={BottomSheetBackdrop}
      backgroundStyle={{ backgroundColor: '#111' }}
      handleIndicatorStyle={{ backgroundColor: 'gray' }}
      stackBehavior='switch'
    >
      <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
        <Text style={{fontSize:15,textAlign:"center",color:"white",fontWeight:"bold",paddingTop:5}}>Añadir a una Playlist</Text>
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
        
        <FlatList
        style={{ marginTop: 5,marginBottom:10,borderBottomColor:"black"}} 
        data={allPlaylists}
        renderItem={renderPlaylist}
        showsVerticalScrollIndicator={true}
        scrollsToTop={false}
        indicatorStyle={'white'}
        persistentScrollbar={true}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  </BottomSheetModal> 

      <BottomSheetModal
        ref={modalRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onDismiss={modalT}
        backdropComponent={BottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
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

          <Option icon="add-circle-outline" label="Agregar a una playlist" onPress={() => modalRefP.current?.present()} />
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
      </ScrollView> 
      <LinearGradient
                  colors={['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0.1)','rgba(0, 0, 0, 0.25)','rgba(0, 0, 0, 0.32)','rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.7)','rgba(0, 0, 0, 0.8)','rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.9)','rgba(0, 0, 0, 1)']}
                  style={{
                    position: 'absolute',
                    bottom: 50,
                    left: 0,
                    right: 0,
                    height: 150,
                    borderRadius:0
                  }}
                />    
    </SafeAreaView> 
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: '#111111',
    marginBottom:RFValue(-50)
  },

  upperContainer: {
    backgroundColor: '#111111',
  },
  box: {
   backgroundColor: '#2B2B2B',
    flexDirection: 'row',
    borderTopRightRadius:10,
    borderBottomRightRadius:10,
    alignItems:"center",
    borderTopLeftRadius:10,
    borderBottomLeftRadius:10,
    width:"98%",
    alignSelf:"center"
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333', // Color oscuro
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    borderBottomColor: '#555', // Color para separar botones
    borderBottomWidth: 1,
    flexDirection:"row",
    alignItems:"center"
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    marginLeft:5
  },
  buttonCancelar: {
    paddingVertical: 10,
    marginTop: 10,
  },
  buttonTextCancelar: {
    color: 'red', // Color para el botÃ³n de cancelar
    textAlign: 'center',
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
