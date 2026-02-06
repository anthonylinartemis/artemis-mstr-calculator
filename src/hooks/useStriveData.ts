import useSWR from 'swr';

interface StriveTreasuryResponse {
  btcHoldings: number | null;
  btcValue: number | null;
  source: string;
  timestamp: string;
}

export interface StriveData {
  btcHoldings: number | null;
  btcValue: number | null;
}

async function fetchStriveTreasury(): Promise<StriveData> {
  const response = await fetch('/api/coingecko/strive-treasury');

  if (!response.ok) {
    throw new Error(`Failed to fetch Strive treasury: ${response.status}`);
  }

  const data: StriveTreasuryResponse = await response.json();

  return {
    btcHoldings: data.btcHoldings,
    btcValue: data.btcValue,
  };
}

export function useStriveData() {
  const { data, error, isLoading } = useSWR(
    'strive-treasury',
    fetchStriveTreasury,
    {
      refreshInterval: 5 * 60 * 1000, // 5 min (holdings change less often)
      revalidateOnFocus: true,
      dedupingInterval: 60000,
      errorRetryCount: 3,
    }
  );

  return {
    data: data || null,
    error,
    isLoading,
  };
}
