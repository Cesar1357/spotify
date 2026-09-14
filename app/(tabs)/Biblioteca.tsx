import NetInfo from '@react-native-community/netinfo';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet/src';
import { router } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from '../../config/firebase';

export default function Biblioteca() {
    const [user, setUser] = useState<any>(null);
    const [lists, setLists] = useState<any[]>([{name:"Descargas"}]);
    const [visible, setVisible] = useState(false);
    const [visible2, setVisible2] = useState(false);
    const [NA,setNA] = useState("");
    const [PE,setPE] = useState<boolean>(false);
    const [internet, setInternet] = useState(true)
    const [Nnombre, setNnombre] = useState("");
    const { uid, loading, displayname } = useAuth();

    const modalRef = useRef<BottomSheetModal>(null);
    const modalRef2 = useRef<BottomSheetModal>(null);
    const createPlaylistInputRef = useRef<any>(null);
    const snapPoints = useMemo(() => ['45%', '85%'], []);
    const snapPoints2 = useMemo(() => ['55%', '55%'], []);


  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkInternetConnection = async () => {
      if (!uid) return;
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        unsubscribe = getTransactions();
        getUser();
      } else {
        setInternet(false);
      }
    }

    checkInternetConnection();

    return () => {
      unsubscribe?.();
    };
  }, [uid]);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      if (visible) modalRef.current?.snapToIndex(1);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      if (visible) modalRef.current?.snapToIndex(0);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible2) {
        setVisible2(false);
        modalRef2.current?.dismiss();
        return true;
      }
      if (visible) {
        setVisible(false);
        Keyboard.dismiss();
        modalRef.current?.dismiss();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, visible2]);

  const closeLibraryModals = () => {
    setVisible(false);
    setVisible2(false);
    Keyboard.dismiss();
    modalRef.current?.dismiss();
    modalRef2.current?.dismiss();
  };

const getUser = async() => {
    if (!uid) return;
    const docRef = doc(db, "people", uid);
    const docSnap = await getDoc(docRef);
    setUser(docSnap.data());
  }
  
  const getTransactions = () => {
    if (!uid) return undefined;
    const q = query(collection(db, "people", uid, "playlists"), orderBy('importance', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => doc.data());
      setLists([{ name: "Descargas" }, ...data]);
    });
}


    const renderItem = ({ item }: { item: any }) => {
        if(item.name === "Descargas"){
        return(
            <TouchableOpacity style={styles.container2} onPress={() => {
              router.push({
                pathname: "/(screens)/Playlist",
                params: { qplaylist: "Descargas" },
              });
              closeLibraryModals();
            }}>
            <View style={styles.box}>
                <View style={{flexDirection:"row",justifyContent:"center",alignItems:"center"}}>
                  <View style={{paddingLeft:5,paddingRight:7}}>
                    <Icon type={'ionicon'} name={"cloud-circle-outline"} color={"green"} size={55} />
                  </View>
                  <Text style={styles.text}>
                      {item.name}
                  </Text>
                </View>
            </View>
            </TouchableOpacity>
        );
        }else{
        return(
            <TouchableOpacity style={styles.container2} onPress={() => {
              router.push({
                pathname: "/(screens)/Playlist",
                params: { qplaylist: item.name },
              });
              closeLibraryModals();
            }}>
            <View style={styles.box}>
                <View style={{flexDirection:"row",justifyContent:"center",alignItems:"center",paddingLeft:10}}>
                <View style={styles.circularImageContainer}>
                    <Image
                    source={{ uri: item.uri }}
                    style={styles.circularImage}
                    />
                </View>
                <Text style={styles.text}>
                    {item.name}
                </Text>
                </View>
                <TouchableOpacity style={{marginRight:30}} onPress={() => toggleOverlay2(item.name, item.estado)}> 
                <Icon type={'ionicon'} name={'ellipsis-vertical'} color={'white'} size={25} />
                </TouchableOpacity>
            </View>
            </TouchableOpacity>
        );
        }
    }

