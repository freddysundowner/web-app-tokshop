import { Room, Track } from 'livekit-client';
import { 
  RoomAudioRenderer, 
  RoomContext,
  VideoTrack,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';

interface LiveKitVideoPlayerProps {
  room: Room;
}

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {tracks.length > 0 && (
        <div className="w-full h-full">
          {tracks.map((trackRef) => {
            // Auto mirror: mirror local camera, don't mirror remote or screen share
            const isLocal = trackRef.participant.isLocal;
            const isCamera = trackRef.source === Track.Source.Camera;
            const shouldMirror = isLocal && isCamera;
            
            return (
              <div key={trackRef.participant.identity} className="w-full h-full">
                <VideoTrack 
                  trackRef={trackRef}
                  className="w-full h-full object-cover"
                  style={{ 
                    imageRendering: 'auto',
                    transform: shouldMirror ? 'scaleX(-1) translateZ(0)' : 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LiveKitVideoPlayer({ room }: LiveKitVideoPlayerProps) {
  return (
    <RoomContext.Provider value={room}>
      <div className="w-full h-full" data-testid="livekit-video-container">
        <VideoGrid />
        <RoomAudioRenderer />
      </div>
    </RoomContext.Provider>
  );
}

// Add default export for lazy loading compatibility
export default LiveKitVideoPlayer;
