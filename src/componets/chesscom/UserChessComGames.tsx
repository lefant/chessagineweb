import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Alert, Box, Button, CircularProgress, List, ListItemButton, ListItemText, Stack, TextField, Typography } from "@mui/material";
import { ChessComGame, fetchChessComGames } from "@/libs/chesscom/api";

export default function UserChessComGames({ loadPGN, setOpen }: {
  loadPGN: (pgn: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const [username, setUsername] = useLocalStorage("chesscom-username", "");
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => { request.current?.abort(); }, []);

  const reset = () => {
    request.current?.abort();
    request.current = null;
    setGames([]);
    setLoading(false);
    setLoaded(false);
    setError("");
  };

  const load = async () => {
    reset();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const result = await fetchChessComGames(username, controller.signal);
      if (controller.signal.aborted) return;
      setGames(result);
      setLoaded(true);
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : "Could not load Chess.com games. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="body2" color="text.secondary">
        Load up to 20 recent completed standard chess games. No Chess.com login needed.
      </Typography>
      <Box component="form" onSubmit={event => { event.preventDefault(); if (!loading && username.trim()) void load(); }}>
        <Stack spacing={2}>
          <TextField
            label="Chess.com Username"
            value={username}
            onChange={event => { reset(); setUsername(event.target.value); }}
            fullWidth
            autoComplete="off"
          />
          <Button type="submit" variant="contained" disabled={loading || !username.trim()}>
            {loading ? "Loading games…" : "Load games"}
          </Button>
        </Stack>
      </Box>
      {loading && <Box role="status" aria-label="Loading Chess.com games" sx={{ textAlign: "center" }}><CircularProgress size={28} /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {loaded && games.length === 0 && <Alert severity="info">No completed standard chess games found for this username.</Alert>}
      {games.length > 0 && (
        <List aria-label="Recent Chess.com games" sx={{ maxHeight: 400, overflowY: "auto" }}>
          {games.map(game => (
            <ListItemButton key={game.url} onClick={() => { loadPGN(game.pgn); setOpen(false); }} sx={{ borderRadius: 1 }}>
              <ListItemText
                primary={`${game.white.username} (${game.white.rating ?? "?"}) vs ${game.black.username} (${game.black.rating ?? "?"})`}
                secondary={`${game.time_class} · ${new Date(game.end_time * 1000).toLocaleString()}`}
                slotProps={{ primary: { sx: { fontWeight: 600, overflowWrap: "anywhere" } } }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Stack>
  );
}
