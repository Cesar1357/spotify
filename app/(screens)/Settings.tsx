import { useAuth } from '@/hooks/useAuth';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet/src';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';
import { Icon } from 'react-native-elements';
import { RadioButton, Switch } from 'react-native-paper';
import { RFValue } from 'react-native-responsive-fontsize';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import { db } from '../../config/firebase';

export default function Settings() {

  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [toggleP, setToggleP] = useState(false);
  const [toggleS, setToggleS] = useState(false);
  const [togglePerfil, setTogglePerfil] = useState(false);
  const [togglePerfilE, setTogglePerfilE] = useState(false);

  const [subtitles, setSubtitles] = useState(false);
  const { uid, loading, displayname, correo, metadata, user } = useAuth();

  const modalRef = useRef<BottomSheetModal>(null);
  const modalRef2 = useRef<BottomSheetModal>(null);
  const modalRef3 = useRef<BottomSheetModal>(null);
  const modalRef4 = useRef<BottomSheetModal>(null);
  const modalRef5 = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['22%', '22%'], []);
  const snapPoints2 = useMemo(() => ['25%', '25%'], []);
  const snapPoints3 = useMemo(() => ['44%', '44%'], []);
  const snapPoints4 = useMemo(() => ['50%', '100%'], []);
  const snapPoints5 = useMemo(() => ['25%', '25%'], []);
  const [n,setN] = useState("")
  const nR = useRef(null)
  const auth = getAuth();
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
      const backAction = () => {
        if (visible) { // Solo si el BottomSheet está abierto
          modalRef3.current?.dismiss();
          return true; // Cancela la navegación
        }
        if(toggleS){
          modalRef2.current?.dismiss();
          return true;
        }
        if(togglePerfilE){
          modalRef5.current?.dismiss();
          return true;
        }
        if(togglePerfil){
          modalRef4.current?.dismiss();
          return true;
        }
        if(toggleP){
          modalRef.current?.dismiss();
          return true;
        }
        return false; // Permite que la navegación ocurra normalmente
      };
  
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
      return () => backHandler.remove();
    }, [toggleP,togglePerfil,togglePerfilE, toggleS, visible]);

  useEffect(()=>{
    getUser()
    const f = new Date(Number("1687482482918"))
    setCreatedAt(f.toLocaleDateString())
    console.log("||",metadata)
  },[uid, metadata])

  const getUser = async() => {
    try{
      const docRef = doc(db, "people", uid);
      const docSnap = await getDoc(docRef);
      const info = docSnap.data()
      setIsRegistered(info.premium)
      setSubtitles(info.extra.subtitulos)
      setChecked(info.colorA)
    }catch(err){
      console.log(err)
    }
  }
  
  const handleLogout = async () => {
  try {
    await signOut(auth);
    console.log("Sesión cerrada exitosamente ✅");
    TrackPlayer.reset();
    router.dismissTo("/(sesion)/create");
    await Updates.reloadAsync()
    // Redirige o actualiza el estado según tu flujo de navegación
  } catch (error) {
    console.error("Error al cerrar sesión ❌", error);
  }
};

  const toggleOverlayC = () =>{
    if(!visible){
        modalRef3.current?.present();
        setVisible(true)
    }else{
        modalRef3.current?.dismiss();
        setVisible(false)
    }
  }

  const toggleOverlayS = () => {
    if(!toggleS){
        modalRef2.current?.present();
        setToggleS(true)
    }else{  
        modalRef2.current?.dismiss();
        setToggleS(false)
    }
  }
  
  const toggleOverlayP = () => {
    if(!toggleP){
        modalRef.current?.present();
        setToggleP(true)
    }else{
        modalRef.current?.dismiss();
        setToggleP(false)
    }
  };

  const toggleOverlayPerfil = () => {
    if(!togglePerfil){
        modalRef4.current?.present();
        setTogglePerfil(true)
    }else{
        modalRef4.current?.dismiss();
        setTogglePerfil(false)
    }
  };

  const toggleOverlayPerfilE = () => {
    if(!togglePerfilE){
        modalRef5.current?.present();
        setTogglePerfilE(true)
    }else{
        modalRef5.current?.dismiss();
        setTogglePerfilE(false)
    }
  };

  const updateProfile1 =async () => {
    updateProfile(user, {
      displayName: n
    }).then(async(a) => {
      const ref = doc(db, "people", uid);
      await updateDoc(ref, {
        namep:n
      }).then(() => {
        console.log('Actualización exitosa');
        ToastAndroid.showWithGravity(
          `Actualizado con éxito.`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );      
        modalRef5.current?.close()
      })
      .catch((error) => {
          console.error('Error al actualizar:', error);
      });
    })   
  }

  const toggleFetchTask = async () => {
    if (isRegistered) {
      const ref = doc(db, "people", uid);
      await updateDoc(ref, {
        premium:false
      }).then(() => {
        ToastAndroid.showWithGravity(
          `Dejaste de ser premium`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      })
      .catch((error) => {
          console.error('Error al actualizar:', error);
      });
      
    } else {
      const ref = doc(db, "people", uid);
      await updateDoc(ref, {
        premium:true
      }).then(() => {
        ToastAndroid.showWithGravity(
          `Ya eres premium`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      })
      .catch((error) => {
          console.error('Error al actualizar:', error);
      });
      
    }
    await Updates.reloadAsync()
    setIsRegistered(!isRegistered)
  };

  const toggleSubtitles = async () => {
    const ref = doc(db, "people", uid);
    if (subtitles) {
      await updateDoc(ref, {
        'extra.subtitulos':false
      }).then(() => {
        ToastAndroid.showWithGravity(
          `Subtitulos desactivados`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      })
      .catch((error) => {
          console.error('Error al actualizar:', error);
      });
      
    } else {
      await updateDoc(ref, {
        'extra.subtitulos':true
      }).then(() => {
        ToastAndroid.showWithGravity(
          `Subtitulos activados`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      })
      .catch((error) => {
          console.error('Error al actualizar:', error);
      });
      
    }
    await Updates.reloadAsync()
    setSubtitles(!subtitles)
  };

  const updateC = async() => {
      const ref = doc(db, "people", uid);
      await updateDoc(ref, {
        colorA:checked
      }).then(() => {
        console.log('Actualización exitosa');
        ToastAndroid.showWithGravity(
          `¡Reinicia para ver el cambio!`,
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM // Cambiado a la parte inferior de la pantalla
        );
      })
      .catch((error) => {
          console.error('Error al actualizar:', error);
      });
  }
  
    return (
    <SafeAreaView style={{ backgroundColor: '#111111', flex: 1 }}> 
      <View style={{ marginTop: 30}}>
        <Text style={{ fontSize: 27, marginLeft: 5, height: 40, color: 'white', fontWeight: 'bold' }}>
            Ajustes
        </Text>
        </View>
        <View style={{ marginTop: 30 }}>
        <TouchableOpacity onPress={() => {toggleOverlayPerfil()}} style={{ borderTopWidth: 1, borderColor: "gray" }}>
            <Text style={{ fontSize: 25, marginLeft: 5, height: 40, color: '#CACACA', alignItems: "center", alignContent: "center" }}>Cuenta</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleOverlayP()} style={{ borderTopWidth: 1, borderColor: "gray" }}>
            <Text style={{ fontSize: 25, marginLeft: 5, height: 40, color: '#CACACA', alignItems: "center", alignContent: "center" }}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleOverlayC()} style={{ borderTopWidth: 1, borderColor: "gray" }}>
            <Text style={{ fontSize: 25, marginLeft: 5, height: 40, color: '#CACACA', alignItems: "center", alignContent: "center" }}>Color</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleOverlayS()} style={{ borderTopWidth: 1, borderColor: "gray" }}>
            <Text style={{ fontSize: 25, marginLeft: 5, height: 40, color: '#CACACA', alignItems: "center", alignContent: "center" }}>Subtitulos</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, marginLeft: 5, height: 40, color: '#A7A7A7', alignItems: "center", alignContent: "center", alignSelf: "center", borderTopWidth: 1, borderColor: "gray" }}>Es todo por el momento</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: 10, height: 40, color: '#A7A7A7', alignItems: "center", alignContent: "center", alignSelf: "center" }}>Emperblack | v3.0.0  </Text>
    </View>

    <BottomSheetModal
        ref={modalRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        detached={true}
        containerStyle={{width:"80%",marginLeft:"10%"}}
        style={{marginTop:-330}}
        keyboardBehavior='extend'
        backdropComponent={BottomSheetBackdrop}
        onDismiss={toggleOverlayP}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        stackBehavior='switch'
    >
        <View style={{ paddingHorizontal: 16, flexDirection:"column", alignContent:"center", alignItems:"center" }}>
            <Text style={{ fontSize: 30,textAlign:"center",color: "white", fontWeight: 'bold',marginTop:10 }}>
                Premium
            </Text>
            <Switch style={{marginTop:40}} value={isRegistered} onValueChange={toggleFetchTask} />
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
        onDismiss={toggleOverlayS}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        stackBehavior='switch'
    >
        <View style={{ paddingHorizontal: 16, flexDirection:"column", alignItems:"center" }}>
            <Text style={{ fontSize: 30,textAlign:"center",color: "white", fontWeight: 'bold',marginTop:10 }}>
            Subtitulos
            </Text>
            <Text style={{ fontSize: 15,textAlign:"center",color: "gray", fontWeight: 'bold',marginTop:5 }}>
            Subtitulos debajo del video
            </Text>
            <Switch style={{marginTop:40}} value={subtitles} onValueChange={toggleSubtitles} />
        </View>
    </BottomSheetModal>

    <BottomSheetModal
        ref={modalRef3}
        index={1}
        snapPoints={snapPoints3}
        enableDynamicSizing={false}
        detached={true}
        containerStyle={{width:"80%",marginLeft:"10%"}}
        style={{marginTop:-230}}
        keyboardBehavior='extend'
        backdropComponent={BottomSheetBackdrop}
        onDismiss={toggleOverlayC}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        stackBehavior='switch'
    >
        <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
            <Text style={{fontSize:30,textAlign:"center",color:"white",fontWeight:"bold"}}>Color en el reproductor</Text>
            <Text style={{fontSize:15,textAlign:"center",color:"gray",fontWeight:"bold"}}>Esta opción indica si quieres que el color del reproductor sea del color dominante de la imagen</Text>
            <RadioButton.Group onValueChange={(value) => setChecked(value)} value={checked}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                <RadioButton color='green' value="true" />
                <Text style={{ fontSize: 20, marginRight: 10, fontWeight:"bold", color:"white" }}>Verdadero</Text>
                {checked === "true"?<Text style={{ fontSize: 20, paddingRight: 20, fontWeight:"bold", color:"gray" }}>- Si habrá color</Text>:null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <RadioButton color='green' value="false" />
                <Text style={{ fontSize: 20, marginRight: 10, fontWeight:"bold", color:"white" }}>Falso</Text>
                {checked === "false"?<Text style={{ fontSize: 20, marginRight: 10, fontWeight:"bold", color:"gray" }}>- El color será gris</Text>:null}
            </View>
        </RadioButton.Group>
        <TouchableOpacity
            style={{
                width: "80%",
                height: 40,
                backgroundColor: '#2E2E34',
                borderRadius: 30,
                alignSelf:"center",
                marginTop:20
            }}
            onPress={() => updateC()}>  
            <Text
                style={{
                fontSize: 25,
                fontWeight: 'bold',
                alignSelf: 'center',
                color: '#34904F',
                }}>
                Actualizar
            </Text>
            </TouchableOpacity>
        </View>
    </BottomSheetModal>

    <BottomSheetModal
        ref={modalRef4}
        index={1}
        snapPoints={snapPoints4}
        enableDynamicSizing={false}
        detached={false}
        containerStyle={{}}
        style={{}}
        keyboardBehavior='extend'
        backdropComponent={BottomSheetBackdrop}
        onDismiss={toggleOverlayPerfil}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        stackBehavior='switch'
    >
      <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
        <View style={{}}>
        <Text
          style={{
            fontSize: RFValue(40),
            fontWeight: 'bold',
            color: 'white',
            alignSelf: 'center',
            marginTop:"20%",
          }}>
          Perfil
        </Text>
      </View>
      <View style={{}}>
        <View style={{ marginTop:"30%" }}>
          <Text
            style={{
              color: 'white',
              fontSize: RFValue(40),
              fontWeight: 'bold',
              textAlign:"center"
            }}>
            {displayname}
          </Text>
          <TouchableOpacity
            style={{
              width: 80,
              height: 30,
              backgroundColor: 'gray',
              borderRadius: 20,
              marginTop: 5,
              alignSelf:"center"
            }}
            onPress={() => toggleOverlayPerfilE()}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginTop: 3,
                color: 'black',
              }}>
              Editar
            </Text>
          </TouchableOpacity>
          <Text style={{
              color: 'gray',
              fontSize: RFValue(20),
              fontWeight: 'bold',
              marginTop:20,
              textAlign:"center"
            }}>
        {correo}
        </Text>
         <Text style={{
              color: 'gray',
              fontSize: RFValue(15),
              fontWeight: 'bold',
              marginTop:20,
              textAlign:"center"
            }}>
        {uid}
        </Text>
          <Text style={{
                color: 'gray',
                fontSize: RFValue(15),
                fontWeight: 'bold',
                marginTop:RFValue(150),
                textAlign:"center"
              }}>
          Cuenta creada el: {metadata?.createdAt? createdAt : "Fecha no disponible"}
          </Text>
        </View>

        </View>
        <TouchableOpacity
          onPress={() => Alert.alert("Cerrar sesión","¿Seguro que quieres cerrar sesión?", [
            {
              text: 'Si',
              color: 'red',
              onPress: () => handleLogout(),
            },{
              text: 'No',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            }],{cancelable: true})}
          style={{
            marginLeft: '86%',
          }}>
          <Icon type={'ionicon'} name={'log-out'} color={'red'} size={40} />
        </TouchableOpacity>  
        </View>
    </BottomSheetModal>
    <BottomSheetModal
        ref={modalRef5}
        index={1}
        snapPoints={snapPoints5}
        enableDynamicSizing={false}
        detached={true}
        containerStyle={{width:"80%",marginLeft:"10%"}}
        style={{marginTop:-330}}
        keyboardBehavior='extend'
        backdropComponent={BottomSheetBackdrop}
        onDismiss={toggleOverlayPerfilE}
        backgroundStyle={{ backgroundColor: '#111' }}
        handleIndicatorStyle={{ backgroundColor: 'gray' }}
        stackBehavior='push'
    >
      <View style={{ paddingHorizontal: 16, flexDirection:"column" }}>
        <Text
          style={{
            fontSize: RFValue(30),
            fontWeight:"bold",
            color: 'white',
            alignSelf: 'center',
          }}>
          Cambiar Nombre
        </Text>
        <TextInput
          style={{
            backgroundColor: 'white',
            fontWeight: 'bold',
            borderColor: 'white',
            color: '#666664',
            width: '95%',
            alignSelf: 'center',
            borderRadius: 5,
            height: 45,
            marginTop: 10,
            fontSize:17 ,
            paddingLeft:5
          }}
          onChangeText={(text) => setN(text)}
          placeholder={'Nuevo nombre'}
          maxLength={15}
          ref={nR}
          placeholderTextColor="#666664"
          keyboardAppearance={"dark"}
          keyboardType={"web-search"}
          clearButtonMode={"always"}
          returnKeyType={"search"} 
        />
        <TouchableOpacity
            style={{
              width: '60%',
              height: 40,
              backgroundColor: '#2E2E34',
              borderRadius: 30,
              alignSelf:"center",
              marginTop:30
            }}
            onPress={() => updateProfile1()}>  
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'center',
                marginTop: 5,
                color: '#34904F',
              }}>
              Actualizar
            </Text>
          </TouchableOpacity>
      </View>
    </BottomSheetModal>
  </SafeAreaView>
)
}