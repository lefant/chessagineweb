/** Chess.com public, completed-game archives. No authentication is required.
 * https://www.chess.com/announcements/view/published-data-api
 */
export interface ChessComGame {
  url: string;
  pgn: string;
  end_time: number;
  time_class: string;
  rules: string;
  white: { username: string; rating?: number };
  black: { username: string; rating?: number };
}

export async function fetchChessComGames(
  username: string,
  signal?: AbortSignal,
): Promise<ChessComGame[]> {
  const name = username.trim().toLowerCase();
  if (!name) throw new Error("Enter a Chess.com username.");
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(name)}/games`;

  async function get(url: string) {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Chess.com user "${name}" or archive not found.`);
      if (response.status === 429) throw new Error("Chess.com rate limit reached. Please wait a minute and try again.");
      throw new Error(`Could not load Chess.com games (${response.status}). Please try again.`);
    }
    return response.json();
  }

  const { archives } = await get(`${base}/archives`) as { archives: string[] };
  const games: ChessComGame[] = [];
  // Serial requests respect Chess.com's rate limits. Older months are needed
  // for inactive accounts and when the latest month has fewer than 20 games.
  for (const archive of [...archives].sort().reverse()) {
    signal?.throwIfAborted();
    const { games: monthly } = await get(archive) as { games: ChessComGame[] };
    games.push(...monthly.filter(game => game.rules === "chess" && game.pgn?.trim()));
    if (games.length >= 20) break;
  }
  return games.sort((a, b) => b.end_time - a.end_time).slice(0, 20);
}
