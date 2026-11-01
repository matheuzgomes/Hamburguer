---
target: /teste/3-comanda/
total_score: 35
p0_count: 0
p1_count: 0
timestamp: 2026-11-01T03-13-14Z
slug: src-pages-teste-3-comanda-astro
---
> ⚠️ DEGRADED: single-context (o CLAUDE.md do usuário restringe sub-agentes; avaliações A e B feitas no mesmo contexto). Detector: 0 achados.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Cupom ao lado soma em tempo real; contagem do filtro |
| 2 | Match System / Real World | 4 | Comanda e cupom térmico são objetos conhecidos |
| 3 | User Control and Freedom | 3 | Esc limpa a busca; remover sem desfazer |
| 4 | Consistency and Standards | 4 | Um padrão de item em toda a lista |
| 5 | Error Prevention | 3 | Mínimo na abertura e no cupom |
| 6 | Recognition Rather Than Recall | 4 | Lista completa com miniaturas e filtros visíveis |
| 7 | Flexibility and Efficiency | 4 | Busca sem acento, filtro, abas, teclado |
| 8 | Aesthetic and Minimalist Design | 3 | Limpo; personalidade só no cupom |
| 9 | Error Recovery | 3 | "Nada com 'x'" com sugestões e limpar |
| 10 | Help and Documentation | 3 | Perguntas frequentes |
| **Total** | | **35/40** | **Excellent** |

## Anti-Patterns Verdict
Risco de segunda ordem: "rápido e claro" puxa para cara de app de delivery. O cupom (mono, serrilha, carimbo) é o que separa. Sem ícone-título-texto repetido, sem eyebrow.

## Priority Issues
- **[P2] Pouco instigante para o boca a boca.** Correção: gancho visual próprio (foto do cupom "Meu pedido de hoje").
- **[P2] Fotos pequenas vendem menos.** Correção: foto maior no item em destaque.
- **[P3] "Cupom" lido como desconto:** rótulos trocados para "Ver pedido" e "Conferir e enviar".

## Persona Red Flags
- **Quem tem pressa:** melhor dos quatro.
- **Primeira visita pelo Instagram:** entende, mas não se encanta.
- **Teclado/leitor de tela:** contagem do filtro em aria-live; foco segue o item.

## Minor Observations
- A barra fixa era translúcida e deixava a lista aparecer: corrigida para opaca.

## Questions to Consider
- O que faria alguém mandar este site para um amigo, além do "Pede igual"?