const toggleOverlay = async (v = false) => {
    const openCreatePlaylist = () => {
      setVisible(true);
      modalRef.current?.present();
      setTimeout(() => {
        modalRef.current?.snapToIndex(1);
        createPlaylistInputRef.current?.focus();
      }, 250);
    };

    if(visible === false && !v){
      if(user?.premium === true){
        openCreatePlaylist();
      }else{
        if(lists.length === 3){
          Alert.alert("Ya superaste el máximo de playlists gratuitas")
        }else{
          openCreatePlaylist();
        }
      }

    }else{
      setVisible(false);
      modalRef.current?.close();
    }
    
  };
  const toggleOverlay2 = (name = '', estado = false, v = false) => {
    if(visible2 === false && !v){
      setNA(name)
      setPE(estado)
      setVisible2(true);
      modalRef2.current?.present()
    }else{
      setVisible2(false);
      modalRef2.current?.close()
    }
    
  };

const createPlay = () => {
  const playlistName = Nnombre.trim();
  if(playlistName.length !== 0 && playlistName !== "Descargas"){
    const nombres: string[] = [];
    lists.map((a)=>{
      nombres.push(a.name.toLowerCase())
    })
    if(!nombres.includes(playlistName.toLowerCase())){
      const gamesCollection = doc(db, "people", uid,"playlists",playlistName);
      setDoc(gamesCollection,{
        name: playlistName,
        uri:"https://firebasestorage.googleapis.com/v0/b/spotify-20a57.appspot.com/o/music%2Fimage%20(1).png?alt=media&token=ff5ca481-48cf-4433-a0c9-e8f7ff855c16",
        importance:0,
        estado:false
      }).then((a)=>{
        setVisible(false);
        setNnombre("");
        modalRef.current?.close();
        ToastAndroid.showWithGravity(
          `Playlist creada correctamente`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      }).catch((e)=>{
        alert(e)
      })
    }else{
      Alert.alert("Esta ya existe")
    }
  }
  
}

const delet = async() => {
  if(NA !== "Likes"){
    const q = query(collection(db, "people",uid,"playlists",NA,"Likes"));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    await Promise.all(data.map((playlistSong) =>
      deleteDoc(doc(db, "people", uid, "playlists", NA, "Likes", playlistSong.name))
    ));
    
    const playlistRef = doc(db, "people",uid,"playlists",NA);
    await deleteDoc(playlistRef)

        
        if(PE === true){
         const n = uid+"_"+NA
         const q = query(collection(db, "playlists",n,NA));
          const docs = await getDocs(q);
          const data = docs.docs.map(doc => doc.data());
          await Promise.all(data.map((playlistSong) =>
            deleteDoc(doc(db, "playlists", n, NA, playlistSong.name))
          ));
          const publicPlaylistRef = doc(db, "playlists",n);
          await deleteDoc(publicPlaylistRef)

          const q3 = doc(db, "people",uid,"playlists",NA);
          await updateDoc(q3,{
            estado:false
          }).then(() => {
            console.log('Actualización exitosa');
          })
          .catch((error) => {
            console.error('Error al actualizar:', error);
          });
        } 
        ToastAndroid.showWithGravity(
          `Playlist ${NA} borrada correctamente`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
        setVisible2(false);
        modalRef2.current?.close();  
      
  }else{
    Alert.alert("No se puede borrar esto :c")
  }
  
}

const actualizar = async(name: string) =>{
  const n = uid+"_"+name 

   const q = query(collection(db, "people",uid,"playlists",name,"Likes"),orderBy("dateU", 'desc'));
    const docs = await getDocs(q);
    const a = docs.docs.map(doc => doc.data());

    const batch = writeBatch(db);

            // Itera sobre la lista de documentos
            a.forEach((documentData) => {
              const namec = documentData.name;
              // Añade documentos al lote
              const documentRef = doc(db, 'playlists', n, name, namec);
              batch.set(documentRef, documentData, { merge: true });
            });

            // Escribe el lote
            await batch.commit();

            console.log('Documentos escritos exitosamente');

          ToastAndroid.showWithGravity(
          `Se actualizó correctamente`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
          setVisible2(false)
}

const toglePublish = async(name: string) => { 
  if(PE === false){
    const q = query(collection(db, "people",uid,"playlists",name,"Likes"),orderBy("dateU", 'desc'));
    const docs = await getDocs(q);
    const a = docs.docs.map(doc => doc.data());

      const n = uid+"_"+name 
      const gamesCollection = doc(db, "playlists", n);
      setDoc(gamesCollection, {
        by:uid,
        byN:displayname, 
        tipo:"Playlist", 
        popularity:0, 
        dateU:Timestamp.now().toDate(), 
        nameP:name
      })

      const q3 = doc(db, "people",uid,"playlists",NA);
      await updateDoc(q3,{
        estado:true
      }).then(() => {
        console.log('Actualización exitosa');
      })
      .catch((error) => {
        console.error('Error al actualizar:', error);
      });


      const batch = writeBatch(db);

      // Itera sobre la lista de documentos
      a.forEach((documentData) => {
        const namec = documentData.name;
        // Añade documentos al lote
        const documentRef = doc(db, 'playlists', n, name, namec);
        batch.set(documentRef, documentData, { merge: true });
      });

      // Escribe el lote
      await batch.commit();

      console.log('Documentos escritos exitosamente');
      ToastAndroid.showWithGravity(
      `Playlist ${name} publicada correctamente`,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
    );  
  }else{

    const n = uid+"_"+name 
    const q = query(collection(db, "playlists",n,name));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    await Promise.all(data.map((playlistSong) =>
      deleteDoc(doc(db, "playlists", n, name, playlistSong.name))
    ));

    const ref = doc(db, "playlists", n);
    deleteDoc(ref)
    
    const q3 = doc(db, "people",uid,"playlists",NA);
      await updateDoc(q3,{
        estado:false
      }).then(() => {
        console.log('Actualización exitosa');
      })
      .catch((error) => {
        console.error('Error al actualizar:', error);
      });

      ToastAndroid.showWithGravity(
          `Playlist ${name} ocultada correctamente`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
  }
  
}


  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.upperContainer}>
          <Text
            style={{
              fontSize: 27,
              marginLeft: 5,
              color: 'white',
              fontWeight: 'bold',
            }}>
            Biblioteca
          </Text>
          <TouchableOpacity style={{paddingRight:5}} onPress={(()=>toggleOverlay())}>
              <Icon type={'ionicon'} name={'add-outline'} color={'white'} size={40} />
          </TouchableOpacity>
        </View>
        <FlatList
          style={{ marginTop: 30, maxHeight:"75%"}}  
          data={lists}
          renderItem={renderItem}
          showsVerticalScrollIndicator={true}
          scrollsToTop={false}
          indicatorStyle={"white"}
          persistentScrollbar={true}
          keyExtractor={(item, index) => index.toString()}
        />

        <BottomSheetModal
          ref={modalRef}
          index={1}
          snapPoints={['45%', '75%']}
          enableDynamicSizing={false}
          keyboardBehavior='interactive'
          keyboardBlurBehavior='restore'
          android_keyboardInputMode='adjustResize'
          backdropComponent={BottomSheetBackdrop}
          onDismiss={()=>toggleOverlay(true)}
          backgroundStyle={{ backgroundColor: '#111' }}
          handleIndicatorStyle={{ backgroundColor: 'gray' }}
          stackBehavior='replace'
        >
          <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetEyebrow}>BIBLIOTECA</Text>
            <Text style={styles.sheetTitle}>Crear nueva playlist</Text>
            <Text style={styles.sheetHint}>Organiza tus canciones como quieras.</Text>
            <BottomSheetTextInput
              ref={createPlaylistInputRef}
              style={{
                backgroundColor: 'white',
                fontWeight: 'bold',
                borderColor: 'white',
                color: '#666664',
                minWidth: 150,
                alignSelf: 'center',
                borderRadius: 5,
                height: 45,
                marginTop: 25,
                fontSize:15,
                textAlign:"center",
                paddingLeft:10,
                paddingRight:10
              }}
              onChangeText={(text) => setNnombre(text)}
              placeholder={'¿Nombre?'}
              maxLength={20}
              placeholderTextColor="#666664"
              keyboardAppearance={"dark"}
              keyboardType={"web-search"}
            />
          <TouchableOpacity style={styles.primaryButton} onPress={(()=> createPlay())}>
            <Text style={styles.primaryButtonText}>Crear playlist</Text> 
          </TouchableOpacity>
          </BottomSheetScrollView>
      </BottomSheetModal>

      <BottomSheetModal
          ref={modalRef2}
          index={1}
          snapPoints={snapPoints2}
          enableDynamicSizing={false}
          keyboardBehavior='interactive'
          keyboardBlurBehavior='restore'
          android_keyboardInputMode='adjustResize'
          backdropComponent={BottomSheetBackdrop}
          onDismiss={()=>toggleOverlay2('', false, true)}
          backgroundStyle={{ backgroundColor: '#111' }}
          handleIndicatorStyle={{ backgroundColor: 'gray' }}
          stackBehavior='replace'
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection:"column" }}>
           <Text style={styles.sheetEyebrow}>GESTIONAR PLAYLIST</Text>
           <Text style={styles.sheetTitle}>Administrar playlist</Text>
           <Text style={styles.sheetHint}>{NA}</Text>
            <TouchableOpacity style={{alignSelf:"center",marginTop:20,borderRadius:100,borderWidth:1,borderColor:"white",width:40,height:40,marginBottom:10}}  onPress={(()=>Alert.alert("Eliminar","¿Seguro?", [
          {
            text: 'Si',
            onPress: () => delet(),
          },{
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          }],{cancelable: true}))}>  
                  <Icon type={'ionicon'} name={'trash'} color={'red'} size={25} style={{alignSelf:"center",marginTop:5}}/>
            </TouchableOpacity>

            {PE? <TouchableOpacity style={styles.secondaryButton} onPress={()=>actualizar(NA)}>
              <Text style={{fontSize:17,fontWeight:"bold",color:"black"}}>Actualizar</Text> 
            </TouchableOpacity>
            : null}

            <TouchableOpacity style={styles.secondaryButton} onPress={()=>toglePublish(NA)}>
            {PE? <Text style={{fontSize:17,fontWeight:"bold",color:"black"}}>Ocultar</Text> : <Text style={{fontSize:17,fontWeight:"bold",color:"black"}}>Publicar</Text>   }
            
            </TouchableOpacity>
        </View>
      </BottomSheetModal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:30
  },
  container2: {
    flex:1,
    backgroundColor: '#1F1F1F',
    borderRadius: 70,
    marginBottom: 10,
    width:"95%",
    alignSelf:"center",
    height:70,
    justifyContent:"center"
  },
  box: {
    flexDirection: "row",
    alignItems: "center", // Alinea los elementos verticalmente
    justifyContent:"space-between",
    alignContent:"center"
  },
  circularImageContainer: {
    width: 55,
    height: 55,
    borderRadius: 60,
    overflow: 'hidden',
    marginRight: 10,
  },
  circularImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
  },
  text: {
    fontSize: 20,
    color: "white",
    fontWeight: 'bold',
  },
  sheetEyebrow: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sheetTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  sheetHint: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  primaryButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#07140b',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderColor: '#3a3a3a',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 12,
  },
});
