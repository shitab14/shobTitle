import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Languages } from 'lucide-react';

const AudioBlob = ({ audioLevel }) => {
  const baseSize = 200;
  const size = baseSize + (audioLevel * 2);

  return (
    <div
      className="relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'linear-gradient(135deg, #93c5fd 0%, #bfdbfe 50%, #7dd3fc 100%)',
        borderRadius: '50%',
        transition: 'all 75ms ease-in-out',
        filter: `blur(${5 + audioLevel/10}px)`,
        transform: `scale(${1 + audioLevel/100})`,
        boxShadow: `
          0 0 40px rgba(186, 230, 253, 0.4),
          0 0 80px rgba(186, 230, 253, 0.2),
          inset 0 0 40px rgba(255, 255, 255, 0.4)
        `,
        position: 'relative',
        zIndex: 1
      }}
    />
  );
};

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [language, setLanguage] = useState('bn-BD'); // Default to Bangla
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const mediaStream = useRef(null);
  const recognition = useRef(null);

  const initializeRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = language;

      recognition.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognition.current.onend = () => {
        if (isListening) {
          recognition.current.start();
        }
      };
    }
  };

  useEffect(() => {
    initializeRecognition();
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [language]); // Reinitialize when language changes

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;

      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();

      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);

      analyser.current.fftSize = 256;
      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!isListening) return;

        analyser.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
        setAudioLevel(average);

        requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const toggleListening = async () => {
    if (!isListening) {
      await initializeAudio();
      recognition.current?.start();
      setIsListening(true);
    } else {
      recognition.current?.stop();
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
      }
      setIsListening(false);
      setAudioLevel(0);
      setTranscript(''); // Clear transcript when stopping
    }
  };

  const toggleLanguage = () => {
    // Toggle between Bangla and English
    const newLang = language === 'bn-BD' ? 'en-US' : 'bn-BD';
    setLanguage(newLang);
    if (isListening) {
      // Restart recognition with new language if currently listening
      recognition.current?.stop();
      recognition.current?.start();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <button
          onClick={toggleLanguage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(186, 230, 253, 0.1)',
            border: '1px solid rgba(186, 230, 253, 0.2)',
            borderRadius: '0.5rem',
            color: '#e0f2fe',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.875rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(186, 230, 253, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(186, 230, 253, 0.1)'}
        >
          <Languages size={20} />
          {language === 'bn-BD' ? 'বাংলা' : 'English'}
        </button>
      </div>

      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#e0f2fe',
          marginBottom: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        সবTitle
      </h1>

      <div
        style={{
          position: 'relative',
          cursor: 'pointer',
          marginBottom: '2rem',
          transition: 'transform 0.2s',
        }}
        onClick={toggleListening}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <AudioBlob audioLevel={audioLevel} />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          {isListening ? (
            <Mic size={32} color="#1e293b" />
          ) : (
            <MicOff size={32} color="#1e293b" />
          )}
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '32rem',
          background: 'rgba(8, 47, 73, 0.5)',
          borderRadius: '0.5rem',
          padding: '1rem',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(186, 230, 253, 0.1)',
          marginTop: '1rem'
        }}
      >
        <p
          style={{
            color: '#e0f2fe',
            textAlign: 'center',
            fontSize: '1.125rem',
            minHeight: '3rem',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {transcript || (language === 'bn-BD' ?
            'শুরু করতে ব্লবটিতে ক্লিক করুন...' :
            'Click the blob to start listening...')}
        </p>
      </div>
    </div>
  );
};

export default App;