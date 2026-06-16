import dayjs from "dayjs";
import { collection, doc, getDocs, increment, query, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import TrackPlayer from "react-native-track-player";
import { auth, db } from "./config/firebase";


let ads: any[] = []; // se rellenará desde Firestore
let premium = false;
// 🔄 Cargar anuncios desde Firebase
export async function loadAds() {
  try {
    const q = query(collection(db, "anuncios"));
    const docs = await getDocs(q);

    ads = docs.docs.map((doc) => {
      const item = doc.data();
      return {
        id: `ad-${item.id || doc.id}`, // usa id del doc si no viene en el objeto
        url: item.uri,
        vid: item.uri, // si tienes un campo diferente para video cámbialo
        title: item.name,
        artist: item.autor,
        artwork:
          "https://firebasestorage.googleapis.com/v0/b/spotify-20a57.appspot.com/o/anuncios%2FChatGPT%20Image%2027%20ago%202025%2C%2009_16_23%20p.m..png?alt=media&token=cc4597cd-c5b3-42a1-a2c8-79466ea306c2",
        dominantColor: "#404040",
        qplaylist: "Anuncios",
        donde: "Anuncios",
        isAd: true,
      };
    });

    console.log("📢 Anuncios cargados:", ads.length);
  } catch (error) {
    console.error("❌ Error cargando anuncios:", error);
  }
}



export async function playAdBase({ setMusica, setCurrentTrack, setAdT, user, setIsVideoReady }: { setMusica: Function; setCurrentTrack: Function; setAdT: Function; user: any; setIsVideoReady: Function }) {
  premium = Boolean(user?.premium);


  if (ads.length === 0 || user.premium) {
    console.log("⚠️ No hay anuncios cargados, saltando...", "premium: ", user.premium);
    await TrackPlayer.skipToNext();
    await TrackPlayer.play();
    return;
  } 
  
  
  var ran = Math.random();
  console.log("Decidiendo si poner anuncio: ", ran);
  if (ran < 0.5) {
    console.log("Añadiendo anuncio a la cola...");
    const currentTrackId = await TrackPlayer.getActiveTrackIndex();
    const insertIndex = typeof currentTrackId === 'number' ? currentTrackId + 1 : undefined;
    const randomIndex = Math.floor(Math.random() * ads.length);
    const selectedAd: any = ads[randomIndex];

    // Inserta el anuncio en el player
    setCurrentTrack({
      id: selectedAd.id,
      url: selectedAd.url,
      vid: selectedAd.vid,
      title: selectedAd.title,
      artist: selectedAd.artist,
      artwork: selectedAd.artwork,
      dominantColor: selectedAd.dominantColor,
      qplaylist: "Anuncios",
      donde: "Anuncios",
      isAd: true,
    })
    setMusica([selectedAd.title,selectedAd.artist,selectedAd.artwork,[selectedAd.url,selectedAd.vid],selectedAd.generos,selectedAd.letra,selectedAd.donde,selectedAd.dominantColor]);
    console.log("setTrack en adsServie")
    await TrackPlayer.add({
      id: selectedAd.id,
      url: selectedAd.url,
      vid: selectedAd.vid,
      title: selectedAd.title,
      artist: selectedAd.artist,
      artwork: selectedAd.artwork,
      dominantColor: selectedAd.dominantColor,
      qplaylist: "Anuncios",
      donde: "Anuncios",
      isAd: true,
    }, insertIndex);
    await TrackPlayer.skipToNext();
    await TrackPlayer.pause();
    console.log("▶️ Anuncio en reproducción:", selectedAd.title);
  }else{
    await TrackPlayer.skipToNext();
    await TrackPlayer.play();
  }
}

export async function playAd() {

  const updateNumber2 = async () => {
    await TrackPlayer.skipToNext();
    await TrackPlayer.play();

    console.log("update Intentando adsservice");
    console.log("Saltando anuncio");
    const track = await TrackPlayer.getActiveTrack();
    if (!track) {
      console.warn('No active track available for adsService update');
      return;
    }

    try{
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.warn('No authenticated user for adsService update');
        return;
      }
      
      const now = dayjs();
      let seconds = now.second();

      const decenas = Math.floor(seconds / 10) * 10;
      const unidades = seconds % 10;
      const unidadesRedondeadas = 0;

      const newSeconds = decenas + unidadesRedondeadas;

      var date = now.set("second", newSeconds).format("ddd MMM DD YYYY HH:mm:ss").concat(String(track.title));

      let letra1 = track.letra ?? "";
      let dominant1 = track.dominantColor ?? "";
      const qplaylist = String(track.qplaylist ?? '');
      const trackTitle = String(track.title ?? '');

      console.log("actualizando reproducciones en adsService", "qplay:", qplaylist)
      const ref = doc(db, "people", String(uid),"playlists", qplaylist,"Likes", trackTitle);
        await updateDoc(ref, {
          popularity:increment(1)
        }).then(() => {
          console.log('Actualización exitosa en adsService');
        })
        .catch((error) => {
          console.error('Error al actualizar:', error);
        });
  
  
        const historyARef = doc(db, "people", String(uid), "historyA", date);
        setDoc(historyARef,{
          dateU:Timestamp.now().toDate(),
          dateS:date,
          name:track.title,
          autor:track.artist,
          uri:track.url,
          img:track.artwork,
          generos:track.generos,
          letra:letra1,
          dominantColor:dominant1,
          tipo:"Canción",
        })
      }catch(err){
        console.log(err)
      }
    }

  if (ads.length === 0 || premium) {
    console.log("⚠️ No hay anuncios cargados, saltando...");
    await updateNumber2()
    return;
  } 
  
  var ran = Math.random();
  console.log("Decidiendo si poner anuncio2: ", ran);
  if (ran < 0.5) {
    console.log("Añadiendo anuncio a la cola...2");
    const currentTrackId = await TrackPlayer.getActiveTrackIndex();
    const randomIndex = Math.floor(Math.random() * ads.length);
    const selectedAd = ads[randomIndex];
    // Inserta el anuncio en el player
    const insertIndex2 = typeof currentTrackId === 'number' ? currentTrackId + 1 : undefined;
    await TrackPlayer.add({
      id: selectedAd.id,
      url: selectedAd.url,
      vid: selectedAd.vid,
      title: selectedAd.title,
      artist: selectedAd.artist,
      artwork: selectedAd.artwork,
      dominantColor: selectedAd.dominantColor,
      qplaylist: "Anuncios",
      donde: "Anuncios",
      isAd: true,
    }, insertIndex2);
    await TrackPlayer.skipToNext();
    await TrackPlayer.play();
    
    console.log("▶️ Anuncio en reproducción2:", selectedAd.title);
    return;
  }else{
    await updateNumber2();
  }
}