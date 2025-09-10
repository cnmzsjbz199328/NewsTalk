import React from 'react';
import { NewsItem } from '../types';

interface NewsPanelProps {
  newsItems: NewsItem[];
  highlightedIndex: number | null;
  isLoading: boolean;
  error: string | null;
  onItemSelect: (index: number) => void;
  isDebateRunning: boolean;
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ newsItems, highlightedIndex, isLoading, error, onItemSelect, isDebateRunning }) => {
  const activeItemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [highlightedIndex]);
  
  return (
    <div className="w-full max-w-sm h-full bg-bunker-50 dark:bg-bunker-900 border-l border-bunker-200 dark:border-bunker-800 flex flex-col">
      <h3 className="text-xl font-bold p-4 border-b border-bunker-200 dark:border-bunker-800">
        Latest News (BBC)
      </h3>
      <div className="flex-grow overflow-y-auto p-4">
        {isLoading && <div className="text-center text-bunker-500 dark:text-bunker-400">Loading news...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!isLoading && !error && newsItems.length === 0 && <div className="text-center text-bunker-500 dark:text-bunker-400">No news items found.</div>}
        <div className="space-y-2">
          {newsItems.map((item, index) => (
            <div
              key={item.title + index}
              ref={index === highlightedIndex ? activeItemRef : null}
              onClick={() => !isDebateRunning && onItemSelect(index)}
              className={`p-3 rounded-lg border transition-all duration-300 flex items-start gap-3 ${
                isDebateRunning
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer hover:bg-bunker-100 dark:hover:bg-bunker-800'
              } ${
                index === highlightedIndex
                  ? 'bg-sky-500/10 border-sky-500/30 shadow-md'
                  : 'bg-white dark:bg-bunker-800/50 border-bunker-200 dark:border-bunker-700/50'
              }`}
            >
              {item.thumbnailUrl && (
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.title}
                  className="w-20 h-14 object-cover rounded-md flex-shrink-0 border border-bunker-200 dark:border-bunker-700"
                />
              )}
              <div className="flex-grow">
                <h4 className={`font-semibold text-sm ${index === highlightedIndex ? 'text-sky-800 dark:text-sky-200' : 'text-bunker-800 dark:text-bunker-200'}`}>
                  {item.title}
                </h4>
                <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-1">
                  {new Date(item.pubDate).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-2 text-center text-xs text-bunker-400 dark:text-bunker-500 border-t border-bunker-200 dark:border-bunker-800">
        Click a topic to start a debate.
      </div>
    </div>
  );
};