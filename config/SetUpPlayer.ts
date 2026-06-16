// lib/trackPlayerSetup.ts
import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';
import TrackPlayerService from '../trackPlayerService';

export const setupTrackPlayer = async () => {
  let isSetup = false;
  
  try {
    TrackPlayer.registerPlaybackService(() => TrackPlayerService);
    await TrackPlayer.setupPlayer();
    isSetup = true;

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SkipToNext,
            Capability.SkipToPrevious
        ],
        compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious
        ],
        notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
        ],
    });

    console.log('||||||||||||||||||TrackPlayer setup completo||||||||||||||||||');
  } catch (error) {
    console.log('Error al configurar TrackPlayer:', error);
  }

  return isSetup;
};
