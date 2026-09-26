# IRFMI – Lagførers minimumsordre v2.4

Statisk GitHub Pages-app for milsim. Lim inn en full 5-punktsordre på engelsk, velg 1-Papa, 2-Papa, 3-Papa eller 4-Papa, og få en kort norsk IRFMI/minimumsordre.

## Nytt i v2.4

- Knappen heter nå **Generer IRFMI**.
- Sterkere filtrering som vurderer sammenheng, ikke bare enkeltord.
- Bedre gjenkjenning av kallesignalvarianter som `4-Papa`, `4 PAPA`, `PAPA 4` og `4P`.
- Bedre uthenting fra både MISSION og EXECUTION.
- Bedre IRFMI-fordeling for:
  - I – Innledning
  - R – Retning
  - F – Formasjon / gruppering
  - M – Metode / kort plan
  - I – Innbrudd / ildledelse / iverksettelse
- Fallback-logikk dersom et punkt ikke er tydelig formulert som egen ordrelinje.
- Valgfri full EN → NO-oversettelse av de utvalgte linjene.

## GitHub Pages

Last opp `index.html`, `style.css`, `app.js` og `README.md` i roten av repositoryet.
