/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Suíte de testes E2E do Jogo da Velha.
//
// Estes testes espelham, de forma automatizada e repetível, os cenários que
// foram validados manualmente no navegador antes desta suíte existir (ver
// QA-REPORT.md). A ideia é que, a partir de agora, qualquer regressão nesses
// comportamentos seja pega automaticamente, sem depender de um teste manual
// repetido a cada mudança no código.
// ---------------------------------------------------------------------------

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
  [0, 4, 8], [2, 4, 6],            // diagonais
];

describe("Jogo da Velha", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("carrega com o tabuleiro vazio e X começando", () => {
    cy.get('[data-testid="status"]').should("have.text", "Vez do jogador X");
    cy.get(".cell").should("have.length", 9);
    cy.get(".cell").each(($cell) => {
      cy.wrap($cell).should("have.text", "").and("not.be.disabled");
    });
  });

  it("registra uma jogada válida e alterna a vez do jogador", () => {
    cy.get('[data-testid="cell-0"]').click();
    cy.get('[data-testid="cell-0"]').should("have.text", "X").and("be.disabled");
    cy.get('[data-testid="status"]').should("have.text", "Vez do jogador O");
  });

  it("ignora cliques em célula já ocupada, inclusive um segundo clique forçado", () => {
    cy.get('[data-testid="cell-0"]').click();
    cy.get('[data-testid="cell-0"]').should("have.text", "X");
    cy.get('[data-testid="status"]').should("have.text", "Vez do jogador O");

    // A célula já está desabilitada; forçamos o evento para simular uma
    // condição de corrida (ex: clique duplo muito rápido) e confirmamos que
    // nada muda — nem o valor da célula, nem a vez do jogador.
    cy.get('[data-testid="cell-0"]').click({ force: true });
    cy.get('[data-testid="cell-0"]').should("have.text", "X");
    cy.get('[data-testid="status"]').should("have.text", "Vez do jogador O");
  });

  WINNING_COMBINATIONS.forEach((combo, i) => {
    it(`detecta a vitória de X na combinação #${i} (células ${combo.join(",")})`, () => {
      const oMoves = [...Array(9).keys()].filter((idx) => !combo.includes(idx));
      let oIndex = 0;

      combo.forEach((xIndex, turnIndex) => {
        cy.get(`[data-testid="cell-${xIndex}"]`).click();
        const isLastMove = turnIndex === combo.length - 1;
        if (!isLastMove) {
          cy.get(`[data-testid="cell-${oMoves[oIndex]}"]`).click();
          oIndex += 1;
        }
      });

      cy.get('[data-testid="status"]').should("have.text", "Jogador X venceu!");
      combo.forEach((idx) => {
        cy.get(`[data-testid="cell-${idx}"]`).should("have.class", "winning-cell");
      });
    });
  });

  it("detecta empate sem marcar nenhuma célula como vencedora", () => {
    // Sequência conhecida que resulta em: X O X / X O O / O X X (sem vencedor)
    const sequence = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    sequence.forEach((idx) => cy.get(`[data-testid="cell-${idx}"]`).click());

    cy.get('[data-testid="status"]').should("have.text", "Empate!");
    cy.get(".winning-cell").should("not.exist");
  });

  it("trava todo o tabuleiro, inclusive células vazias, após o fim do jogo", () => {
    // Vitória rápida de X na linha do meio, deixando células vazias no resto do tabuleiro
    cy.get('[data-testid="cell-3"]').click(); // X
    cy.get('[data-testid="cell-0"]').click(); // O
    cy.get('[data-testid="cell-4"]').click(); // X
    cy.get('[data-testid="cell-1"]').click(); // O
    cy.get('[data-testid="cell-5"]').click(); // X vence

    cy.get('[data-testid="status"]').should("have.text", "Jogador X venceu!");

    // Célula 8 nunca foi jogada e deve estar travada mesmo assim
    cy.get('[data-testid="cell-8"]').should("be.disabled");
    cy.get('[data-testid="cell-8"]').click({ force: true });
    cy.get('[data-testid="cell-8"]').should("have.text", "");
  });

  it("reinicia o jogo corretamente após uma vitória", () => {
    cy.get('[data-testid="cell-0"]').click(); // X
    cy.get('[data-testid="cell-3"]').click(); // O
    cy.get('[data-testid="cell-1"]').click(); // X
    cy.get('[data-testid="cell-4"]').click(); // O
    cy.get('[data-testid="cell-2"]').click(); // X vence a linha de cima

    cy.get('[data-testid="status"]').should("have.text", "Jogador X venceu!");

    cy.get('[data-testid="reset-button"]').click();

    cy.get('[data-testid="status"]').should("have.text", "Vez do jogador X");
    cy.get(".winning-cell").should("not.exist");
    cy.get(".cell").each(($cell) => {
      cy.wrap($cell).should("have.text", "").and("not.be.disabled");
    });
  });

  it("permite jogar por teclado (foco na célula + Enter)", () => {
    cy.get('[data-testid="cell-0"]').focus().type("{enter}");
    cy.get('[data-testid="cell-0"]').should("have.text", "X");
    cy.get('[data-testid="status"]').should("have.text", "Vez do jogador O");
  });

  describe("Acessibilidade estrutural", () => {
    it("mantém aria-live=\"polite\" na região de status", () => {
      cy.get('[data-testid="status"]').should("have.attr", "aria-live", "polite");
    });

    it("atualiza o aria-label da célula ao ser marcada", () => {
      cy.get('[data-testid="cell-4"]').should("have.attr", "aria-label", "Célula 5");
      cy.get('[data-testid="cell-4"]').click();
      cy.get('[data-testid="cell-4"]').should(
        "have.attr",
        "aria-label",
        "Célula 5, marcada com X"
      );
    });
  });

  describe("Placar", () => {
    it("começa zerado", () => {
      cy.get('[data-testid="score-x"]').should("have.text", "X: 0");
      cy.get('[data-testid="score-o"]').should("have.text", "O: 0");
      cy.get('[data-testid="score-draws"]').should("have.text", "Empates: 0");
    });

    it("incrementa o placar do vencedor após uma vitória", () => {
      cy.get('[data-testid="cell-0"]').click(); // X
      cy.get('[data-testid="cell-3"]').click(); // O
      cy.get('[data-testid="cell-1"]').click(); // X
      cy.get('[data-testid="cell-4"]').click(); // O
      cy.get('[data-testid="cell-2"]').click(); // X vence

      cy.get('[data-testid="score-x"]').should("have.text", "X: 1");
      cy.get('[data-testid="score-o"]').should("have.text", "O: 0");
    });

    it("incrementa o placar de empates, sem alterar os placares de X e O", () => {
      const sequence = [0, 1, 2, 4, 3, 5, 7, 6, 8];
      sequence.forEach((idx) => cy.get(`[data-testid="cell-${idx}"]`).click());

      cy.get('[data-testid="score-draws"]').should("have.text", "Empates: 1");
      cy.get('[data-testid="score-x"]').should("have.text", "X: 0");
      cy.get('[data-testid="score-o"]').should("have.text", "O: 0");
    });

    it("mantém o placar acumulado ao reiniciar o jogo (só o tabuleiro reinicia)", () => {
      cy.get('[data-testid="cell-0"]').click();
      cy.get('[data-testid="cell-3"]').click();
      cy.get('[data-testid="cell-1"]').click();
      cy.get('[data-testid="cell-4"]').click();
      cy.get('[data-testid="cell-2"]').click(); // X vence

      cy.get('[data-testid="reset-button"]').click();

      cy.get('[data-testid="score-x"]').should("have.text", "X: 1");
      cy.get('[data-testid="status"]').should("have.text", "Vez do jogador X");
    });

    it('zera o placar ao clicar em "Zerar placar"', () => {
      cy.get('[data-testid="cell-0"]').click();
      cy.get('[data-testid="cell-3"]').click();
      cy.get('[data-testid="cell-1"]').click();
      cy.get('[data-testid="cell-4"]').click();
      cy.get('[data-testid="cell-2"]').click(); // X vence

      cy.get('[data-testid="score-reset-button"]').click();

      cy.get('[data-testid="score-x"]').should("have.text", "X: 0");
    });
  });
});
