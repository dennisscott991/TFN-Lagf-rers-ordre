# IRFMI – Lagførers minimumsordre v2.7

Statisk GitHub Pages-app for milsim. Lim inn en full 5-punktsordre på engelsk, velg 1-Papa, 2-Papa, 3-Papa eller 4-Papa, og få en kort norsk IRFMI/minimumsordre.

## Nytt i v2.7

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


## Nytt i v2.7
- Maks 3 linjer per IRFMI-punkt.
- Lange fiendebeskrivelser fjernes eller kortes kraftig ned.
- Informasjon som ikke påvirker valgt lag prioriteres bort.
- Metode og iverksettelse bruker korte kommandoord som Fremrykk, Følg, Rydd, Sikre, Bryt inn, Hold og Meld.
- Egen DIREKTE OPPGAVE-boks er fjernet; oppgaven flettes inn i M – Metode for mindre opplesning.


## Nytt i v2.7
- Cache-busting på app.js og style.css slik at GitHub Pages laster nyeste versjon.
- Ingen egen 'Direkte oppgave'-boks.
- Maks 2 linjer i Innledning, Retning, Formasjon og Iverksettelse; maks 3 i Metode.
- Hver linje forkortes til ca. 95 tegn.
- Strengere bortfiltrering av lange fiendebeskrivelser og informasjon som ikke påvirker valgt lag.


## Nytt i v2.7
- Ingen ord-for-ord-maskinoversettelse.
- Omskriver engelske ordrelinjer til standardiserte norske kommandoer.
- Hopper over lange fiendebeskrivelser og overordnet hensikt som ikke påvirker valgt lag.
- Maks 2/2/2/3/2 korte linjer i IRFMI.
