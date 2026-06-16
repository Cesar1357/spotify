// useAds.ts
import { loadAds, playAdBase } from "../adsService";
import { useApp } from "../context/AppContext";

export function useAds() {
  const { setMusica, setCurrentTrack, setAdT, user, setIsVideoReady } = useApp();

  const playAd = async () => {
    await playAdBase({ setMusica, setCurrentTrack, setAdT, user, setIsVideoReady });
  };

  return { loadAds, playAd };
}
