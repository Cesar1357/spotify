import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';

import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { RFValue } from 'react-native-responsive-fontsize';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAds } from "@/hooks/useAds";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { collection, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, startAfter, updateDoc, where } from "firebase/firestore";
import TrackPlayer from 'react-native-track-player';

import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

function delay(n){
    return new Promise(function(resolve){
        setTimeout(resolve,n*1000);
    });
}

export default function HomeScreen() {
  const [allTransactionsP, setAllTransactionsP] = useState([]);
  const [allTransactionsN, setAllTransactionsN] = useState([]);
  const [allTransactionsL, setAllTransactionsL] = useState([]); 
  const [allTransactionsPop, setAllTransactionsPop] = useState([]);
  const [allTransactionsAmbient, setAllTransactionsAmbient] = useState([]);
  const [allTransactionsDreamcore, setAllTransactionsDreamcore] = useState([]);

  const [allTransactionsPlaylistsO, setAllTransactionsPlaylistsO] = useState([]); 
  const [allTransactionsArtistas, setAllTransactionsArtistas] = useState([])
  const [allTransactionsArtistas2, setAllTransactionsArtistas2] = useState([])
  
  const [playlists3,setPlaylists3] = useState([]);
  const [lastS3,setLastS3] = useState([]);
  const { loadAds, playAd } = useAds();

  const [iconLC, setIconLC] = useState("white"); 

  const { icon, setIcon, musica, setMusica, colorA, setColorA, setUid, currentTrack, setCurrentTrack, lastRouteRef, user, setUser } = useApp();

  var generos = [];
  const [dondeP, setDondeP] = useState();
  const [dondeN, setDondeN] = useState();
  const [dondePop, setDondePop] = useState();
  const [dondeAmbient, setDondeAmbient] = useState();
  const [dondeDreamcore, setDondeDreamcore] = useState();
  
  const [state, setState] = useState("si")
  var dimen = Dimensions.get("window")

  const [orden, setOrden] = useState(Math.floor(Math.random() * 3))

  const [isReady, setIsReady] = useState(false);
  const { uid, loading } = useAuth();
  
  useEffect(() => {
    console.log("tabs")
    lastRouteRef.current = "/(tabs)";
  },[])

  useEffect(() => { 
    setUid(uid);
    const checkInternetConnection = async () => {

      const state = await NetInfo.fetch();
        if (state.isConnected) {
          loadAds();
          getUser(); 
          getPlaylists();
          getLSongs();
          getTransactionsP();
          getTransactionsN();
          getPop();
          getAmbient();
          getDreamcore();
          getTransactionsArtistas();
          getPlaylistsOthers();
        }else{
          setState("no")
        } 
    }
    checkInternetConnection()
  }, [loading,uid]);


  const getUser =async () => {
    const docRef = doc(db, "people", uid);
    const docSnap = await getDoc(docRef);
    const info = docSnap.data()
    setUser(info)
    getTransactions(info); 
    setColorA(info.colorA)
  }

const getPlaylistsOthers = async() => { 
    const q = query(collection(db, "playlists"), orderBy('popularity', 'desc'));
    const docs = await getDocs(q);
    const canciones = docs.docs.map(doc => doc.data());
    
    var result = []
    for (let i = 0; i < canciones.length; i += 2) {
        result.push(canciones.slice(i, i + 2));
    }
    setAllTransactionsPlaylistsO(result)
  };


  const getTransactions = (info) => {
    generos = [];

    const q = query(collection(db, "people",uid,"playlists","Likes","Likes"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => doc.data());
      var ee = [];
      data.map((e)=>{
        var a = e.generos
        var a2 = ee.concat(a)
        ee = a2
      })
      ee.map((a)=>{
        var si = generos.includes(a)  
        if(si === false){
          if(a !== undefined){
            var t = generos.concat(a)
            generos = t;
          } 
        }
      })  
      getTransactionsL(data,info);
    });
}

