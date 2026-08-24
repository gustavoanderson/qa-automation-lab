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

O array `boardState` (9 posições, `null`/`"X"`/`"O"`) é a **única fonte de verdade** do jogo. A tela nunca é lida para decidir o que fazer a seguir — ela só *reflete* o estado.

O **placar** (`score = { X, O, draws }`) foi implementado como um estado **separado e independente** do tabuleiro: reiniciar uma partida (`resetGame`) não zera o histórico de vitórias — só `resetScore` (botão "Zerar placar") faz isso.

### Guardas de QA aplicadas diretamente no código

| Risco identificado | Como foi tratado |
|---|---|
| Clicar em célula já ocupada, sobrescrevendo a jogada | Checagem `boardState[index] !== null` antes de qualquer escrita |
| Clicar em qualquer célula depois que o jogo já terminou | Flag `gameOver`, checada antes de aceitar qualquer clique |
| Clique duplo/rápido na mesma célula | Botão desabilitado (`disabled = true`) assim que recebe uma jogada — bloqueio nativo do navegador |
| Resultado permitir jogadas residuais | `endGame()` desabilita **todas** as células, inclusive as vazias |
| Estado "preso" após reiniciar | `resetGame()` restaura os 9 elementos (texto, `disabled`, classes, `aria-label`) |
| Placar zerar junto com o tabuleiro (indesejado) | Placar implementado como estado separado — `resetGame()` nunca toca em `score` |
| Placar creditar o jogador errado | Incremento usa `currentPlayer` **antes** da troca de turno |

### Acessibilidade considerada desde o início

- Células e botões de ação são `<button>` nativos — focáveis e ativáveis por teclado sem código extra.
- `aria-live="polite"` no status **e** no placar.
- `aria-label` de cada célula é atualizado dinamicamente com a marcação.
- Indicador visual de foco (`:focus-visible`) em todos os elementos interativos.
- Alvo de toque mínimo de 60×60px nas células.

## 3. O que foi efetivamente testado (não só revisado)

### Testes automatizados da lógica (Node.js, isolados do DOM)

**17 casos, todos passando**: 12 da lógica de vitória/empate (8 combinações, tabuleiro vazio, jogo em andamento, quase-vitória, vitória de O) + 5 da lógica de placar (zerado inicial, incremento de X, incremento de O, incremento de empate, zerar placar).

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
| **Placar: vitória de X** | Incrementa `X: 1` corretamente |
| **Placar: persistência ao reiniciar jogo** | Placar mantém `X: 1` mesmo após "Reiniciar jogo" (tabuleiro limpa, placar não) |
| **Placar: empate** | Incrementa só `Empates`, sem alterar X/O |
| **Placar: "Zerar placar"** | Zera X/O/Empates sem tocar no tabuleiro em andamento |

## 4. O que ainda não foi testado (limitação conhecida, declarada com honestidade)

- Não foi testado em múltiplos navegadores (só Chrome até agora) nem em dispositivos móveis reais.
- **Leitura de tela real** (NVDA/VoiceOver com áudio de verdade) não foi verificada ao vivo — ver seção 6 para o que foi e não foi coberto nessa frente.

## 5. Suíte de testes automatizados com Cypress

Suíte criada (`cypress/e2e/tic-tac-toe.cy.js`) cobrindo, de forma automatizada e repetível, os cenários já validados manualmente, expandindo a cobertura de vitória para **as 8 combinações possíveis** testadas via interface real:

- Estado inicial, jogada válida, célula ocupada (inclusive clique duplo forçado)
- As 8 combinações de vitória, com verificação de mensagem e destaque visual
- Empate sem falso destaque
- Travamento total do tabuleiro após o fim do jogo
- Reinício completo do jogo
- Jogada via teclado (foco + Enter)
- Estrutura de acessibilidade (`aria-live`, `aria-label` dinâmico)
- **Placar**: começa zerado, incrementa o vencedor certo, incrementa empates sem mexer em X/O, permanece acumulado ao reiniciar o jogo, zera com o botão dedicado

