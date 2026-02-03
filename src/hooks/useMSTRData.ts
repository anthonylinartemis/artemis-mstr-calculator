import useSWR from 'swr';
import { fetchCombinedData, type CombinedData } from '../lib/api';
import { REFRESH_INTERVAL } from '../lib/constants';

export function useMSTRData() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CombinedData>(
    'mstr-combined-data',
    fetchCombinedData,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Dedupe requests within 10s
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data,
    isLoading,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    lastUpdated: data ? new Date() : null,
    source: data?.source ?? 'unknown',
  };
}