const getTransactionsL =async (likess,info) => {
   var count;
   if(info){
     if(info.premium === true){ 
      count = 5;
    }else{
      count = 2; 
    }
   }

  var generosr = []
  var generosr2 = []
  var te = []
  generosr = generos.slice(0,10)
  generosr2 = generos.slice(10,20);

if(generosr){
  const q = query(collection(db, "musica"), where('generos','array-contains-any', generosr) );
  const querySnapshot = await getDocs(q);
  const cancionsi = querySnapshot.docs.map(doc => doc.data());
      likess.map((a)=>{
        cancionsi.map((e)=>{
            if(a.name !== e.name){
                const result = likess.find(({ name }) => name === e.name);
                if(result === undefined){
                  var si = te.find(({ name }) => name === e.name);
                  if(si === undefined){
                    if(te.length < count){
                      te.push(e)
                    }
                    
                  }          
                } 
            }
                 
        })
      })   
} 
await delay(0.4)

var t = [];
  if(generosr2){
    const q = query(collection(db, "musica"), where('generos','array-contains-any', generosr) );
    const querySnapshot = await getDocs(q);
    const cancionsi = querySnapshot.docs.map(doc => doc.data());

      likess.map((a)=>{
        cancionsi.map((e)=>{
            if(a.name !== e.name){
                const result = te.find(({ name }) => name === e.name);
                if(result === undefined){
                  const result2 = likess.find(({ name }) => name === e.name);
                  if(result2 === undefined){
                    var si = t.find(({ name }) => name === e.name);
                    if(si === undefined){
                      if(t.length < count){
                        t.push(e)
                      }
                    }  
                  }        
                } 
            }
                 
        })
      })
  }
  await delay(0.4)

  var todo = te.concat(t)
  setAllTransactionsL(todo)

  
}

  const getTransactionsP =async () => {
    const q = query(collection(db, "musica"), orderBy('popularity', 'desc'),limit(5));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    setAllTransactionsP(data);
    setDondeP(querySnapshot.docs[querySnapshot.docs.length - 1]);
}

