// ---------------------------------------------------------------------------
// Jogo da Velha — lógica principal
//
// Decisão de arquitetura importante para QA: o array `boardState` é a ÚNICA
// fonte de verdade do jogo. O DOM (o que aparece na tela) é sempre um reflexo
// do estado, nunca o contrário. Isso evita uma classe inteira de bugs onde a
// tela e o estado real do jogo "descolam" um do outro.
// ---------------------------------------------------------------------------

const cells = Array.from(document.querySelectorAll(".cell"));
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");
const scoreResetBtn = document.getElementById("score-reset");
const scoreEls = {
  X: document.querySelector('[data-testid="score-x"]'),
  O: document.querySelector('[data-testid="score-o"]'),
  draws: document.querySelector('[data-testid="score-draws"]'),
};

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
  [0, 4, 8], [2, 4, 6],            // diagonais
];

let boardState = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;

// O placar é um estado separado do tabuleiro, de propósito: reiniciar uma
// partida (resetGame) não deve zerar o histórico de vitórias, só o board.
let score = { X: 0, O: 0, draws: 0 };

function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);

  // Guarda de QA #1: impede jogar em célula já ocupada.
  // Guarda de QA #2: impede jogar depois que o jogo já terminou (vitória/empate).
  // As duas condições protegem contra cliques rápidos/duplos que poderiam
  // sobrescrever uma jogada ou continuar o jogo após o resultado final.
  if (gameOver || boardState[index] !== null) {
    return;
  }

  makeMove(index, cell);
}

function makeMove(index, cell) {
  boardState[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer === "X" ? "mark-x" : "mark-o");

  // Desabilitar o botão nativo é a proteção mais forte contra clique duplo:
  // mesmo que dois eventos de clique cheguem quase juntos, o segundo clique
  // em um <button disabled> simplesmente não dispara o evento.
  cell.disabled = true;
  cell.setAttribute("aria-label", `Célula ${index + 1}, marcada com ${currentPlayer}`);

  const winningLine = checkWinner();
  if (winningLine) {
    endGame(`Jogador ${currentPlayer} venceu!`, winningLine);
    return;
  }

  if (boardState.every((value) => value !== null)) {
    endGame("Empate!");
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusEl.textContent = `Vez do jogador ${currentPlayer}`;
}

function checkWinner() {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return combo;
    }
  }
  return null;
}

function endGame(message, winningLine) {
  gameOver = true;
  statusEl.textContent = message;

  // Trava todo o tabuleiro ao final — inclusive células vazias — para
  // impedir qualquer jogada residual depois que o jogo já acabou.
  cells.forEach((cell) => {
    cell.disabled = true;
  });

  if (winningLine) {
    winningLine.forEach((i) => cells[i].classList.add("winning-cell"));
    // currentPlayer ainda é quem acabou de jogar (a troca de turno só
    // acontece depois dessa checagem em makeMove), então é seguro
    // creditar a vitória a ele aqui.
    score[currentPlayer] += 1;
  } else {
    score.draws += 1;
  }

  updateScoreboard();
}

function updateScoreboard() {
  scoreEls.X.textContent = `X: ${score.X}`;
  scoreEls.O.textContent = `O: ${score.O}`;
  scoreEls.draws.textContent = `Empates: ${score.draws}`;
}

function resetScore() {
  score = { X: 0, O: 0, draws: 0 };
  updateScoreboard();
}

function resetGame() {
  boardState = Array(9).fill(null);
  currentPlayer = "X";
  gameOver = false;
  statusEl.textContent = "Vez do jogador X";

  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.classList.remove("mark-x", "mark-o", "winning-cell");
    cell.setAttribute("aria-label", `Célula ${index + 1}`);
  });
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
resetBtn.addEventListener("click", resetGame);
scoreResetBtn.addEventListener("click", resetScore);
