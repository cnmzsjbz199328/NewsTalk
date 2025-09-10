// FIX: Implement the main App component to create a functional application.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatBox } from './components/ChatBox';
import { ChatInput } from './components/ChatInput';
import { NewsPanel } from './components/NewsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { connectToDebaters, getTomResponse, getMarkResponse, getSamResponse } from './services/aiDebateService';
import { fetchNews } from './services/newsService';
import { generateSpeech } from './services/ttsService';
import { Message, NewsItem, Sender, Settings, Turn } from './types';
import { NEWS_FEED_URL, USE_PROXY, CORS_PROXY_URL, SENDER_DETAILS } from './constants';
import { RefreshIcon } from './components/icons';

const DEBATERS: Sender[] = [Sender.Tom, Sender.Mark, Sender.Sam];
const DEBATER_FNS = {
    [Sender.Tom]: getTomResponse,
    [Sender.Mark]: getMarkResponse,
    [Sender.Sam]: getSamResponse,
};

// The number of turns to keep in the pipeline buffer
const PIPELINE_BUFFER = 2;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [settings, setSettings] = useState<Settings>({
    contextTurns: 4,
    charLimit: 280,
    speechVolume: 100,
    speechRate: 100,
    autoPlay: true,
    debateRounds: 5,
    tomVoice: SENDER_DETAILS[Sender.Tom].voice,
    markVoice: SENDER_DETAILS[Sender.Mark].voice,
    samVoice: SENDER_DETAILS[Sender.Sam].voice,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isNewsCycleMode, setIsNewsCycleMode] = useState(false);
  const [speaking, setSpeaking] = useState<Sender | null>(null); // "Thinking" animation
  const [nowPlaying, setNowPlaying] = useState<Sender | null>(null); // "Talking" highlight

  const [isConnecting, setIsConnecting] = useState(false);
  const [areModelsConnected, setAreModelsConnected] = useState(false);
  
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  
  const [turnQueue, setTurnQueue] = useState<Turn[]>([]);
  const turnCounterRef = useRef(0);
  
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(0);
  
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSettingsVisible, setIsSettingsVisible] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeChange = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const loadNews = useCallback(async () => {
    setIsNewsLoading(true);
    setNewsError(null);
    try {
      const items = await fetchNews(NEWS_FEED_URL, USE_PROXY, CORS_PROXY_URL);
      setNewsItems(items);
      if (items.length > 0) {
        setSelectedNewsIndex(0);
      }
    } catch (error) {
      setNewsError('Failed to fetch news. The proxy might be down.');
      console.error(error);
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const addMessage = useCallback((sender: Sender, text: string) => {
    const newMessage: Message = { id: Date.now().toString() + Math.random(), sender, text };
    setMessages(prev => [...prev, newMessage]);
  },[]);
  
  const getVoiceForSender = (sender: Sender): string => {
      switch (sender) {
          case Sender.Tom: return settings.tomVoice;
          case Sender.Mark: return settings.markVoice;
          case Sender.Sam: return settings.samVoice;
          default: return '';
      }
  };
  
  const playAudio = useCallback((src: string | null): Promise<void> => {
    return new Promise((resolve) => {
        if (!src || !audioRef.current || !settings.autoPlay) {
            resolve();
            return;
        }
        audioRef.current.src = src;
        audioRef.current.volume = settings.speechVolume / 100;
        audioRef.current.playbackRate = settings.speechRate / 100;
        
        const onEnded = () => {
            if(audioRef.current) {
                audioRef.current.removeEventListener('ended', onEnded);
                audioRef.current.removeEventListener('error', onEnded);
            }
            resolve();
        };
        audioRef.current.addEventListener('ended', onEnded);
        audioRef.current.addEventListener('error', (e) => {
            console.error("Audio playback error:", e);
            onEnded(); // Resolve promise even if playback fails
        });
        
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed to start:", e);
            onEnded();
        });
    });
  }, [settings.speechVolume, settings.speechRate, settings.autoPlay]);

  const handleStop = useCallback((byUser = true) => {
    setIsRunning(false);
    setIsNewsCycleMode(false);
    isRunningRef.current = false;
    setTurnQueue([]);
    setSpeaking(null);
    setNowPlaying(null);
    turnCounterRef.current = 0;
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
    }
    if (byUser) {
        addMessage(Sender.System, 'Debate stopped by user.');
    }
    setIsSettingsVisible(true);
  }, [addMessage]);


  // --- PRODUCER 1: Text Generation ---
  useEffect(() => {
    const textProducer = async () => {
        if (!isRunningRef.current) return;

        const maxTurns = settings.debateRounds * DEBATERS.length;
        const queuedTurns = turnQueue.length;
        const currentTurnNumber = turnCounterRef.current + queuedTurns;

        if (currentTurnNumber < maxTurns && queuedTurns < PIPELINE_BUFFER) {
            const nextSender = DEBATERS[currentTurnNumber % DEBATERS.length];
            const turnId = Date.now().toString() + Math.random();

            setTurnQueue(prev => [...prev, { id: turnId, sender: nextSender, text: null, audioSrc: null, status: 'pending_text' }]);
            setSpeaking(nextSender);

            try {
                const responseText = await DEBATER_FNS[nextSender](messagesRef.current, settings);
                if (!isRunningRef.current) return;
                
                setTurnQueue(prev => prev.map(t => t.id === turnId ? { ...t, text: responseText, status: 'text_ready' } : t));
            } catch (error) {
                console.error(`Error getting response from ${nextSender}:`, error);
                if (isRunningRef.current) {
                    addMessage(Sender.System, `Error from ${nextSender}. Stopping debate.`);
                    handleStop(false);
                }
            } finally {
                if(isRunningRef.current && speaking === nextSender) {
                   setSpeaking(null);
                }
            }
        }
    };
    const timeoutId = setTimeout(textProducer, 100); // Add a small delay to prevent rapid-fire execution
    return () => clearTimeout(timeoutId);
  }, [turnQueue, isRunning, settings, addMessage, handleStop, speaking]);


  // --- PRODUCER 2: Audio Generation ---
  useEffect(() => {
    const audioProducer = async () => {
        if (!isRunningRef.current || !settings.autoPlay) return;
        
        const turnForAudio = turnQueue.find(t => t.status === 'text_ready');
        if (turnForAudio && turnForAudio.text) {
            const { id, text, sender } = turnForAudio;
            
            setTurnQueue(prev => prev.map(t => t.id === id ? { ...t, status: 'pending_audio' } : t));

            try {
                const audioSrc = await generateSpeech(text, getVoiceForSender(sender));
                if (!isRunningRef.current) return;

                setTurnQueue(prev => prev.map(t => t.id === id ? { ...t, audioSrc, status: 'audio_ready' } : t));
            } catch (error) {
                console.error(`Error generating speech for ${sender}:`, error);
                if(isRunningRef.current) {
                    addMessage(Sender.System, `TTS Error for ${sender}. Continuing without audio for this turn.`);
                    setTurnQueue(prev => prev.map(t => t.id === id ? { ...t, audioSrc: null, status: 'audio_ready' } : t));
                }
            }
        }
    };
    audioProducer();
  }, [turnQueue, isRunning, settings.autoPlay, addMessage]);


  // --- CONSUMER: UI and Audio Playback ---
  useEffect(() => {
    const consumer = async () => {
        if (!isRunningRef.current || nowPlaying) return;

        const turnToPlay = turnQueue[0];
        if (turnToPlay && turnToPlay.status === 'audio_ready') {
            const { sender, text, audioSrc } = turnToPlay;
            
            if (text) {
                setNowPlaying(sender);
                addMessage(sender, text);
                
                await playAudio(audioSrc);
                if (!isRunningRef.current) return;
                
                turnCounterRef.current++;
                setNowPlaying(null);
                setTurnQueue(prev => prev.slice(1));
                
                const maxTurns = settings.debateRounds * DEBATERS.length;
                if (isRunningRef.current && turnCounterRef.current >= maxTurns) {
                   addMessage(Sender.System, `Debate on "${messagesRef.current[0].text.substring(14, 54)}..." concluded after ${settings.debateRounds} rounds.`);
                   
                   if (isNewsCycleMode) {
                        const nextNewsIndex = (selectedNewsIndex ?? -1) + 1;
                        if (nextNewsIndex < newsItems.length) {
                           addMessage(Sender.System, `Starting next debate...`);
                           setSelectedNewsIndex(nextNewsIndex);
                           const nextNewsItem = newsItems[nextNewsIndex];
                           const nextTopic = `The debate is about this news story: "${nextNewsItem.title}". Here is a summary: ${nextNewsItem.description}`;
                           startDebate(nextTopic);
                        } else {
                           addMessage(Sender.System, "News cycle complete. All topics have been debated.");
                           handleStop(false);
                        }
                   } else {
                       handleStop(false);
                   }
                }
            } else {
                // If text is null for some reason, just skip the turn
                setTurnQueue(prev => prev.slice(1));
            }
        }
    };
    consumer();
  }, [turnQueue, isRunning, nowPlaying, settings.debateRounds, addMessage, playAudio, handleStop, isNewsCycleMode, newsItems, selectedNewsIndex]);

  const startDebate = (topic: string) => {
      setMessages([]);
      setTurnQueue([]);
      turnCounterRef.current = 0;

      addMessage(Sender.System, `Debate Topic: ${topic}`);

      setIsRunning(true);
      isRunningRef.current = true;
  };

  const handleStart = async () => {
    if (isRunning || isConnecting) return;

    if (!areModelsConnected) {
      setIsConnecting(true);
      addMessage(Sender.System, 'Connecting to AI debaters...');
      try {
        await connectToDebaters();
        setAreModelsConnected(true);
        addMessage(Sender.System, 'Connection successful! Starting debate...');
      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown connection error occurred.';
        addMessage(Sender.System, `Failed to connect to models: ${errorMessage}`);
        setIsConnecting(false);
        return;
      } finally {
        setIsConnecting(false);
      }
    }
    
    let topic = userInput.trim();

    if (selectedNewsIndex !== null && newsItems[selectedNewsIndex]) {
      setIsNewsCycleMode(true);
      setIsSettingsVisible(false);
      const newsItem = newsItems[selectedNewsIndex];
      topic = `The debate is about this news story: "${newsItem.title}". Here is a summary: ${newsItem.description}`;
    } else if (topic) {
        setIsNewsCycleMode(false);
    } else {
        setIsNewsCycleMode(false);
        addMessage(Sender.System, `No topic provided. Starting a general debate.`);
        topic = "the future of artificial intelligence";
    }
    
    startDebate(topic);
  };
  

  const handleInject = () => {
    if (!userInput.trim()) return;
    addMessage(Sender.System, `A new point has been injected into the debate: "${userInput}"`);
    setUserInput('');
  };

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const handleNewsItemSelect = (index: number) => {
    setSelectedNewsIndex(index);
  };

  return (
    <div className="flex h-screen font-sans bg-bunker-100 dark:bg-bunker-950 text-bunker-800 dark:text-bunker-200 overflow-hidden">
      <audio ref={audioRef} />
      <div className={`flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${isSettingsVisible ? 'w-96' : 'w-0'}`}>
        <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} theme={theme} onThemeChange={handleThemeChange} />
      </div>
      <main className="flex-grow flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b border-bunker-200 dark:border-bunker-800 bg-bunker-50 dark:bg-bunker-900">
          <h1 className="text-2xl font-bold text-bunker-900 dark:text-bunker-100">
            AI Debate Arena
          </h1>
          <button onClick={loadNews} disabled={isNewsLoading} className="p-2 rounded-full hover:bg-bunker-200 dark:hover:bg-bunker-700 disabled:opacity-50 disabled:cursor-wait transition">
            <RefreshIcon className={`w-5 h-5 ${isNewsLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>
        <div className="flex-grow flex overflow-hidden">
          <div className="flex-grow flex flex-col">
            <ChatBox messages={messages} speaking={speaking} nowPlaying={nowPlaying} />
            <ChatInput 
              userInput={userInput}
              onUserInput={setUserInput}
              onInject={handleInject}
              onStart={handleStart}
              onStop={() => handleStop(true)}
              isRunning={isRunning}
              isConnecting={isConnecting}
              isNewsDriven={selectedNewsIndex !== null}
            />
          </div>
          <NewsPanel 
            newsItems={newsItems} 
            highlightedIndex={selectedNewsIndex}
            isLoading={isNewsLoading}
            error={newsError}
            onItemSelect={handleNewsItemSelect}
            isDebateRunning={isRunning}
          />
        </div>
      </main>
    </div>
  );
};

export default App;