import { collection, doc, getDoc, getDocs, increment, limit, orderBy, query, startAfter, updateDoc, where } from 'firebase/firestore';
import React, { useCallback } from 'react';
import { db } from '../config/firebase';

const delay = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export type HomeFeedSetters = {
  setUser: React.Dispatch<React.SetStateAction<any>>;
  setColorA: React.Dispatch<React.SetStateAction<string>>;
  setAllTransactionsP: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsN: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsL: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsAmbient: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsDreamcore: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsMood: React.Dispatch<React.SetStateAction<any[]>>;
  setMoodTitle: React.Dispatch<React.SetStateAction<string>>;
  setDynamicGenreSections: React.Dispatch<React.SetStateAction<any[]>>;
  setFeaturedArtistSongs: React.Dispatch<React.SetStateAction<any[]>>;
  setFeaturedArtistName: React.Dispatch<React.SetStateAction<string>>;
  setAllTransactionsPlaylistsO: React.Dispatch<React.SetStateAction<any[]>>;
  setPlaylists3: React.Dispatch<React.SetStateAction<any[]>>;
  setLastS3: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsArtistas: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsArtistas2: React.Dispatch<React.SetStateAction<any[]>>;
  setDondeP: React.Dispatch<React.SetStateAction<any | null>>;
  setDondeN: React.Dispatch<React.SetStateAction<any | null>>;
  setDondeAmbient: React.Dispatch<React.SetStateAction<any | null>>;
  setDondeDreamcore: React.Dispatch<React.SetStateAction<any | null>>;
};

