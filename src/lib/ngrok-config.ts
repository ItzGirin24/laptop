import axios from 'axios';

const GITHUB_URL = 'https://raw.githubusercontent.com/ItzGirin24/abbskp/main/laptop.txt';

export async function getNgrokUrl(): Promise<string | null> {
  try {
    const response = await axios.get(GITHUB_URL);
    const url = response.data.trim();

    // Validate URL format
    if (url && url.startsWith('https://') && url.includes('.ngrok.io')) {
      return url;
    }

    console.warn('Invalid ngrok URL format:', url);
    return null;
  } catch (error) {
    console.error('Failed to fetch ngrok URL from GitHub:', error);
    return null;
  }
}

export async function getApiBaseUrl(): Promise<string> {
  // Try to get ngrok URL first
  const ngrokUrl = await getNgrokUrl();

  if (ngrokUrl) {
    return `${ngrokUrl}/api`;
  }

  // Fallback to localhost
  console.log('Using localhost fallback');
  return 'http://localhost:5001/api';
}

// Cache the URL to avoid repeated requests
let cachedUrl: string | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedApiBaseUrl(): Promise<string> {
  const now = Date.now();

  if (cachedUrl && (now - cacheTime) < CACHE_DURATION) {
    return cachedUrl;
  }

  cachedUrl = await getApiBaseUrl();
  cacheTime = now;

  return cachedUrl;
}
