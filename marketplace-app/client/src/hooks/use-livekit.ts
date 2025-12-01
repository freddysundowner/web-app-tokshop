import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrackPublication } from 'livekit-client';
import { apiRequest } from '@/lib/queryClient';

export interface LiveKitConfig {
  roomId: string;
  userId: string;
  userName?: string;
  enabled?: boolean;
}

export interface LiveKitState {
  room: Room | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
  isHost: boolean;
  isMuted: boolean;
  hasHostVideo: boolean;
  hasHostAudio: boolean;
  hostParticipantCount: number;
}

export function useLiveKit(config: LiveKitConfig) {
  const [state, setState] = useState<LiveKitState>({
    room: null,
    isConnecting: false,
    isConnected: false,
    error: null,
    hasVideo: false,
    hasAudio: false,
    isHost: false,
    isMuted: false,
    hasHostVideo: false,
    hasHostAudio: false,
    hostParticipantCount: 0,
  });
  
  const hasAttemptedRef = useRef(false);
  const roomRef = useRef<Room | null>(null);

  const updateHostTrackState = useCallback((room: Room) => {
    let hasHostVideo = false;
    let hasHostAudio = false;
    let hostCount = 0;

    room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      const hasPublishPermission = participant.permissions?.canPublish ?? false;
      if (hasPublishPermission) {
        hostCount++;
        participant.videoTrackPublications.forEach((pub: RemoteTrackPublication) => {
          if (pub.track && pub.isSubscribed) {
            hasHostVideo = true;
          }
        });
        participant.audioTrackPublications.forEach((pub: RemoteTrackPublication) => {
          if (pub.track && pub.isSubscribed) {
            hasHostAudio = true;
          }
        });
      }
    });

    console.log('📊 Host track state updated:', { hasHostVideo, hasHostAudio, hostCount });
    setState(prev => ({ 
      ...prev, 
      hasHostVideo, 
      hasHostAudio, 
      hostParticipantCount: hostCount 
    }));
  }, []);

  const connect = useCallback(async () => {
    if (!config.enabled || !config.roomId || !config.userId) {
      return;
    }

    if (hasAttemptedRef.current) {
      console.log('🔒 Already attempted connection for this room, skipping');
      return;
    }

    hasAttemptedRef.current = true;

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      console.log('🔌 Getting LiveKit token...', { roomId: config.roomId, userId: config.userId });

      const res = await apiRequest('POST', `/livekit/token`, {
        room: config.roomId,
        userId: config.userId,
        userName: config.userName || config.userId,
      });

      const response = await res.json() as { token: string; url: string; role?: string; piptoken?: string };
      const { token, url, role: serverRole } = response;
      
      if (!token || !url) {
        throw new Error('Invalid token response from server');
      }
      
      const isHost = serverRole === 'host';
      console.log('🔐 Server verified role:', serverRole, 'isHost:', isHost);
      
      setState(prev => ({ ...prev, isHost }));

      console.log('✅ LiveKit token received, connecting to room...', { url, roomId: config.roomId, role: serverRole });

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1920, height: 1080, frameRate: 30 },
        },
        publishDefaults: {
          videoEncoding: { maxBitrate: 3_000_000, maxFramerate: 30 },
          simulcast: true,
        },
      });

      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to LiveKit room');
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          isConnected: true,
          room,
        }));
        updateHostTrackState(room);
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('❌ Disconnected from LiveKit room (will not auto-reconnect)');
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          hasHostVideo: false,
          hasHostAudio: false,
          hostParticipantCount: 0,
        }));
      });

      room.on(RoomEvent.Reconnecting, () => {
        console.log('🔄 Reconnecting to LiveKit room...');
      });

      room.on(RoomEvent.Reconnected, () => {
        console.log('✅ Reconnected to LiveKit room');
        updateHostTrackState(room);
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('👤 Participant connected:', participant.identity);
        updateHostTrackState(room);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('👤 Participant disconnected:', participant.identity);
        updateHostTrackState(room);
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('📹 Track subscribed:', track.kind, 'from:', participant.identity);
        
        if (track.kind === Track.Kind.Video) {
          setState(prev => ({ ...prev, hasVideo: true }));
        } else if (track.kind === Track.Kind.Audio) {
          setState(prev => ({ ...prev, hasAudio: true }));
        }
        
        updateHostTrackState(room);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('📹 Track unsubscribed:', track.kind, 'from:', participant.identity);
        updateHostTrackState(room);
      });

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        console.log('📤 Local track published:', publication.kind);
        
        if (publication.kind === Track.Kind.Video) {
          setState(prev => ({ ...prev, hasVideo: true }));
        } else if (publication.kind === Track.Kind.Audio) {
          setState(prev => ({ ...prev, hasAudio: true }));
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        console.log('📤 Local track unpublished:', publication.kind);
        
        if (publication.kind === Track.Kind.Video) {
          setState(prev => ({ ...prev, hasVideo: false }));
        } else if (publication.kind === Track.Kind.Audio) {
          setState(prev => ({ ...prev, hasAudio: false }));
        }
      });

      await room.connect(url, token);

      console.log('✅ LiveKit room connected successfully');

      const canPublish = room.localParticipant.permissions?.canPublish ?? false;
      console.log('🔐 LiveKit permissions:', { canPublish, role: serverRole });

      if (canPublish) {
        console.log('🎥 Enabling camera and microphone for host...');
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          await room.localParticipant.setCameraEnabled(true, {
            resolution: { width: 1920, height: 1080, frameRate: 30 }
          });
          console.log('✅ Camera and microphone enabled');
        } catch (error) {
          console.error('❌ Failed to enable camera/microphone:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to access camera or microphone. Please check permissions.',
          }));
        }
      } else {
        console.log('👁️ User is viewer (no publish permissions)');
      }

    } catch (error) {
      console.error('❌ LiveKit connection error:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to live stream',
      }));
    }
  }, [config.enabled, config.roomId, config.userId, config.userName, updateHostTrackState]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      console.log('🔌 Disconnecting from LiveKit room...');
      await roomRef.current.disconnect();
      roomRef.current = null;
      setState({
        room: null,
        isConnecting: false,
        isConnected: false,
        error: null,
        hasVideo: false,
        hasAudio: false,
        isHost: false,
        isMuted: false,
        hasHostVideo: false,
        hasHostAudio: false,
        hostParticipantCount: 0,
      });
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    
    if (!roomRef.current.localParticipant.permissions?.canPublish) {
      console.warn('Cannot toggle camera: user does not have publish permissions');
      return;
    }
    
    try {
      const enabled = roomRef.current.localParticipant.isCameraEnabled;
      await roomRef.current.localParticipant.setCameraEnabled(!enabled);
      setState(prev => ({ ...prev, hasVideo: !enabled }));
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  }, []);

  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;
    
    if (!roomRef.current.localParticipant.permissions?.canPublish) {
      console.warn('Cannot toggle microphone: user does not have publish permissions');
      return;
    }
    
    try {
      const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
      setState(prev => ({ ...prev, hasAudio: !enabled }));
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, []);

  const toggleAudioMute = useCallback(async () => {
    if (!roomRef.current) return;

    const newMutedState = !state.isMuted;

    if (state.isHost) {
      console.log('🎤 Host toggling microphone:', { currentlyMuted: state.isMuted, willBeMuted: newMutedState });
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
        setState(prev => ({ ...prev, isMuted: newMutedState, hasAudio: !newMutedState }));
        console.log('✅ Host microphone toggled:', { muted: newMutedState });
        
        console.log('📡 Updating room audioMuted status:', newMutedState);
        try {
          await apiRequest('PATCH', `/api/rooms/${config.roomId}`, {
            audioMuted: newMutedState
          });
          console.log('✅ Room audioMuted status updated');
        } catch (error) {
          console.error('❌ Failed to update room audioMuted status:', error);
        }
      } catch (error) {
        console.error('❌ Failed to toggle host microphone:', error);
      }
    } else {
      console.log('🔇 Viewer muting remote audio:', newMutedState);
      roomRef.current.remoteParticipants.forEach(participant => {
        participant.audioTrackPublications.forEach(publication => {
          if (publication.audioTrack) {
            const audioElement = publication.audioTrack.attachedElements[0] as HTMLAudioElement;
            if (audioElement) {
              audioElement.muted = newMutedState;
            }
          }
        });
      });
      setState(prev => ({ ...prev, isMuted: newMutedState }));
    }
  }, [state.isHost, state.isMuted, config.roomId]);

  useEffect(() => {
    hasAttemptedRef.current = false;
  }, [config.roomId]);

  useEffect(() => {
    if (config.enabled && !state.isConnected && !state.isConnecting && !state.error && !hasAttemptedRef.current) {
      connect();
    }
  }, [config.enabled, state.isConnected, state.isConnecting, state.error, connect]);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    toggleAudioMute,
  };
}
