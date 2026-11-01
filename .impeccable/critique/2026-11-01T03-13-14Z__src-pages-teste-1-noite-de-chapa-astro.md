---
target: /teste/1-noite-de-chapa/
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-11-01T03-13-14Z
slug: src-pages-teste-1-noite-de-chapa-astro
---
> ⚠️ DEGRADED: single-context (o CLAUDE.md do usuário restringe sub-agentes; avaliações A e B feitas no mesmo contexto). Detector: 0 achados.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Status aberto/fechado, aviso ao adicionar, barra com total |
| 2 | Match System / Real World | 4 | "Pra quantos?" é como o cliente pensa o pedido |
| 3 | User Control and Freedom | 3 | Remover item não tem desfazer |
| 4 | Consistency and Standards | 3 | Faixa lateral num grupo e campeão em linha própria: dois padrões de item |
| 5 | Error Prevention | 3 | Mínimo e bairro antes do WhatsApp |
| 6 | Recognition Rather Than Recall | 2 | Faixas mostram 1,5 item por grupo; o resto exige lembrar e rolar de lado |
| 7 | Flexibility and Efficiency | 2 | Sem busca nem filtro |
| 8 | Aesthetic and Minimalist Design | 3 | Cinematográfico, mas é o visual da categoria |
| 9 | Error Recovery | 3 | Bairro fora da lista tem resposta clara |
| 10 | Help and Documentation | 3 | Perguntas frequentes no fim |
| **Total** | | **30/40** | **Good** |

## Anti-Patterns Verdict
Não parece gerado: sem faísca/pincel de panfleto, foto contida com máscara linear. Reflexo de categoria de primeira ordem presente (escuro + mostarda), mantido por preservação da identidade da marca.

## Priority Issues
- **[P2] Faixas escondem o cardápio.** No celular só 1,5 lanche por grupo aparece; quem quer comparar rola de lado sem visão geral. Correção: chips de ingrediente ou um "ver todos" por grupo.
- **[P2] Peso no celular (582 KB).** As fotos de 640 px das faixas próximas entram no primeiro carregamento. Correção: `sizes` mais justo e faixas com menos itens pré-carregados.
- **[P3] Sem desfazer ao remover da sacola.**

## Persona Red Flags
- **Quem tem pressa (trem, uma mão):** não acha "frango" sem rolar as 4 faixas.
- **Primeira visita pelo Instagram:** reconhece a marca na hora; nenhum bloqueio.
- **Baixa visão / movimento reduzido:** contraste AA, zoom da abertura desligado com movimento reduzido.

## Minor Observations
- O ponto de "aberto" pulsa sem parar (para com movimento reduzido).

## Questions to Consider
- O cardápio precisa correr de lado, ou o gesto dos Stories só funciona para os destaques?
