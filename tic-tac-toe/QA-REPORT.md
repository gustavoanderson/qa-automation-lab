# Relatório de QA — Jogo da Velha

> Protótipo simples de Jogo da Velha (Tic-Tac-Toe), construído e testado como exercício prático de QA aplicado desde a primeira linha de código.

## 1. O que foi construído

Um jogo da velha para dois jogadores (X e O), jogado no mesmo dispositivo, em HTML/CSS/JavaScript puro (sem frameworks ou dependências externas). Arquivos:

- `index.html` — estrutura da página e do tabuleiro
- `style.css` — layout e estilo visual
- `script.js` — lógica do jogo

## 2. Como foi desenvolvido

### Decisão de arquitetura central: estado como única fonte de verdade

O array `boardState` (9 posições, `null`/`"X"`/`"O"`) é a **única fonte de verdade** do jogo. A tela nunca é lida para decidir o que fazer a seguir — ela só *reflete* o estado. Essa decisão evita uma classe inteira de bugs comuns em jogos simples, onde a interface e o estado real "descolam" um do outro (ex: a tela mostra um X que o estado interno não registrou).

### Guardas de QA aplicadas diretamente no código (não como um passo à parte)

| Risco identificado | Como foi tratado |
|---|---|
| Clicar em célula já ocupada, sobrescrevendo a jogada | Checagem `boardState[index] !== null` antes de qualquer escrita |
| Clicar em qualquer célula depois que o jogo já terminou | Flag `gameOver`, checada antes de aceitar qualquer clique |
| Clique duplo/rápido na mesma célula (ex: usuário clica duas vezes sem perceber) | O botão da célula é desabilitado (`disabled = true`) assim que recebe uma jogada — o segundo clique não gera evento algum, é bloqueio nativo do navegador, não apenas lógica em JS |
| Resultado (vitória/empate) permitir jogadas residuais | `endGame()` desabilita **todas** as células do tabuleiro, inclusive as vazias |
| Estado "preso" após reiniciar (ex: célula ainda desabilitada, marcação anterior visível) | `resetGame()` restaura os 9 elementos (texto, `disabled`, classes CSS e `aria-label`) e o estado interno igualmente |

### Acessibilidade considerada desde o início (não como retrofit)

- Células são `<button>` nativos — focáveis e ativáveis por teclado (Tab + Enter/Espaço) sem nenhum código extra.
- Região `aria-live="polite"` no status — leitores de tela anunciam automaticamente de quem é a vez e o resultado, sem o usuário precisar navegar até lá.
- `aria-label` de cada célula é atualizado dinamicamente para incluir a marcação ("Célula 5, marcada com X"), então quem usa leitor de tela sabe o estado da célula sem depender só de visão.
- Indicador visual de foco (`:focus-visible`) para quem navega por teclado.
- Tamanho mínimo de alvo de toque de 60×60px nas células — dentro da recomendação usual de acessibilidade para toque em telas pequenas.

## 3. O que foi efetivamente testado (não só revisado)

Testes automatizados (Node.js) isolando a lógica pura de detecção de vitória, sem depender do navegador — **12 casos, todos passando**:

- As 8 combinações de vitória possíveis (3 linhas, 3 colunas, 2 diagonais), uma por uma
- Tabuleiro vazio não aponta vencedor
- Uma partida em andamento com jogadas mistas não aponta vencedor falso
- Duas peças alinhadas (faltando a terceira) **não** dispara vitória prematuramente
- Vitória é detectada tanto para X quanto para O (não só o primeiro jogador testado)

Verificações estruturais adicionais:
- Sintaxe do `script.js` validada (`node --check`)
- Confirmado que o tabuleiro tem exatamente 9 células, com os 9 índices (`0`–`8`) únicos, sem duplicidade ou lacuna

## 4. O que **não** foi testado (limitação conhecida, declarada com honestidade)

- **Não houve teste manual em navegador real** nesta rodada — a lógica foi validada isoladamente (fora do DOM) e o HTML foi verificado estruturalmente, mas o comportamento visual/interativo completo (cliques reais, foco, leitura de tela de verdade) ainda não foi observado ao vivo.
- Não há testes automatizados de UI (Cypress) ainda — só da lógica pura.
- Não foi testado em múltiplos navegadores/dispositivos reais.

## 5. Próximos passos sugeridos (para sua aprovação, não implementados ainda)

Pensando à frente no projeto, essas são melhorias que eu proporia como próximos passos — nenhuma foi implementada, ficam para você decidir:

1. **Suíte de testes automatizados com Cypress** (usando a skill já pronta): cobrir exatamente os cenários deste relatório, mas agora testando o comportamento real no navegador — incluindo os `data-testid` que já deixei nos elementos (`cell-0` a `cell-8`, `reset-button`) propositalmente prontos para isso.
2. **Verificação manual em navegador real** antes/depois da publicação, para confirmar visualmente o que os testes de lógica não conseguem ver (layout, foco, leitura de tela de verdade).
3. **Indicador de placar** (quantas vitórias cada jogador teve) — melhoria de produto, não de qualidade, mas natural como segunda iteração.
