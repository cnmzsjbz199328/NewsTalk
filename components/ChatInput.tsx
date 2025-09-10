import React from 'react';

interface ChatInputProps {
  userInput: string;
  onUserInput: (value: string) => void;
  onInject: () => void;
  onStart: () => void;
  onStop: () => void;
  isRunning: boolean;
  isConnecting: boolean; // New prop for connection state
  isNewsDriven: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ userInput, onUserInput, onInject, onStart, onStop, isRunning, isConnecting, isNewsDriven }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onInject();
    }
  };

  const startButtonText = isConnecting
    ? 'Connecting...'
    : isNewsDriven
    ? 'Start News Cycle'
    : 'Start Debate';

  return (
    <div className="p-4 border-t border-bunker-200 dark:border-bunker-800 bg-bunker-50 dark:bg-bunker-900">
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => onUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a debate topic or inject a mid-debate message..."
          className="flex-grow p-3 bg-white dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
        />
        <button
          onClick={onInject}
          disabled={!userInput.trim() || isRunning}
          className="px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition disabled:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Inject Topic
        </button>
        <div className="flex gap-2">
            <button
              onClick={onStart}
              disabled={isRunning || isConnecting || (!userInput.trim() && !isNewsDriven)}
              className="px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition disabled:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startButtonText}
            </button>
            <button
              onClick={onStop}
              disabled={!isRunning}
              className="px-4 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition disabled:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop
            </button>
        </div>
      </div>
    </div>
  );
};