export const useHomeFeed = (uid: string | null, setters: HomeFeedSetters) => {
  const {
    setUser,
    setColorA,
    setAllTransactionsP,
    setAllTransactionsN,
    setAllTransactionsL,
    setAllTransactionsAmbient,
    setAllTransactionsDreamcore,
    setAllTransactionsMood,
    setMoodTitle,
    setDynamicGenreSections,
    setFeaturedArtistSongs,
    setFeaturedArtistName,
    setAllTransactionsPlaylistsO,
    setPlaylists3,
    setLastS3,
    setAllTransactionsArtistas,
    setAllTransactionsArtistas2,
    setDondeP,
    setDondeN,
    setDondeAmbient,
    setDondeDreamcore,
  } = setters;

  const fetchLikedRecommendations = useCallback(async (userInfo: any) => {
    if (!uid) return;
    const q = query(collection(db, 'people', uid, 'playlists', 'Likes', 'Likes'));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setAllTransactionsL(data);

    const genres: string[] = [];
    data.forEach((item) => {
      (item.generos || []).forEach((genre: string) => {
        if (genre && !genres.includes(genre)) genres.push(genre);
      });
    });

    const count = userInfo?.premium === true ? 5 : 2;
    const primaryGenres = genres.slice(0, 10);
    const secondaryGenres = genres.slice(10, 20);
    const recommendations: any[] = [];

    const loadByGenres = async (genreList: string[]) => {
      if (genreList.length === 0) return;
      const querySnapshot = await getDocs(query(collection(db, 'musica'), where('generos', 'array-contains-any', genreList)));
      const candidates = querySnapshot.docs.map((doc) => doc.data() as any);
      candidates.forEach((item) => {
        if (recommendations.length >= count) return;
        if (data.some((liked) => liked.name === item.name)) return;
        if (recommendations.some((existing) => existing.name === item.name)) return;
        recommendations.push(item);
      });
    };

    await loadByGenres(primaryGenres);
    await delay(0.4);
    await loadByGenres(secondaryGenres);
    setAllTransactionsL(recommendations);
  }, [uid, setAllTransactionsL]);

  const fetchTimeBasedRecommendations = useCallback(async () => {
    if (!uid) return;

    const hour = new Date().getHours();
    const timeGenres = hour < 6
      ? ['ambient', 'dreamcore', 'lofi']
      : hour < 12
        ? ['pop', 'acoustic', 'indie']
        : hour < 18
          ? ['pop', 'electronic', 'rock']
          : ['ambient', 'dreamcore', 'relaxing'];
    const title = hour < 6
      ? 'Sesión nocturna'
      : hour < 12
        ? 'Para empezar el día'
        : hour < 18
          ? 'Energía para tu día'
          : 'Para desconectar un rato';

    const likedSnapshot = await getDocs(query(collection(db, 'people', uid, 'playlists', 'Likes', 'Likes'), limit(30)));
    const likedSongs = likedSnapshot.docs.map((songDoc) => songDoc.data() as any);
    const likedGenres = likedSongs.flatMap((song) => Array.isArray(song.generos) ? song.generos : []);
    const genres = [...new Set([...likedGenres, ...timeGenres])].slice(0, 10);
    let candidates: any[] = [];

    if (genres.length > 0) {
      const genreSnapshot = await getDocs(query(
        collection(db, 'musica'),
        where('generos', 'array-contains-any', genres),
        limit(30),
      ));
      candidates = genreSnapshot.docs.map((songDoc) => songDoc.data() as any);
    }

    const likedNames = new Set(likedSongs.map((song) => song.name));
    const recommendations = candidates
      .filter((song) => song.name && !likedNames.has(song.name))
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    if (recommendations.length < 4) {
      const popularSnapshot = await getDocs(query(collection(db, 'musica'), orderBy('popularity', 'desc'), limit(15)));
      popularSnapshot.docs.forEach((songDoc) => {
        const song = songDoc.data() as any;
        if (song.name && !likedNames.has(song.name) && !recommendations.some((item) => item.name === song.name)) {
          recommendations.push(song);
        }
      });
    }

    setMoodTitle(title);
    setAllTransactionsMood(recommendations.slice(0, 8));
  }, [uid, setAllTransactionsMood, setMoodTitle]);

  const fetchUser = useCallback(async () => {
    if (!uid) return;
    const docRef = doc(db, 'people', uid);
    const docSnap = await getDoc(docRef);
    const info = docSnap.data() as any;
    setUser(info);
    if (info?.colorA) setColorA(info.colorA);
    await fetchLikedRecommendations(info);
    await fetchTimeBasedRecommendations();
  }, [uid, setUser, setColorA, fetchLikedRecommendations, fetchTimeBasedRecommendations]);

  const fetchPlaylistsOthers = useCallback(async () => {
    const q = query(collection(db, 'playlists'), orderBy('popularity', 'desc'));
    const docs = await getDocs(q);
    const canciones = docs.docs.map((doc) => doc.data() as any);
    const result: any[] = [];
    for (let i = 0; i < canciones.length; i += 2) {
      result.push(canciones.slice(i, i + 2));
    }
    setAllTransactionsPlaylistsO(result);
  }, [setAllTransactionsPlaylistsO]);

  const fetchTransactionsP = useCallback(async () => {
    const q = query(collection(db, 'musica'), orderBy('popularity', 'desc'), limit(5));
    let querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      querySnapshot = await getDocs(query(collection(db, 'musica'), orderBy('dateU', 'desc'), limit(5)));
    }
    const data = querySnapshot.docs
      .map((doc) => doc.data() as any)
      .filter((song, index, songs) => song.name && songs.findIndex((item) => item.name === song.name) === index);
    setAllTransactionsP(data);
    setDondeP(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, [setAllTransactionsP, setDondeP]);

  const fetchDynamicGenreSections = useCallback(async () => {
    const sourceSnapshot = await getDocs(query(collection(db, 'musica'), limit(300)));
    const sourceSongs = sourceSnapshot.docs.map((songDoc) => songDoc.data() as any);
    const genreGroups = new Map<string, { value: string; songs: any[] }>();

    const normalizeGenreKey = (value: string) => value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(labels?|entertainment|records?|music|company|agency)\b/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    sourceSongs.forEach((song) => {
      const genres = Array.isArray(song.generos)
        ? song.generos
        : typeof song.generos === 'string'
          ? song.generos.split(',')
          : [];
      const genreValues: string[] = Array.from(new Set(genres.map((genre: unknown) => String(genre).trim()).filter(Boolean)));
      genreValues.forEach((value: string) => {
          const key = normalizeGenreKey(value);
          if (!key) return;
          const current = genreGroups.get(key) ?? { value, songs: [] };
          if (!current.songs.some((item) => item.name === song.name)) current.songs.push(song);
          genreGroups.set(key, current);
        });
    });

    const excludedGenres = new Set(['pop', 'ambient', 'dreamcore']);
    const candidates = [...genreGroups.entries()]
      .filter(([genre, data]) => !excludedGenres.has(genre) && data.songs.length >= 3)
      .sort(([, dataA], [, dataB]) => dataB.songs.length - dataA.songs.length);
    const selectedGenres: { key: string; value: string; songs: any[] }[] = [];
    const usedSongNames = new Set<string>();

    for (const [key, data] of candidates) {
      const newSongs = data.songs.filter((song) => song.name && !usedSongNames.has(song.name));
      if (newSongs.length < 3) continue;
      selectedGenres.push({ key, value: data.value, songs: newSongs.slice(0, 8) });
      newSongs.forEach((song) => usedSongNames.add(song.name));
      if (selectedGenres.length === 20) break;
    }

    const sectionTitles = [
      'Descubre',
      'Tu lado',
      'Selección',
      'Explora',
      'Viaja por',
      'Sumérgete en',
      'Favoritos de',
      'Sonidos de',
      'Ruta',
      'Universo',
      'Esencia',
      'Vibras de',
      'Colección',
      'Paisaje',
      'Conoce',
      'Sesión',
      'Frecuencia',
      'Archivo',
      'Panorama',
      'Radar',
    ];
    const sections = selectedGenres.map((genre, index) => {
      const label = genre.value.charAt(0).toUpperCase() + genre.value.slice(1);
      return { genre: genre.key, title: `${sectionTitles[index] ?? 'Descubre'} ${label}`, songs: genre.songs };
    });

    setDynamicGenreSections(sections);
  }, [setDynamicGenreSections]);

  const fetchMoreTransactionsP = useCallback(async (user: any, allTransactionsP: any[], dondeP: any | null) => {
    if (!user?.premium || allTransactionsP.length >= 14 || !dondeP) return;
    const q = query(collection(db, 'musica'), orderBy('popularity', 'desc'), startAfter(dondeP), limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setAllTransactionsP(allTransactionsP.concat(data));
    setDondeP(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, [setAllTransactionsP, setDondeP]);

  const fetchTransactionsN = useCallback(async () => {
    const q = query(collection(db, 'musica'), orderBy('dateU', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setAllTransactionsN(data);
    setDondeN(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, [setAllTransactionsN, setDondeN]);

  const fetchMoreTransactionsN = useCallback(async (user: any, allTransactionsN: any[], dondeN: any | null) => {
    if (!user?.premium || allTransactionsN.length >= 14 || !dondeN) return;
    const q = query(collection(db, 'musica'), orderBy('dateU', 'desc'), startAfter(dondeN), limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setAllTransactionsN(allTransactionsN.concat(data));
    setDondeN(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, [setAllTransactionsN, setDondeN]);

  const fetchGenreSection = useCallback(async (genre: string, setter: React.Dispatch<React.SetStateAction<any[]>>, setLast: React.Dispatch<React.SetStateAction<any | null>>) => {
    const q = query(collection(db, 'musica'), where('generos', 'array-contains', genre), limit(5));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setter(data);
    setLast(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, []);

  const fetchMoreGenreSection = useCallback(async (user: any, allItems: any[], lastDoc: any | null, genre: string, setter: React.Dispatch<React.SetStateAction<any[]>>, setLast: React.Dispatch<React.SetStateAction<any | null>>) => {
    if (!user?.premium || allItems.length >= 14 || !lastDoc) return;
    const q = query(collection(db, 'musica'), where('generos', 'array-contains', genre), startAfter(lastDoc), limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setter(allItems.concat(data));
    setLast(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, []);

  const fetchPlaylists = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, 'people', uid, 'playlists'), orderBy('importance', 'desc'), limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setPlaylists3(data);
  }, [uid, setPlaylists3]);

  const fetchLastLikes = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, 'people', uid, 'playlists', 'Likes', 'Likes'), orderBy('popularity', 'desc'), limit(3));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setLastS3(data);
  }, [uid, setLastS3]);

  const fetchArtists = useCallback(async () => {
    const q = query(collection(db, 'autores'));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    const shuffledData = data.sort(() => Math.random() - 0.5);
    setAllTransactionsArtistas(shuffledData.slice(0, Math.max(0, Math.floor(shuffledData.length / 2) - 1)));
    setAllTransactionsArtistas2(shuffledData.slice(Math.floor(shuffledData.length / 2)));

    const featuredArtist = shuffledData[0]?.name;
    if (!featuredArtist) return;
    const music = collection(db, 'musica');
    const snapshots = await Promise.all([
      getDocs(query(music, where('autor', '==', featuredArtist))),
      getDocs(query(music, where('autor', 'array-contains', featuredArtist))),
      getDocs(query(music, where('autores', '==', featuredArtist))),
      getDocs(query(music, where('autores', 'array-contains', featuredArtist))),
    ]);
    const songsById = new Map<string, any>();
    snapshots.forEach((snapshot) => snapshot.docs.forEach((songDoc) => songsById.set(songDoc.id, songDoc.data())));
    setFeaturedArtistName(featuredArtist);
    setFeaturedArtistSongs(Array.from(songsById.values()).slice(0, 8));
  }, [setAllTransactionsArtistas, setAllTransactionsArtistas2, setFeaturedArtistName, setFeaturedArtistSongs]);

  const updatePlaylistPopularity = useCallback(async (nameA: string, name: string) => {
    const playlistId = `${nameA}_${name}`;
    const historyARef = doc(db, 'playlists', playlistId);
    await updateDoc(historyARef, { popularity: increment(1) });
  }, []);

  const refreshFeed = useCallback(async () => {
    await Promise.all([
      fetchPlaylistsOthers(),
      fetchTransactionsP(),
      fetchDynamicGenreSections(),
      fetchTransactionsN(),
      fetchGenreSection('ambient', setAllTransactionsAmbient, setDondeAmbient),
      fetchGenreSection('dreamcore', setAllTransactionsDreamcore, setDondeDreamcore),
      fetchPlaylists(),
      fetchLastLikes(),
      fetchArtists(),
    ]);
  }, [fetchPlaylistsOthers, fetchTransactionsP, fetchDynamicGenreSections, fetchTransactionsN, fetchGenreSection, fetchPlaylists, fetchLastLikes, fetchArtists, setAllTransactionsAmbient, setDondeAmbient, setAllTransactionsDreamcore, setDondeDreamcore]);

  return {
    fetchUser,
    refreshFeed,
    fetchMoreTransactionsP,
    fetchMoreTransactionsN,
    fetchMoreGenreSection,
    fetchLastLikes,
    fetchPlaylistsOthers,
    updatePlaylistPopularity,
  };
};
