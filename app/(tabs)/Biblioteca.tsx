import NetInfo from '@react-native-community/netinfo';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet/src';
import { router } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from '../../config/firebase';

export default function Biblioteca() {
    const [user, setUser] = useState();
    const [lists, setLists] = useState([{"name":"Descargas"}]);
    const [visible, setVisible] = useState(false);
    const [visible2, setVisible2] = useState(false);
    const [NA,setNA] = useState("");
    const [PE,setPE] = useState();
    const [internet, setInternet] = useState(true)
    const [Nnombre, setNnombre] = useState("");
    const { uid, loading, displayname } = useAuth();

    const modalRef = useRef<BottomSheetModal>(null);
    const modalRef2 = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['30%', '30%'], []);
    const snapPoints2 = useMemo(() => ['30%', '30%'], []);


  useEffect(() => {
    const checkInternetConnection = async () => {
      const state = await NetInfo.fetch();
        if (state.isConnected) {
          getTransactions();
          getUser();
        }else{
          setInternet(false)
        }
    }
    checkInternetConnection()
  }, [uid]);

const getUser = async() => {
    const docRef = doc(db, "people", uid);
    const docSnap = await getDoc(docRef); 
    setUser(docSnap.data())
  }
  
  const getTransactions = async() => {
    const q = query(collection(db, "people", uid, "playlists"), orderBy('importance', 'desc'));
    setLists([{"name":"Descargas"}])
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => doc.data());
      const todo = lists.concat(data)
      setLists(todo);
    });
}


    const renderItem = ({ item, i }) => {
        if(item.name === "Descargas"){
        return(
            <TouchableOpacity style={styles.container2} onPress={() => router.push({
              pathname: "/(screens)/Playlist",
              params: {
                qplaylist: "Descargas",
              }
            })}>
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
            <TouchableOpacity style={styles.container2} onPress={() => router.push({
              pathname: "/(screens)/Playlist",
              params: {
                qplaylist: item.name,
              }
            })}>
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

const toggleOverlay =async (v) => {
    if(visible === false && !v){
      if(user.premium === true){
        setVisible(true);
        modalRef.current?.present()
      }else{
        if(lists.length === 3){
          Alert.alert("Ya superaste el máximo de playlists gratuitas")
        }else{
          setVisible(true);
          modalRef.current?.present()
        }
      }

    }else{
      setVisible(false);
      modalRef.current?.close();
    }
    
  };
  const toggleOverlay2 = (name,estado,v) => {
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
  if(Nnombre.length !== 0 && Nnombre !== "Descargas"){
    var nombres = []
    lists.map((a)=>{
      nombres.push(a.name.toLowerCase())
    })
    if(!nombres.includes(Nnombre.toLowerCase())){
      const gamesCollection = doc(db, "people", uid,"playlists",Nnombre);
      setDoc(gamesCollection,{
        name: Nnombre,
        uri:"https://firebasestorage.googleapis.com/v0/b/spotify-20a57.appspot.com/o/music%2Fimage%20(1).png?alt=media&token=ff5ca481-48cf-4433-a0c9-e8f7ff855c16",
        importance:0,
        estado:false
      }).then((a)=>{
        setVisible(false);
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
    data.forEach(async (doc) => {
      await deleteDoc(doc);
    });
    
    const q2 = query(doc(db, "people",uid,"playlists",NA));
    await deleteDoc(q2)

        
        if(PE === true){
         var n = uid+"_"+NA
         const q = query(collection(db, "playlists",n,NA));
          const docs = await getDocs(q);
          const data = docs.docs.map(doc => doc.data());
          data.forEach(async (doc) => {
            await deleteDoc(doc);
          });
          const q2 = query(doc(db, "playlists",n));
          await deleteDoc(q2)

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

const actualizar = async(name) =>{
   var n = uid+"_"+name 

   const q = query(collection(db, "people",uid,"playlists",name,"Likes"),orderBy("dateU", 'desc'));
    const docs = await getDocs(q);
    const a = docs.docs.map(doc => doc.data());

    const batch = writeBatch(db);

            // Itera sobre la lista de documentos
            a.forEach((documentData) => {
              var namec = documentData.name;
              // Añade documentos al lote
              const documentRef = doc(db, 'playlists', n, name, namec);
              setDoc(documentRef, documentData, { merge: true });
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

const toglePublish = async(name) => { 
  if(PE === false){
    const q = query(collection(db, "people",uid,"playlists",name,"Likes"),orderBy("dateU", 'desc'));
    const docs = await getDocs(q);
    const a = docs.docs.map(doc => doc.data());

      var n = uid+"_"+name 
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
        var namec = documentData.name;
        // Añade documentos al lote
        const documentRef = doc(db, 'playlists', n, name, namec);
        setDoc(documentRef, documentData, { merge: true });
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

    var n = uid+"_"+name 
    const q = query(collection(db, "playlists",n,name));
    const docs = await getDocs(q);
    const data = docs.docs.map(doc => doc.data());
    data.forEach(async (doc) => {
      await deleteDoc(doc);
    });

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
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          detached={true}
          containerStyle={{width:"80%",marginLeft:"10%"}}
          style={{marginTop:-300}}
          keyboardBehavior='extend'
          backdropComponent={BottomSheetBackdrop}
          onDismiss={()=>toggleOverlay(true)}
          backgroundStyle={{ backgroundColor: '#111' }}
          handleIndicatorStyle={{ backgroundColor: 'gray' }}
          stackBehavior='replace'
        >
          <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
            <Text style={{color:"white",fontSize:30}}>Crear nueva playlist</Text>
            <TextInput
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
          <TouchableOpacity style={{alignSelf:"center",marginTop:25,backgroundColor:"green",borderRadius:5}} onPress={(()=> createPlay())}>
            <Text style={{color: 'black',fontSize:30,fontWeight: 'bold'}}> Crear </Text> 
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      <BottomSheetModal
          ref={modalRef2}
          index={1}
          snapPoints={snapPoints2}
          enableDynamicSizing={false}
          detached={true}
          containerStyle={{width:"80%",marginLeft:"10%"}}
          style={{marginTop:-300}}
          keyboardBehavior='extend'
          backdropComponent={BottomSheetBackdrop}
          onDismiss={()=>toggleOverlay2(true)}
          backgroundStyle={{ backgroundColor: '#111' }}
          handleIndicatorStyle={{ backgroundColor: 'gray' }}
          stackBehavior='replace'
        >
          <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
           <Text style={{color:"white",fontSize:30,textAlign:"center"}}>Borrar playlist</Text>
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

            {PE? <TouchableOpacity style={{backgroundColor:"green",borderRadius:30,marginTop:20,alignSelf:"center",alignItems:"center",padding:5}} onPress={()=>actualizar(NA)}>
              <Text style={{fontSize:17,fontWeight:"bold",color:"black"}}>Actualizar</Text> 
            </TouchableOpacity>
            : null}

            <TouchableOpacity style={{backgroundColor:"green",borderRadius:30,marginTop:10,alignSelf:"center",alignItems:"center",padding:5}} onPress={()=>toglePublish(NA)}>
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
});
