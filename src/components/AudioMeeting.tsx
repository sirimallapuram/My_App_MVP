// Audio meeting component with WebRTC integration
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { usePresence } from '../contexts/PresenceContext';
import InMeetingChat from './InMeetingChat';

interface AudioMeetingProps {
  onClose: () => void;
}

const AudioMeeting: React.FC<AudioMeetingProps> = ({ onClose }) => {
  const {
    isInMeeting,
    isMuted,
    participants,
    meetingId,
    joinMeeting,
    leaveMeeting,
    toggleMute,
    setSpeaking
  } = useChat();
  
  const { activeChannel } = usePresence();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context and microphone
  useEffect(() => {
    if (isInMeeting) {
      initializeAudio();
    } else {
      cleanupAudio();
    }

    return () => {
      cleanupAudio();
    };
  }, [isInMeeting]);

  // Monitor speaking status
  useEffect(() => {
    if (isInMeeting && !isMuted) {
      startAudioLevelMonitoring();
    } else {
      stopAudioLevelMonitoring();
    }

    return () => {
      stopAudioLevelMonitoring();
    };
  }, [isInMeeting, isMuted]);

  const initializeAudio = async () => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // Set up audio context for level monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up audio element
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
      }

      setIsConnecting(false);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsConnecting(false);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    stopAudioLevelMonitoring();
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let isCurrentlySpeaking = false;

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = average / 255;

      setAudioLevel(level);

      // Determine if user is speaking (threshold can be adjusted)
      const speakingThreshold = 0.1;
      const wasSpeaking = isCurrentlySpeaking;
      isCurrentlySpeaking = level > speakingThreshold;

      if (wasSpeaking !== isCurrentlySpeaking) {
        setIsSpeaking(isCurrentlySpeaking);
        setSpeaking(isCurrentlySpeaking);
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsSpeaking(false);
    setSpeaking(false);
  };

  const handleJoinMeeting = () => {
    if (activeChannel) {
      joinMeeting(activeChannel.id);
    }
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    onClose();
  };

  const handleToggleMute = () => {
    toggleMute();
  };

  const getParticipantStatus = (participant: any) => {
    if (participant.isSpeaking) return 'speaking';
    if (participant.isMuted) return 'muted';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'speaking': return 'bg-green-500';
      case 'muted': return 'bg-red-500';
      case 'active': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'speaking': return 'Speaking';
      case 'muted': return 'Muted';
      case 'active': return 'Active';
      default: return 'Unknown';
    }
  };

  if (!isInMeeting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Join Audio Meeting
            </h3>
            <p className="text-gray-600 mb-6">
              Start an audio meeting in #{activeChannel?.name || 'this channel'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinMeeting}
                disabled={isConnecting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Join Meeting'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Meeting Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Audio Meeting
            </h2>
            <p className="text-sm text-gray-600">
              Meeting ID: {meetingId}
            </p>
          </div>
          <button
            onClick={handleLeaveMeeting}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Leave meeting"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Participants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
          {participants.map((participant) => {
            const status = getParticipantStatus(participant);
            return (
              <div
                key={participant.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(status)}`}></div>
                </div>

                {/* Participant Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {participant.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getStatusText(status)}
                  </p>
                </div>

                {/* Speaking indicator */}
                {participant.isSpeaking && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Mute/Unmute Button */}
          <button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Audio Level Indicator */}
          {!isMuted && (
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(audioLevel * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Meeting Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} in meeting
        </div>

        {/* Hidden audio element for microphone access */}
        <audio ref={audioRef} autoPlay muted />
      </div>

      {/* In-Meeting Chat */}
      <InMeetingChat
        meetingId={meetingId || ''}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
};

export default AudioMeeting;
