import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useHomeFeed } from '@/hooks/useHomeFeed';
import TrackPlayer from 'react-native-track-player';

import { useApp } from '../../context/AppContext';

export default function HomeScreen() {
  const [allTransactionsP, setAllTransactionsP] = useState<any[]>([]);
  const [allTransactionsN, setAllTransactionsN] = useState<any[]>([]);
  const [allTransactionsL, setAllTransactionsL] = useState<any[]>([]); 
  const [allTransactionsPop, setAllTransactionsPop] = useState<any[]>([]);
  const [allTransactionsAmbient, setAllTransactionsAmbient] = useState<any[]>([]);
  const [allTransactionsDreamcore, setAllTransactionsDreamcore] = useState<any[]>([]);

  const [allTransactionsPlaylistsO, setAllTransactionsPlaylistsO] = useState<any[]>([]); 
  const [allTransactionsArtistas, setAllTransactionsArtistas] = useState<any[]>([])
  const [allTransactionsArtistas2, setAllTransactionsArtistas2] = useState<any[]>([])
  
  const [playlists3,setPlaylists3] = useState<any[]>([]);
  const [lastS3,setLastS3] = useState<any[]>([]);
  const { loadAds, playAd } = useAds();

  const [iconLC, setIconLC] = useState("white"); 

  const { icon, setIcon, musica, setMusica, colorA, setColorA, setUid, currentTrack, setCurrentTrack, lastRouteRef, user, setUser } = useApp();
  const [dondeP, setDondeP] = useState<any | null>(null);
  const [dondeN, setDondeN] = useState<any | null>(null);
  const [dondePop, setDondePop] = useState<any | null>(null);
  const [dondeAmbient, setDondeAmbient] = useState<any | null>(null);
  const [dondeDreamcore, setDondeDreamcore] = useState<any | null>(null);
  
  const [state, setState] = useState("si")
  var dimen = Dimensions.get("window")

  const [orden, setOrden] = useState(Math.floor(Math.random() * 3))

  const [isReady, setIsReady] = useState(false);
  const { uid, loading } = useAuth();
  const adsLoadedRef = useRef(false);

  const homeFeedSetters = useMemo(
    () => ({
      setUser,
      setColorA,
      setAllTransactionsP,
      setAllTransactionsN,
      setAllTransactionsL,
      setAllTransactionsPop,
      setAllTransactionsAmbient,
      setAllTransactionsDreamcore,
      setAllTransactionsPlaylistsO,
      setPlaylists3,
      setLastS3,
      setAllTransactionsArtistas,
      setAllTransactionsArtistas2,
      setDondeP,
      setDondeN,
      setDondePop,
      setDondeAmbient,
      setDondeDreamcore,
    }),
    [
      setUser,
      setColorA,
      setAllTransactionsP,
      setAllTransactionsN,
      setAllTransactionsL,
      setAllTransactionsPop,
      setAllTransactionsAmbient,
      setAllTransactionsDreamcore,
      setAllTransactionsPlaylistsO,
      setPlaylists3,
      setLastS3,
      setAllTransactionsArtistas,
      setAllTransactionsArtistas2,
      setDondeP,
      setDondeN,
      setDondePop,
      setDondeAmbient,
      setDondeDreamcore,
    ],
  );

  const homeFeed = useHomeFeed(uid, homeFeedSetters);

  const {
    fetchUser,
    refreshFeed,
    fetchMoreTransactionsP,
    fetchMoreTransactionsN,
    fetchMoreGenreSection,
    updatePlaylistPopularity,
  } = homeFeed;
  
  useEffect(() => {
    console.log("tabs")
    lastRouteRef.current = "/(tabs)";
  },[])

  useEffect(() => { 
    setUid(uid);
    const checkInternetConnection = async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        if (!adsLoadedRef.current) {
          await loadAds();
          adsLoadedRef.current = true;
        }
        fetchUser();
        refreshFeed();
      } else {
        setState("no")
      }
    }
    if (!loading) {
      checkInternetConnection();
    }
  }, [loading, uid, loadAds, fetchUser, refreshFeed]);


  const updatePla = async(nameA: string, name: string) => { 
    const a = `${nameA}_${name}`;
    router.push({
      pathname: "/(screens)/Playlist",
      params: {
        qplaylist: a,
        publicaN: name,
        publica: 'true'
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await homeFeed.updatePlaylistPopularity(nameA, name);
  }



  const change = async (uri: any, name: string, autor: string, img: string, generos: any, letra: any, dominant: any) => {  
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

  
  /* Memoized item components to reduce re-renders and improve performance */
  const PlaylistCard = React.memo(({ item }: { item: any }) => {
    const artwork = item.uri || item.img || 'https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png';
    return (
      <TouchableOpacity style={{flexDirection:"row",borderRadius:10,backgroundColor:"#252525",width:dimen.width/3.2,height:45,marginLeft:5,alignItems:"center"}} onPress={() => router.push({ pathname: "./../(screens)/Playlist", params: { qplaylist: item.name } })}>
        <Image source={{ uri: artwork }} cachePolicy='memory-disk' contentFit='cover' style={{ width: 40, height: 40, marginLeft:5 }} />
        <Text numberOfLines={1} style={{ fontSize: 18, color: "white", fontWeight: 'bold', marginLeft:3, maxWidth:"50%" }}>{item.name}</Text>
      </TouchableOpacity>
    );
  });

  const SongCard = React.memo(({ item }: { item: any }) => {
    const color = currentTrack?.title === item.name ? 'green' : 'white';
    const artwork = item.img || item.artwork || item.cover || item.uri || 'https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png';
    return (
      <TouchableOpacity style={{padding:5}} onPress={() => change(item.uri, item.name, item.autor, item.img, item.generos, item.letra, item.dominantColor)}>
        <View style={styles.box}>
          <Image source={{ uri: artwork }} cachePolicy='memory-disk' contentFit='cover' style={{ width: RFValue(120), height: RFValue(120), borderRadius: 0, marginLeft: 5 }} />
          <View style={{ marginLeft: 5, width:RFValue(120)}}>
            <Text style={{ fontSize: 15, color, fontWeight: 'bold', marginTop: 9 }} adjustsFontSizeToFit={false} numberOfLines={1}>{item.name}</Text>
            <View style={{flexDirection:"column"}}>
              <Text style={{ fontSize: 13, color: '#969696', marginTop: 2, marginLeft: 2 }} adjustsFontSizeToFit={false} numberOfLines={2}>{item.tipo} · {item.autor}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const SongCardMain = React.memo(({ item }: { item: any }) => {
    const color = currentTrack?.title === item.name ? 'green' : 'white';
    const artwork = item.img || item.artwork || item.cover || item.uri || 'https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png';
    return(
    <TouchableOpacity style={{flexDirection:"column",borderRadius:10,backgroundColor:"#252525",width:dimen.width/3.2,height:dimen.width/2.7,marginLeft:5,alignItems:"center"}} onPress={() => change(item.uri, item.name, item.autor,item.img,item.generos,item.letra,item.dominantColor)}> 
      <Image source={{ uri: artwork }} cachePolicy='memory-disk' contentFit='cover' style={{ width: "100%",
        height: dimen.width/3.4,
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
        position:"absolute" }} />
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
  });


  const PlaylistOCard = React.memo(({ item }: { item: any }) => {
    return (
      <TouchableOpacity style={{flexDirection:"row",borderRadius:10,backgroundColor:"#252525",height:50,marginLeft:5,width:150,marginBottom:5}} onPress={() => updatePla(item.by,item.nameP)}>
        <Image source={{ uri: "https://images.squarespace-cdn.com/content/v1/587d4a02bebafb893ba07d90/1484886557050-V261JTTHHGX0O3KHW5OX/ui-ux-playlist-gen-icon.png"  }} contentFit='cover' style={{ width: 40, height: 40, marginLeft:5, marginTop:5 }} />
        <View style={{flexDirection:"column",alignSelf:"flex-start",marginRight:10}}>
          <Text numberOfLines={1} style={{ fontSize: 18, color: "white", fontWeight: 'bold', marginLeft:5, marginTop:5, textAlign:"left" }}>{item.nameP}</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: "gray", fontWeight: 'bold', marginLeft:5, marginTop:-2, textAlign:"left" }}>{item.byN}</Text>
        </View>
      </TouchableOpacity>
    );
  });

  const ArtistCard = React.memo(({ item }: { item: any }) => {
    return (
      <TouchableOpacity onPress={() => { router.push({ pathname: "/(screens)/Autor", params: { nameA: item.name } }); }} style={{flexDirection:"row",borderRadius:10,backgroundColor:"#252525",height:50,marginLeft:5,width:150,marginHorizontal:10,alignItems:"center"}}>
        <Image source={{ uri: item.uri }} contentFit='cover' style={{ width: 40, height: 40, borderRadius:10, justifyContent:"flex-start", margin:5 }} />
        <Text numberOfLines={1} style={{ fontSize: 16, color: "white", fontWeight: 'bold', marginLeft:5, textAlign:"center", width:90 }}>{item.name}</Text>
      </TouchableOpacity>
    );
  });

  // Stable render callbacks
  const renderItemPlaylist = useCallback(({ item }: { item: any }) => <PlaylistCard item={item} />, [router]);
  const renderItemLS = useCallback(({ item }: { item: any }) => <SongCardMain item={item} />, [currentTrack]);
  const renderItemPlayO = useCallback(({ item }: { item: any }) => <PlaylistOCard item={item} />, [updatePla]);
  const renderItemArtistas = useCallback(({ item }: { item: any }) => <ArtistCard item={item} />, [router]);
  const renderItem = useCallback(({ item }: { item: any }) => <SongCard item={item} />, [currentTrack]);


 const Playlist3 = ()=> {
    return(
      <View style={{backgroundColor:"#111111"}}>
      <FlatList
        style={{ marginTop: 0, marginLeft:3,backgroundColor:"#111111"}}  
        data={playlists3}
        renderItem={renderItemPlaylist}
        onEndReached={() => fetchMoreTransactionsP(user, allTransactionsP, dondeP)}
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
          onEndReached={() => fetchMoreTransactionsP(user, allTransactionsP, dondeP)}
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
          onEndReached={() => fetchMoreTransactionsN(user, allTransactionsN, dondeN)}
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
            {item.map((playlist: any) => renderItemPlayO({item: playlist}))}  
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
          onEndReached={() => fetchMoreGenreSection(user, allTransactionsPop, dondePop, 'pop', setAllTransactionsPop, setDondePop)}
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
          onEndReached={() => fetchMoreGenreSection(user, allTransactionsAmbient, dondeAmbient, 'ambient', setAllTransactionsAmbient, setDondeAmbient)}
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
          onEndReached={() => fetchMoreGenreSection(user, allTransactionsDreamcore, dondeDreamcore, 'dreamcore', setAllTransactionsDreamcore, setDondeDreamcore)}
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
