import { useQuery } from '@tanstack/react-query';

interface ApiConfig {
  externalApiUrl: string;
}

export function useApiConfig() {
  const { data, isLoading, error } = useQuery<ApiConfig>({
    queryKey: ['/api/config'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
  });

  return {
    externalApiUrl: data?.externalApiUrl || '',
    isLoading,
    error,
  };
}

export function getImageUrl(imagePath: string | undefined | null, externalApiUrl: string): string {
  if (!imagePath) return '';
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Use fallback URL if externalApiUrl is not loaded yet
  const baseUrl = externalApiUrl || 'https://api.tokshoplive.com';
  const cleanPath = imagePath.replace(/^\//, '');
  return `${baseUrl}/${cleanPath}`;
}
