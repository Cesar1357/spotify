// context/AppContext.tsx
import { createContext, useContext, useRef, useState } from 'react';

interface AppContextType {
  reproduciendoD: string[];
  setReproduciendoD: React.Dispatch<React.SetStateAction<string[]>>;
  icon: string[];
  setIcon: React.Dispatch<React.SetStateAction<string[]>>;
  qplaylist: string[];
  setQplaylist: React.Dispatch<React.SetStateAction<string[]>>;
  musica: string[];
  setMusica: React.Dispatch<React.SetStateAction<string[]>>;
  user: string[];
  setUser: React.Dispatch<React.SetStateAction<string[]>>;
  colorA: string[];
  setColorA: React.Dispatch<React.SetStateAction<string[]>>;
  uid: string[];
  setUid: React.Dispatch<React.SetStateAction<string[]>>;
  estado: boolean;
  setEstado: React.Dispatch<React.SetStateAction<boolean>>;
  isVideoReady: boolean;
  setIsVideoReady: React.Dispatch<React.SetStateAction<boolean>>;
  AdT: boolean;
  setAdT: React.Dispatch<React.SetStateAction<boolean>>;
  estado2:string[];
  setEstado2: React.Dispatch<React.SetStateAction<string[]>>;
  playlistSongs: string[];
  setPlaylistSongs: React.Dispatch<React.SetStateAction<string[]>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  modoReproduccion:number;
  setModoReproduccion: React.Dispatch<React.SetStateAction<number>>;
  currentTrack: string[];
  setCurrentTrack: React.Dispatch<React.SetStateAction<string[]>>;
  lastRouteRef: React.RefObject<string>;
  currentIndexRef: React.RefObject<number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [icon, setIcon] = useState<string>('play');
  const [qplaylist, setQplaylist] = useState<string>('Likes');
  const [musica, setMusica] = useState<string[]>([]);
  const [user, setUser] = useState<string[]>([]);
  const [colorA, setColorA] = useState<string>('white');
  const [uid, setUid] = useState<string | null>(null);
  const [estado, setEstado] = useState<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [AdT, setAdT] = useState<boolean>(false);
  const [playlistSongs, setPlaylistSongs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [modoReproduccion, setModoReproduccion] = useState<number>(0);
  const [estado2, setEstado2] = useState<string>('pause');
  const [currentTrack, setCurrentTrack] = useState<string[]>([]);
  const lastRouteRef = useRef<string>(null);
  const currentIndexRef = useRef<number>(-1);
  const [reproduciendoD, setReproduciendoD] = useState<string>('Inicio');
  //0-normal 1-repeat 2-reproduccion 3-reproduccionAleatoria
  return (
    <AppContext.Provider value={{ 
      icon, 
      setIcon, 
      musica, 
      setMusica, 
      qplaylist,
      setQplaylist,
      user, 
      setUser,
      colorA, 
      setColorA, 
      uid, 
      setUid, 
      estado, 
      setEstado, 
      playlistSongs, 
      setPlaylistSongs, 
      currentIndex, 
      setCurrentIndex, 
      estado2, 
      setEstado2, 
      modoReproduccion, 
      setModoReproduccion, 
      currentTrack, 
      setCurrentTrack, 
      currentIndexRef,
      reproduciendoD,
      setReproduciendoD,
      AdT,
      setAdT,
      isVideoReady, 
      setIsVideoReady,
      lastRouteRef 
      }}>
        {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
