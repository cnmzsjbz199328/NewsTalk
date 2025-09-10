import React from 'react';
import { Message, Sender } from '../types';
import { SENDER_DETAILS } from '../constants';

const MessageBubble: React.FC<{ message: Message; nowPlaying: Sender | null }> = ({ message, nowPlaying }) => {
  const { sender, text } = message;
  const details = SENDER_DETAILS[sender];
  const isSystem = sender === Sender.System;
  const isPlaying = sender === nowPlaying;

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-bunker-500 dark:text-bunker-400 bg-bunker-100 dark:bg-bunker-800 px-3 py-1 rounded-full">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col mb-4 p-4 rounded-lg border transition-all duration-300 ${details.color} ${isPlaying ? 'shadow-lg shadow-sky-500/20' : ''}`}>
      <div className="font-bold text-sm mb-1">{details.name}</div>
      <p className="text-bunker-700 dark:text-bunker-200 whitespace-pre-wrap">{text}</p>
    </div>
  );
};

const ThinkingBubble: React.FC<{ sender: Sender }> = ({ sender }) => {
  const details = SENDER_DETAILS[sender];
  return (
    <div className={`flex flex-col mb-4 p-4 rounded-lg border ${details.color}`}>
      <div className="font-bold text-sm mb-1">{details.name}</div>
      <div className="flex items-center gap-2 text-bunker-500 dark:text-bunker-400">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};


interface ChatBoxProps {
  messages: Message[];
  speaking: Sender | null; // "Thinking" state
  nowPlaying: Sender | null; // "Talking" state
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, speaking, nowPlaying }) => {
  const endOfMessagesRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, speaking]);

  return (
    <div className="flex-grow p-6 overflow-y-auto bg-white dark:bg-bunker-950">
      {messages.length === 0 && !speaking ? (
        <div className="flex items-center justify-center h-full">
            <div className="text-center text-bunker-400">
                <h2 className="text-xl font-semibold">Welcome to the AI Debate Arena</h2>
                <p className="mt-2">Start a new debate or inject a topic to begin.</p>
            </div>
        </div>
      ) : (
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} nowPlaying={nowPlaying} />)
      )}
      {speaking && <ThinkingBubble sender={speaking} />}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
