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
  setAllTransactionsPop: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsAmbient: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsDreamcore: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsPlaylistsO: React.Dispatch<React.SetStateAction<any[]>>;
  setPlaylists3: React.Dispatch<React.SetStateAction<any[]>>;
  setLastS3: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsArtistas: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTransactionsArtistas2: React.Dispatch<React.SetStateAction<any[]>>;
  setDondeP: React.Dispatch<React.SetStateAction<any | null>>;
  setDondeN: React.Dispatch<React.SetStateAction<any | null>>;
  setDondePop: React.Dispatch<React.SetStateAction<any | null>>;
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

  const fetchUser = useCallback(async () => {
    if (!uid) return;
    const docRef = doc(db, 'people', uid);
    const docSnap = await getDoc(docRef);
    const info = docSnap.data() as any;
    setUser(info);
    if (info?.colorA) setColorA(info.colorA);
    await fetchLikedRecommendations(info);
  }, [uid, setUser, setColorA, fetchLikedRecommendations]);

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
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => doc.data() as any);
    setAllTransactionsP(data);
    setDondeP(querySnapshot.docs[querySnapshot.docs.length - 1]);
  }, [setAllTransactionsP, setDondeP]);

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
  }, [setAllTransactionsArtistas, setAllTransactionsArtistas2]);

  const updatePlaylistPopularity = useCallback(async (nameA: string, name: string) => {
    const playlistId = `${nameA}_${name}`;
    const historyARef = doc(db, 'playlists', playlistId);
    await updateDoc(historyARef, { popularity: increment(1) });
  }, []);

  const refreshFeed = useCallback(async () => {
    await Promise.all([
      fetchPlaylistsOthers(),
      fetchTransactionsP(),
      fetchTransactionsN(),
      fetchGenreSection('pop', setAllTransactionsPop, setDondePop),
      fetchGenreSection('ambient', setAllTransactionsAmbient, setDondeAmbient),
      fetchGenreSection('dreamcore', setAllTransactionsDreamcore, setDondeDreamcore),
      fetchPlaylists(),
      fetchLastLikes(),
      fetchArtists(),
    ]);
  }, [fetchPlaylistsOthers, fetchTransactionsP, fetchTransactionsN, fetchGenreSection, fetchPlaylists, fetchLastLikes, fetchArtists, setAllTransactionsPop, setDondePop, setAllTransactionsAmbient, setDondeAmbient, setAllTransactionsDreamcore, setDondeDreamcore]);

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
