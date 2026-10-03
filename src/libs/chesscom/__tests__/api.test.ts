import { fetchChessComGames } from "../api";

const base = "https://api.chess.com/pub/player/test-player/games";
const game = (id: number, rules = "chess", pgn = "1. e4 e5 *") => ({
  url: `https://www.chess.com/game/live/${id}`,
  end_time: id,
  rules,
  pgn,
  time_class: "rapid",
  white: { username: "Test-Player", rating: 1234 },
  black: { username: "Opponent", rating: 1456 },
});
const json = (data: unknown) => ({ ok: true, json: async () => data });

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.restoreAllMocks(); });

it("walks archives newest first, filters unsupported games, sorts and caps at 20", async () => {
  const fetchMock = global.fetch as jest.Mock;
  fetchMock
    .mockResolvedValueOnce(json({ archives: [`${base}/2025/11`, `${base}/2026/01`, `${base}/2026/02`] }))
    .mockResolvedValueOnce(json({ games: [game(100), game(110, "chess960"), game(120, "chess", "")] }))
    .mockResolvedValueOnce(json({ games: Array.from({ length: 25 }, (_, i) => game(i + 1)) }));

  const controller = new AbortController();
  const games = await fetchChessComGames(" Test-Player ", controller.signal);
  expect(games.map(g => g.end_time)).toEqual([100, ...Array.from({ length: 19 }, (_, i) => 25 - i)]);
  expect(games[0].pgn).toBe("1. e4 e5 *");
  expect(games[0].white.rating).toBe(1234);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    `${base}/archives`, `${base}/2026/02`, `${base}/2026/01`,
  ]);
  for (const [, options] of fetchMock.mock.calls) expect(options.signal).toBe(controller.signal);
});

it("returns an empty list for an account without archives", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(json({ archives: [] }));
  expect(await fetchChessComGames("test-player")).toEqual([]);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it.each([[404, /not found/i], [429, /wait/i], [500, /try again/i]])(
  "reports HTTP %s without pretending the account has no games", async (status, message) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status });
    await expect(fetchChessComGames("test-player")).rejects.toThrow(message);
  }
);

it("rejects an empty username without a request", async () => {
  await expect(fetchChessComGames("  ")).rejects.toThrow(/username/i);
  expect(global.fetch).not.toHaveBeenCalled();
});

it("propagates cancellation rather than returning partial games", async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(json({ archives: [`${base}/2026/01`] }))
    .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
  await expect(fetchChessComGames("test-player")).rejects.toHaveProperty("name", "AbortError");
});
