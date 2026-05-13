import { useVibeStore } from '@/lib/store';

export async function fetchOracle(commentary: string, team: string) {
  const res = await fetch('/api/oracle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentary, team }),
  });
  return res.json();
}

export function useOracle() {
  const { currentPrediction, addPoints, setPrediction } = useVibeStore();

  const handleOracleResult = (result: { vibe: number; tension: number; eventType: string }) => {
    if (!currentPrediction) return;

    let success = false;
    if (currentPrediction === 'Hype' && result.vibe >= 5) success = true;
    if (currentPrediction === 'High Tension' && result.tension >= 7) success = true;
    if (currentPrediction === 'Calm' && result.tension < 5) success = true;
    if (currentPrediction.toLowerCase() === result.eventType) success = true;

    if (success) {
      addPoints(100);
      setPrediction(null); // Reset prediction after winning
    }
  };

  return { handleOracleResult };
}
