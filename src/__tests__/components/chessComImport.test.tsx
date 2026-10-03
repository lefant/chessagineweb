import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserGameSelect from "@/componets/lichess/UserGameSelect";
import { Chess } from "chess.js";

const pgn = '[White "Alice"]\n[Black "Bob"]\n[Result "1-0"]\n\n1. e4 {[%clk 0:09:59]} c5 2. Nf3 d6 1-0';
const json = (data: unknown) => ({ ok: true, json: async () => data });

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

async function open(loadPGN = jest.fn()) {
  render(<UserGameSelect provider="Chess.com" loadPGN={loadPGN} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Chess.com Game" }));
  fireEvent.change(screen.getByLabelText("Chess.com Username"), { target: { value: "Alice" } });
  fireEvent.click(screen.getByRole("button", { name: "Load games" }));
}

it("loads a selected PGN unchanged, including clocks, and closes the dialog", async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(json({ archives: ["https://api.chess.com/pub/player/alice/games/2026/01"] }))
    .mockResolvedValueOnce(json({ games: [{
      url: "https://www.chess.com/game/live/123", pgn, rules: "chess", end_time: 1767225600,
      time_class: "rapid", white: { username: "Alice", rating: 1234 }, black: { username: "Bob", rating: 1456 },
    }] }));
  const loadPGN = jest.fn((text: string) => {
    const chess = new Chess();
    chess.loadPgn(text);
    expect(chess.history()).toEqual(["e4", "c5", "Nf3", "d6"]);
  });
  await open(loadPGN);
  fireEvent.click(await screen.findByRole("button", { name: /Alice \(1234\) vs Bob \(1456\)/ }));
  expect(loadPGN).toHaveBeenCalledWith(pgn);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(JSON.parse(localStorage.getItem("chesscom-username")!)).toBe("Alice");
});

it("shows an empty state and allows retry after an error", async () => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 429 })
    .mockResolvedValueOnce(json({ archives: [] }));
  await open();
  expect(await screen.findByRole("alert")).toHaveTextContent(/rate limit/i);
  fireEvent.click(screen.getByRole("button", { name: "Load games" }));
  expect(await screen.findByText(/No completed standard chess games/)).toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

it("cancels on username changes and ignores late responses from the old account", async () => {
  let resolve!: (value: unknown) => void;
  (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await open();
  const signal = (global.fetch as jest.Mock).mock.calls[0][1].signal;
  expect(screen.getByRole("status")).toHaveAccessibleName("Loading Chess.com games");
  fireEvent.change(screen.getByLabelText("Chess.com Username"), { target: { value: "Bob" } });
  expect(signal.aborted).toBe(true);
  await act(async () => { resolve(json({ archives: [] })); });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("aborts requests when the dialog closes", async () => {
  (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
  await open();
  const signal = (global.fetch as jest.Mock).mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(signal.aborted).toBe(true));
});

it("keeps Lichess as the default provider", () => {
  render(<UserGameSelect loadPGN={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Lichess Game" }));
  expect(screen.getByLabelText("Lichess Username")).toBeInTheDocument();
  expect(screen.queryByLabelText("Chess.com Username")).not.toBeInTheDocument();
});
