# Relatório de QA — Jogo da Velha

> Protótipo de Jogo da Velha (Tic-Tac-Toe), construído e testado como exercício prático de QA aplicado desde a primeira linha de código.
> Site publicado: [gustavoanderson.github.io/qa-automation-lab/tic-tac-toe](https://gustavoanderson.github.io/qa-automation-lab/tic-tac-toe/)

## 1. O que foi construído

Um jogo da velha para dois jogadores (X e O), jogado no mesmo dispositivo, em HTML/CSS/JavaScript puro (sem frameworks ou dependências externas), com placar de vitórias/empates. Arquivos:

- `index.html` — estrutura da página, tabuleiro e placar
- `style.css` — layout e estilo visual
- `script.js` — lógica do jogo e do placar
- `cypress.config.js` / `cypress/e2e/tic-tac-toe.cy.js` — suíte de testes automatizados
- `package.json` — dependência do Cypress e scripts para rodar o projeto localmente

## 2. Como foi desenvolvido

### Decisão de arquitetura central: estado como única fonte de verdade

O array `boardState` (9 posições, `null`/`"X"`/`"O"`) é a **única fonte de verdade** do jogo. A tela nunca é lida para decidir o que fazer a seguir — ela só *reflete* o estado. Essa decisão evita uma classe inteira de bugs comuns em jogos simples, onde a interface e o estado real "descolam" um do outro.

O **placar** (`score = { X, O, draws }`) foi implementado como um estado **separado e independente** do tabuleiro, de propósito: reiniciar uma partida (`resetGame`) não deve zerar o histórico de vitórias — só `resetScore` (botão "Zerar placar") faz isso.

### Guardas de QA aplicadas diretamente no código

| Risco identificado | Como foi tratado |
|---|---|
| Clicar em célula já ocupada, sobrescrevendo a jogada | Checagem `boardState[index] !== null` antes de qualquer escrita |
| Clicar em qualquer célula depois que o jogo já terminou | Flag `gameOver`, checada antes de aceitar qualquer clique |
| Clique duplo/rápido na mesma célula | Botão desabilitado (`disabled = true`) assim que recebe uma jogada — bloqueio nativo do navegador, não apenas lógica em JS |
| Resultado permitir jogadas residuais | `endGame()` desabilita **todas** as células, inclusive as vazias |
| Estado "preso" após reiniciar | `resetGame()` restaura os 9 elementos (texto, `disabled`, classes, `aria-label`) |
| Placar zerar junto com o tabuleiro (comportamento indesejado) | Placar implementado como estado separado — `resetGame()` nunca toca em `score` |
| Placar creditar o jogador errado | Incremento usa `currentPlayer` **antes** da troca de turno, no exato momento da vitória |

### Acessibilidade considerada desde o início

- Células e botões de ação são `<button>` nativos — focáveis e ativáveis por teclado sem código extra.
- `aria-live="polite"` no status **e** no placar — leitores de tela anunciam mudanças automaticamente.
- `aria-label` de cada célula é atualizado dinamicamente com a marcação.
- Indicador visual de foco (`:focus-visible`) em todos os elementos interativos.
- Alvo de toque mínimo de 60×60px nas células.

## 3. O que foi efetivamente testado (não só revisado)

### Testes automatizados da lógica (Node.js, isolados do DOM)

**17 casos, todos passando**, antes da publicação de cada funcionalidade:
- 12 casos da lógica de vitória/empate (8 combinações, tabuleiro vazio, jogo em andamento, quase-vitória, vitória de O)
- 5 casos da lógica de placar (zerado inicial, incremento de X, incremento de O, incremento de empate, zerar placar)

Verificações estruturais: sintaxe de `script.js` validada (`node --check`), 9 células com índices únicos confirmados.

### Teste manual em navegador real (GitHub Pages)

Cenários testados ao vivo — **todos com resultado correto**:

| Cenário testado | Resultado |
|---|---|
| Jogada válida em célula vazia | Marca o jogador correto e alterna a vez |
| Célula ocupada (clique simples e duplo) | Nenhuma alteração |
| Vitória (linha completa) | Mensagem + destaque verde nas 3 células corretas |
| Clique após fim de jogo | Tabuleiro travado, mesmo em células vazias |
| Reiniciar jogo | Tudo volta ao estado inicial |
| Navegação somente por teclado (Tab + Enter) | Foco visível, Enter marca, foco pula célula desabilitada automaticamente |
| Partida terminando em empate | Mensagem correta, sem falso destaque de vitória |

## 4. O que ainda não foi testado (limitação conhecida, declarada com honestidade)

- **Placar**: lógica validada isoladamente (Node) e cobrance por testes Cypress escritos — mas **ainda não observado ao vivo no navegador**, diferente do restante do jogo.
- **Suíte Cypress**: escrita e com sintaxe validada, mas **não executada** neste ambiente (ver seção 5) — precisa ser rodada localmente para confirmar que passa de verdade.
- Não foi testado em múltiplos navegadores (só Chrome até agora) nem em dispositivos móveis reais.
- Leitura de tela real (NVDA/VoiceOver) não foi verificada ao vivo — só a estrutura de `aria-live`/`aria-label` foi revisada no código.

## 5. Suíte de testes automatizados com Cypress

Suíte criada (`cypress/e2e/tic-tac-toe.cy.js`) cobrindo, de forma automatizada e repetível, os cenários já validados manualmente, expandindo a cobertura de vitória para **as 8 combinações possíveis** testadas via interface real (clique a clique, não só lógica pura):

- Estado inicial, jogada válida, célula ocupada (inclusive clique duplo forçado)
- As 8 combinações de vitória, com verificação de mensagem e destaque visual
- Empate sem falso destaque
- Travamento total do tabuleiro após o fim do jogo
- Reinício completo do jogo
- Jogada via teclado (foco + Enter)
- Estrutura de acessibilidade (`aria-live`, `aria-label` dinâmico)
- **Placar**: começa zerado, incrementa o vencedor certo, incrementa empates sem mexer em X/O, permanece acumulado ao reiniciar o jogo, zera com o botão dedicado

Pequena captura de QA durante a escrita dos testes: o parágrafo de status não tinha `data-testid`, diferente dos outros elementos — corrigido no `index.html` para manter consistência e testabilidade.

### ⚠️ Limitação declarada com honestidade: a suíte foi escrita e teve a sintaxe validada, mas **não foi executada** neste ambiente

Ao tentar instalar o Cypress (`npm install`), o registro do npm retornou erro 403 (`host_not_allowed`) — uma restrição de rede do ambiente de desenvolvimento usado para montar este projeto, não um problema do Cypress ou do código em si. **Os testes foram escritos com o mesmo rigor de sempre, mas eu não consegui de fato rodá-los e confirmar que todos passam.**

Para rodar de verdade (recomendado antes de considerar essa suíte "confiável"):

```bash
cd tic-tac-toe
npm install
npm start          # sobe o jogo em http://localhost:8080 (em outro terminal)
npm run cy:open    # ou "npm run cy:run" para rodar sem interface
```

Assim que você rodar localmente, me conte o resultado (ou cole a saída do terminal) para eu revisar juntos.

## 6. Indicador de placar

Implementado: contadores de vitórias de X, vitórias de O e empates, exibidos abaixo do tabuleiro, com botão dedicado "Zerar placar" independente do "Reiniciar jogo". Lógica validada por 5 testes automatizados isolados (Node) e coberta por 5 testes Cypress — pendente apenas a observação ao vivo no navegador (item da seção 4) e a execução real da suíte Cypress.

## 7. Próximos passos sugeridos (para sua aprovação, não implementados ainda)

1. **Rodar a suíte Cypress localmente** e confirmar que os testes realmente passam (não pôde ser feito neste ambiente).
2. **Teste manual do placar ao vivo** no navegador, mesmo padrão já feito para o restante do jogo.
3. **Teste real com leitor de tela** (NVDA ou VoiceOver).
4. **Validação de responsividade real** em viewport mobile (Chrome DevTools/emulação).
5. **Testes de regressão visual** — screenshots do tabuleiro em pontos-chave para detectar quebras visuais futuras.
6. **Pipeline de CI** (GitHub Actions) rodando a suíte Cypress a cada push.
7. **Modo "contra o computador"** — melhoria de produto para uma próxima iteração.

## 8. Executável local (planejado, não iniciado)

Combinado com o usuário: ao final da lista de próximos passos acima, será criado um pacote simples (pasta com um atalho) que abre o jogo diretamente no navegador local do usuário, sem precisar de internet — não uma instalação tipo `.exe`.