Pequena captura de QA durante a escrita dos testes: o parágrafo de status não tinha `data-testid` — corrigido no `index.html` para manter consistência e testabilidade.

### ✅ Execução real confirmada via CI (GitHub Actions)

O ambiente onde este projeto foi desenvolvido tinha uma restrição de rede que impedia `npm install` (erro 403 `host_not_allowed` no registro do npm) — então a suíte não pôde ser executada ali. A solução: um workflow do GitHub Actions (`.github/workflows/cypress.yml`) que instala e roda a suíte de verdade nos servidores do GitHub, sem essa restrição.

Na primeira tentativa, a action de Cypress falhou por um motivo diferente e real: seu mecanismo de cache de dependências exige um lockfile (`package-lock.json`), que também não pôde ser gerado no ambiente de desenvolvimento. Corrigido separando a instalação (`npm install` manual) da execução dos testes.

**Resultado real da execução (GitHub Actions, run #3, commit `b10a384`)**:

```
22 passing (8s)
```

**22 de 22 testes passando, 0 falhas**, rodando em um navegador Chrome real, nos servidores do GitHub — não é mais uma limitação, é uma suíte validada de ponta a ponta. Vídeos da execução são salvos automaticamente como artefato do workflow a cada run.

O workflow roda automaticamente a cada `push` na pasta `tic-tac-toe/` (ou pode ser disparado manualmente pela aba Actions do repositório).

### ✅ Cypress Cloud configurado e confirmado

Foi criado um projeto dedicado no Cypress Cloud (`qa-automation-lab-tic-tac-toe`, Project ID `pzgdmc`, separado do projeto já usado por outro repositório) e o workflow foi ajustado para gravar automaticamente lá quando o segredo `CYPRESS_RECORD_KEY` estiver presente no repositório.

**Confirmação real de gravação** (run manual, commit `47b87e9`): o log mostrou `(Uploaded Cloud Artifacts) — Test Replay - Done Uploading 323 kB`, e o dashboard em [cloud.cypress.io](https://cloud.cypress.io) reflete a execução completa — 22 passed / 0 failed, ligada ao commit e ao run do GitHub Actions, com **Test Replay navegável individualmente por teste** (não apenas vídeo bruto — permite inspecionar comandos, DOM e rede de cada teste após a execução).

## 6. Revisão de acessibilidade

### O que foi verificado ao vivo (via automação de navegador)

- **Ordem de tabulação completa**: `cell-0` → `cell-1` → ... → `cell-8` → `reset-button` → `score-reset-button`, sem pular nenhum elemento e sem paradas inesperadas.
- **Sem "prisão de foco"**: pressionar Tab a partir do último botão faz o foco sair corretamente da página — uma prisão de foco (o teclado ficar "preso" dentro do jogo) seria um bug real de acessibilidade.
- **`aria-live="polite"`** confirmado, direto no DOM ao vivo, tanto na região de status quanto na do placar.
- **Foco de células desabilitadas é automaticamente pulado** pelo navegador — comportamento nativo de `<button disabled>`, sem necessidade de código extra.

### ⚠️ Limitação declarada com honestidade

Não tenho um leitor de tela (NVDA/VoiceOver) rodando de verdade neste ambiente — não é uma ferramenta que eu consigo operar diretamente. O que foi feito acima confirma a **estrutura** que um leitor de tela usaria, mas não confirma o **áudio real** anunciado.

**Roteiro sugerido para você validar com o NVDA (gratuito, Windows)**:
1. Instale o NVDA (nvaccess.org) e abra o jogo no navegador.
2. Ligue o NVDA (Ctrl+Alt+N) e navegue até a página.
3. Use Tab para percorrer o tabuleiro — o NVDA deve anunciar "Célula 1", "Célula 2" etc., e depois de marcar, "Célula 1, marcada com X".
4. Jogue até uma vitória ou empate — o NVDA deve anunciar automaticamente a mudança no status (\`aria-live\`), sem precisar navegar até lá.
5. Jogue novamente até uma vitória — o NVDA deve também anunciar a mudança no placar.

Se algo soar estranho ou não for anunciado, me conta o que você ouviu que eu ajusto.

## 7. Próximos passos sugeridos (para sua aprovação, não implementados ainda)

1. ~~Rodar a suíte Cypress localmente~~ — ✅ feito via CI (GitHub Actions), 22/22 passando (seção 5).
2. ~~Concluir a configuração do Cypress Cloud~~ — ✅ feito: projeto dedicado criado (`qa-automation-lab-tic-tac-toe`), gravação real confirmada (Test Replay navegável por teste, dashboard em cloud.cypress.io) — ver seção 5.
3. **Teste real com leitor de tela**, seguindo o roteiro da seção 6.
4. **Validação de responsividade real** em viewport mobile (Chrome DevTools/emulação).
5. **Testes de regressão visual** — screenshots do tabuleiro em pontos-chave.
6. **Modo "contra o computador"** — melhoria de produto para uma próxima iteração.

## 8. Executável local

Pacote gerado: `JogoDaVelha-Offline.zip`, contendo:

- `index.html`, `style.css`, `script.js` — cópias dos arquivos do jogo
- `Jogar Jogo da Velha.bat` — atalho de conveniência que abre o jogo no navegador padrão
- `LEIAME.txt` — instruções de uso, incluindo aviso sobre o SmartScreen do Windows

### Decisões de QA aplicadas

- **Confirmado que o jogo já é 100% offline por natureza**: `index.html` só referencia `style.css` e `script.js`, ambos locais — nenhum CDN, nenhuma fonte externa, nenhuma chamada de rede. Isso foi verificado antes de construir qualquer coisa em cima.
- **Caminho relativo no `.bat`** (`%~dp0`, a pasta onde o próprio `.bat` está): garante que o atalho funcione não importa para onde a pasta seja movida (Área de Trabalho, Documentos, pendrive) — não fica preso a um caminho fixo do seu computador.
- **Bug real encontrado e corrigido**: o `.bat` foi criado originalmente com fim de linha estilo Unix (LF); arquivos `.bat` do Windows esperam CRLF. O Windows moderno costuma tolerar, mas é um detalhe capaz de causar comportamento inconsistente em alguns casos — corrigido antes de empacotar.
- **Aviso proativo sobre o SmartScreen do Windows**: arquivos `.bat`/`.exe` baixados da internet costumam disparar um aviso de segurança do Windows na primeira execução. Isso é comportamento padrão do sistema para qualquer arquivo baixado (não é específico deste jogo), mas documentei no `LEIAME.txt` para você não estranhar.

### ✅ O que foi testado

- Integridade do `.zip`: extraído e comparado — todos os 5 arquivos presentes, sem corrupção.
- Codificação CRLF do `.bat`: confirmada antes e depois da compactação.
- Sintaxe do comando (`start "" "%~dp0index.html"`): revisada manualmente — é a forma correta de abrir um arquivo com o programa padrão do sistema a partir de um `.bat`, com suporte a espaços no caminho.
- Estrutura de referências do `index.html`: confirmada como 100% local (sem dependência de internet).

### ⚠️ Limitação declarada com honestidade

Não tenho acesso a uma máquina Windows real para **executar** o `.bat` de fato e confirmar visualmente que ele abre o jogo — meu ambiente é Linux, sem interface gráfica Windows. Tudo acima foi validado por revisão rigorosa de sintaxe, codificação e estrutura, mas não é o mesmo que ver funcionando ao vivo. Peço que você teste na sua máquina e me avise o resultado.
