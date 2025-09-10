
import { NewsItem } from '../types';

export const fetchNews = async (feedUrl: string, useProxy: boolean, proxyUrl: string): Promise<NewsItem[]> => {
  let url = feedUrl;
  if (useProxy && proxyUrl) {
      url = proxyUrl.endsWith('=') ? proxyUrl + encodeURIComponent(feedUrl) : proxyUrl + encodeURIComponent(feedUrl);
  } else if (useProxy) {
      // Fallback if proxyUrl is somehow empty
      url = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    
    const parserError = xml.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      throw new Error('Failed to parse RSS feed. The proxy may have returned non-XML content.');
    }

    const items = Array.from(xml.querySelectorAll('item')).slice(0, 50);
    return items.map(item => ({
      title: item.querySelector('title')?.textContent ?? 'No Title',
      link: item.querySelector('link')?.textContent ?? '',
      pubDate: item.querySelector('pubDate')?.textContent ?? '',
      description: item.querySelector('description')?.textContent ?? '',
    }));
  } catch (error) {
    console.error("Failed to fetch news:", error);
    throw error;
  }
};