const getMoreTransactionsP =async () => {
  if(user.premium === true){
    if(allTransactionsP.length < 14){
      const q = query(collection(db, "musica"), orderBy('popularity', 'desc'),startAfter(dondeP),limit(3));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      var todo = allTransactionsP.concat(data)
      setAllTransactionsP(todo);
      setDondeP(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
  } 
}


 const getTransactionsN = async() => {
  const q = query(collection(db, "musica"), orderBy('dateU', 'desc'),limit(5));
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(doc => doc.data());
  setAllTransactionsN(data);
  setDondeN(querySnapshot.docs[querySnapshot.docs.length - 1]);
}

const getMoreTransactionsN =async () => { 
  if(user.premium === true){
    if(allTransactionsN.length < 14){
      const q = query(collection(db, "musica"), orderBy('dateU', 'desc'),startAfter(dondeN),limit(3));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      var todo = allTransactionsN.concat(data)
      setAllTransactionsN(todo);
      setDondeN(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
  }  
}

 const getPop =async () => { 
  const q = query(collection(db, "musica"), where('generos','array-contains', "pop"),limit(5));
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(doc => doc.data());
  setAllTransactionsPop(data);
  setDondePop(querySnapshot.docs[querySnapshot.docs.length - 1]);
}

const getMorePop =async () => {  
  if(user.premium === true){
    if(allTransactionsPop.length < 14){
      const q = query(collection(db, "musica"), where('generos','array-contains', "pop"),startAfter(dondePop),limit(3));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      var todo = allTransactionsPop.concat(data)
      setAllTransactionsPop(todo);
      setDondePop(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
  }  
}

 const getAmbient =async () => { 
    const q = query(collection(db, "musica"), where('generos','array-contains', "ambient"),limit(5));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    setAllTransactionsAmbient(data);
    setDondeAmbient(querySnapshot.docs[querySnapshot.docs.length - 1]);
}

const getMoreAmbient =async () => {  
  if(user.premium === true){
    if(allTransactionsAmbient.length < 14){
      const q = query(collection(db, "musica"), where('generos','array-contains', "ambient"),startAfter(dondeAmbient),limit(3));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      var todo = allTransactionsAmbient.concat(data)
      setAllTransactionsAmbient(todo);
      setDondeAmbient(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
  }  
}

const getDreamcore =async () => { 
  const q = query(collection(db, "musica"), where('generos','array-contains', "dreamcore"),limit(5));
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(doc => doc.data());
  setAllTransactionsDreamcore(data);
  setDondeDreamcore(querySnapshot.docs[querySnapshot.docs.length - 1]);
}

const getMoreDreamcore =async () => {  
if(user.premium === true){
  if(allTransactionsDreamcore.length < 14){
    const q = query(collection(db, "musica"), where('generos','array-contains', "dreamcore"),startAfter(dondeDreamcore),limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    var todo = allTransactionsDreamcore.concat(data)
    setAllTransactionsDreamcore(todo);
    setDondeDreamcore(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }
}  
}

const getPlaylists = async() => {
    const q = query(collection(db, "people",uid,"playlists"),orderBy('importance', 'desc'),limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    setPlaylists3(data);
}

 const getLSongs = async() => {
    const q = query(collection(db, "people",uid,"playlists","Likes","Likes"),orderBy('popularity', 'desc'),limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    setLastS3(data);
  }

  const getTransactionsArtistas =async () => {
    const q = query(collection(db, "autores"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => doc.data());
    const shuffledData = data.sort(() => Math.random() - 0.5);

    setAllTransactionsArtistas(shuffledData.slice(0,shuffledData.length/2-1));
    setAllTransactionsArtistas2(shuffledData.slice(shuffledData.length/2))
}

  const updatePla = async(nameA,name) => { 
    var a = nameA+"_"+name
    console.log(name,"_",nameA)
    router.push({
      pathname: "/(screens)/Playlist",
      params: {
        qplaylist: a,
        publicaN: name,
        publica: true
      }
    })

     await delay(1) 
     const historyARef = doc(db, "playlists", a);
     await updateDoc(historyARef,{
      popularity:increment(1)
     })
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
            setMusica([name,autor,img,uri,generos,letra,"Inicio",dominant])
            await TrackPlayer.load({
                url: rutaLocal, // Load media from the network
                title: name,
                artist: autor,
                artwork: img, // Load artwork from the network
                uri: uri,
                generos: generos,
                letra: letra,
                qplaylist: "Likes",
                donde:"Inicio",
                dominantColor: dominant,
                isLocal: true
              });
            await TrackPlayer.play();
          } else {
            console.log("noex")
            try {
              setMusica([name,autor,img,uri,generos,letra,"Inicio",dominant])
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
                donde: "Inicio",
                dominantColor: dominant,
                isLocal: false
              });
              await TrackPlayer.play();    
              setIconLC("green")
            } catch (error) {
              ToastAndroid.showWithGravity(
                "Error al reproducir la canción",
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
              );
            }
          }
        } catch (error) {
          console.error('Error al verificar el archivo:', error);
        }
      }
    };

  const renderItemPlaylist = ({ item, i }) => {
  return(
  <TouchableOpacity style={{flexDirection:"row",borderRadius:10,backgroundColor:"#252525",width:dimen.width/3.2,height:45,marginLeft:5,alignItems:"center"}} onPress={() => router.push({
              pathname: "/(screens)/Playlist",
              params: {
                qplaylist: item.name,
              }
            })}> 
          <Image
            source={{ uri: item.uri }} 
            contentFit='cover'
            style={{ 
              width: 40,
              height: 40,
              marginLeft:5, 
            }}></Image>
            <Text
            numberOfLines={1}
              style={{
                fontSize: 18,
                color: "white",
                fontWeight: 'bold',
                marginLeft:3,
                maxWidth:"50%"
              }}
              >
              {item.name}
            </Text>
      </TouchableOpacity>
  );
}

const renderItemLS = ({ item, i }) => { 
  var color = "white";
    if(currentTrack?.title === item.name){
      color = "green"
    }else{
      color = "white"
    }
  return(
  <TouchableOpacity style={{flexDirection:"column",borderRadius:10,backgroundColor:"#252525",width:dimen.width/3.2,height:dimen.width/2.7,marginLeft:5,alignItems:"center"}} onPress={() => change(item.uri, item.name, item.autor,item.img,item.generos,item.letra,item.dominantColor)}> 
          <Image
            source={{ uri: item.img }} 
            contentFit='cover'
            style={{ 
              width: "100%",
              height: dimen.width/3.4,
              borderTopLeftRadius:10,
              borderTopRightRadius:10,
              position:"absolute"
            }}></Image>
            <Text
            numberOfLines={1}
              style={{
                fontSize: 15,
                color: color,
                fontWeight: 'bold',
                alignSelf:"center",
                marginTop:"98%"
              }}
              >
              {item.name}
            </Text>
      </TouchableOpacity>
  );
}

const renderItemPlayO = ({ item, i }) => { 
  return(
  <TouchableOpacity style={{flexDirection:"row",borderRadius:10,backgroundColor:"#252525",height:50,marginLeft:5,width:150,marginBottom:5}} onPress={() => updatePla(item.by,item.nameP)}>
          <Image
            source={{ uri: "https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png"  }} 
            contentFit='cover'
            style={{ 
              width: 40,
              height: 40,
              marginLeft:5, 
              marginTop:5,
            }}></Image>

            <View style={{flexDirection:"column",alignSelf:"flex-start",marginRight:10}}>
              <Text
              numberOfLines={1}
                style={{
                  fontSize: 18,
                  color: "white",
                  fontWeight: 'bold',
                  marginLeft:5,
                  marginTop:5, 
                  textAlign:"left"
                }}
                >
                {item.nameP}
              </Text>
              <Text
              numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: "gray",
                  fontWeight: 'bold',
                  marginLeft:5,
                  marginTop:-2, 
                  textAlign:"left"
                }}
                >
                {item.byN}
              </Text>
            </View>
      </TouchableOpacity>
  );
}

const renderItemArtistas = ({ item, i }) => { 
  return(
    <TouchableOpacity onPress={() => {
      router.push({
        pathname: "/(screens)/Autor",
        params: {
          nameA: item.name,
        }
      });
    }} 
    style={{flexDirection:"row",borderRadius:10,backgroundColor:"#252525",height:50,marginLeft:5,width:150,marginHorizontal:10,alignItems:"center"}}>
    <Image
            source={{ uri: item.uri  }} 
            contentFit='cover'
            style={{ 
              width: 40,
              height: 40,
              borderRadius:10,
              justifyContent:"flex-start",
              margin:5
            }}></Image>
              <Text
              numberOfLines={1}
                style={{
                  fontSize: 16,
                  color: "white",
                  fontWeight: 'bold',
                  marginLeft:5,
                  textAlign:"center",
                  width:90
                }}
                >
                {item.name}
              </Text>
      </TouchableOpacity>
  );
}

  const renderItem = ({ item, i }) => {
    var color = "white";
    if(currentTrack?.title === item.name){
      color = "green"
    }

    
    return (
      <TouchableOpacity style={{padding:5}} onPress={() => change(item.uri, item.name, item.autor,item.img,item.generos,item.letra,item.dominantColor)}> 
        <View style={styles.box}>
          <Image
            source={{ uri: `${item.img}` }}
            contentFit='cover'
            style={{
              width: RFValue(120),
              height: RFValue(120),
              borderRadius: 0,
              marginLeft: 5,
            }}></Image>
          <View style={{ marginLeft: 5, width:RFValue(120)}}>
            <Text
              style={{
                fontSize: 15,
                color: color,
                fontWeight: 'bold',
                marginTop: 9,
              }}
              adjustsFontSizeToFit={false} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{flexDirection:"column"}}>
              <Text
                style={{
                  fontSize: 13,
                  color: '#969696',
                  marginTop: 2,
                  marginLeft: 2,
                }}
                adjustsFontSizeToFit={false} numberOfLines={2}>
                {item.tipo} · {item.autor}
              </Text> 
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


 const Playlist3 = ()=> {
    return(
      <View style={{backgroundColor:"#111111"}}>
      <FlatList
        style={{ marginTop: 0, marginLeft:3,backgroundColor:"#111111"}}  
        data={playlists3}
        renderItem={renderItemPlaylist}
        onEndReached={() =>getMoreTransactionsP()}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        scrollsToTop={false}
        indicatorStyle={'white'}
        persistentScrollbar={true}
        horizontal={true}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={{height:7,backgroundColor:"#111111"}}>
      </View>
      </View>
    )
  }

  const LSongs3 = () => {
    if(lastS3.length >= 3){
    return(
      <View style={{}}>
      <FlatList
        style={{ marginTop: 8,marginLeft:3}} 
        data={lastS3}
        renderItem={renderItemLS}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        scrollsToTop={false}
        indicatorStyle={'white'}
        persistentScrollbar={true}
        horizontal={true}
        keyExtractor={(item, index) => index.toString()}
      />
      </View>
    )
    }else{
      return null
    }
  }

  const LoMasPopular = ()=> {
    if(allTransactionsP.length !== 0){
      return(
        <View >
        <Text style={{color:"white", fontSize:25, fontWeight:"900", marginTop:20,marginLeft:10}}>Lo más popular</Text>
        <FlatList
          style={{ marginTop: 10}} 
          data={allTransactionsP}
          renderItem={renderItem}
          onEndReached={() =>getMoreTransactionsP()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          horizontal={true}
          keyExtractor={(item, index) => index.toString()}
        />
        </View>
      )
    } 
  }

  const LoMasNuevo = ()=> {
    if(allTransactionsN.length !== 0){
      return(
        <View>
        <Text style={{color:"white", fontSize:25, fontWeight:"900", marginTop:20,marginLeft:10}}>Lo más nuevo</Text>
        <FlatList
          style={{ marginTop: 10}} 
          data={allTransactionsN}
          renderItem={renderItem}
          onEndReached={() =>getMoreTransactionsN()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          horizontal={true}
          keyExtractor={(item, index) => index.toString()}
        />
        </View>
      )
    }
  }

  const LoQueTeGusta = ()=> {
    if(allTransactionsL.length !== 0){ 
      return(
        <View>
        <Text style={{color:"white", fontSize:25, fontWeight:"900", marginTop:20,marginLeft:10}}>De tus géneros</Text>
        <FlatList
          style={{ marginTop: 10}} 
          data={allTransactionsL}
          renderItem={renderItem}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          horizontal={true}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
                <Text style={{ fontSize: 12, color: 'white',alignSelf:"center",fontWeight:"bold",marginLeft:15 }}>
                  Sin datos por el momento
                </Text>
            }
        />
        </View>
      )
    }
  }



  const Playlists = ()=> {
    if(allTransactionsPlaylistsO.length !== 0){ 
      return(
        <View>
        <Text style={{color:"white", fontSize:25, fontWeight:"900", marginTop:20,marginLeft:10}}>Playlists</Text>
        <FlatList
        horizontal={true}
          style={{ marginTop: 10}} 
          data={allTransactionsPlaylistsO}
          renderItem={({ item }) => (
          <View style={{ flexDirection: 'column' }}>
            {item.map((playlist) => renderItemPlayO({item: playlist}))}  
          </View>
        )}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          
          keyExtractor={(item, index) => index.toString()}
        />
        </View>
      )
    }
  }

  const Artistas = () => {
      if (allTransactionsArtistas.length !== 0) {
        return (
          <View>
            <Text style={{ color: "white", fontSize: 25, fontWeight: "900", marginTop: 20, marginLeft: 10 }}>
              Artistas
            </Text>
            <FlatList
              horizontal
              style={{ marginTop: 10 }}
              data={allTransactionsArtistas} 
              renderItem={renderItemArtistas}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
            />
            <FlatList
              horizontal
              style={{ marginTop: 10 }}
              data={allTransactionsArtistas2} 
              renderItem={renderItemArtistas}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        );
      }
  };
 

  const Gpop = ()=> {
    if(allTransactionsPop.length !== 0){
      return(
        <View>
        <Text style={{color:"white", fontSize:25, fontWeight:"900", marginTop:20,marginLeft:10}}>Pop</Text>
        <FlatList
          style={{ marginTop: 10}} 
          data={allTransactionsPop}
          renderItem={renderItem}
          onEndReached={() =>getMorePop()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          horizontal={true}
          keyExtractor={(item, index) => index.toString()}
        />
        </View>
      )
    }
  }

  const Gambient = ()=> {
    if(allTransactionsAmbient.length !== 0){
      return(
        <View>
        <Text style={{color:"white", fontSize:25, fontWeight:"bold", marginTop:20,marginLeft:10}}>Relajante</Text>
        <FlatList
          style={{ marginTop: 10}} 
          data={allTransactionsAmbient}
          renderItem={renderItem}
          onEndReached={() =>getMoreAmbient()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          horizontal={true}
          keyExtractor={(item, index) => index.toString()}
        />
        </View>
      )
    }
  }

  const Gdreamcore = ()=> {
    if(allTransactionsDreamcore.length !== 0){
      return(
        <View>
        <Text style={{color:"white", fontSize:25, fontWeight:"bold", marginTop:20,marginLeft:10}}>Dreamcore</Text>
        <FlatList
          style={{ marginTop: 10}} 
          data={allTransactionsDreamcore}
          renderItem={renderItem}
          onEndReached={() =>getMoreDreamcore()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          scrollsToTop={false}
          indicatorStyle={'white'}
          persistentScrollbar={true}
          horizontal={true}
          keyExtractor={(item, index) => index.toString()}
        />
        </View>
      )
    }
  }

  const Main = () => {
    
    if(allTransactionsN.length === 0 && state === "si" ){ 
      return(
        <View style={{marginTop:dimen.height/2.5}}>
          <ActivityIndicator size="large" color="green" />
        </View>
      )
    }
    if(state === "no"){ 
      return(
        <View style={{marginTop:dimen.height/4}}>
          <Text
              style={{
                fontSize: 15,
                color: "white",
                fontWeight: 'bold',
                alignSelf:"center"
              }}
              >
              Sin conexión a internet :c
            </Text>
        </View>
      )
    }
  }

  const juntos = () => {
    
    const componentsList = [Playlists, Gpop, Gambient, Artistas, Gdreamcore];
    const shuffled = [...componentsList].sort(() => Math.random() - 0.5);
    
    if (orden === 0) {
      return (
        <>
          {Playlists()}
          {Gpop()}
          {Gambient()}
          {Artistas()}
          {Gdreamcore()}
        </>
      );
    } else if (orden === 1) {
      return (
        <>
          {Gdreamcore()}
          {Playlists()}
          {Gpop()}
          {Artistas()}
          {Gambient()}
          
        </>
      );
    } else {
      return (
        <>
          {Artistas()}
          {Gpop()}
          {Gambient()}
          {Gdreamcore()}
          {Playlists()}
        </>
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>  
      <ScrollView style={{}} stickyHeaderIndices={[1]}>   
        <View style={{backgroundColor: '#111111',flexDirection:"row",alignItems:"center",alignContent:"center",marginTop:30,marginBottom:40,justifyContent:"space-between"}}> 
          <Text
              style={{
                fontSize: 27,
                marginLeft: 5,
                height:40,
                color: 'white',
                fontWeight: '800',
              }}>
              Inicio
          </Text>
          <View style={{flexDirection:"row",marginRight:10,justifyContent:"center",alignItems:"center"}}>
            <TouchableOpacity onPress={() => {router.push("/(screens)/History")}} style={{}}>
              <Icon type={'material'} name={'history'} color={'white'} size={RFValue(30)}/>
            </TouchableOpacity> 
            <TouchableOpacity onPress={() => {router.push("/(screens)/Settings")}} style={{marginLeft:5}}>
                <Icon type={'ionicon'} name={'settings-outline'} color={'white'} size={RFValue(27)}/>
            </TouchableOpacity>  
        </View>   
      </View>
        {Playlist3()}
        {LSongs3()}  
        {Main()} 
        {LoMasPopular()}   
        {LoMasNuevo()} 
        {LoQueTeGusta()}
        {juntos()}
        <View>  
          <Text style={{height:RFValue(200)}}></Text>    
        </View>  
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

  box: {
    backgroundColor: '#111111',
    flexDirection: 'column',
  },
});
