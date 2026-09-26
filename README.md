# IRFMI – Lagførers minimumsordre

Statisk GitHub Pages-app for milsim. Lim inn en full 5-punktsordre på engelsk, velg 4-Papa eller 1-Papa, og få ut en kort norsk IRFMI/minimumsordre.

## Funksjoner
- Valg mellom **4-Papa**, **1-Papa** eller eget kallesignal
- Tar inn engelsk 5-punktsordre
- Gjenkjenner `SITUATION`, `MISSION`, `EXECUTION`, `SUSTAINMENT` og `COMMAND & SIGNAL`
- Filtrerer direkte omtale av valgt lag og vanlige alias
- Lager norsk **IRFMI**:
  - **I** – Innledning
  - **R** – Retning
  - **F** – Formasjon / gruppering
  - **M** – Metode / kort plan
  - **I** – Innbrudd / ildledelse / iverksettelse
- Regelbasert oversettelse av vanlige militære/milsim-uttrykk EN → NO
- Beholder kallesignal, stedsnavn, klokkeslett, kanaler, PL/RP/OBJ osv.
- Kopier IRFMI til Discord/chat
- Utskriftsvennlig
- Alt behandles lokalt i nettleseren – ingen server eller API-nøkkel

## Publiser på GitHub Pages
1. Lag et nytt repository, eller åpne repoet du allerede bruker.
2. Last opp `index.html`, `style.css` og `app.js` til rotmappen.
3. Gå til **Settings → Pages**.
4. Velg **Deploy from a branch**.
5. Velg `main` og `/ (root)`.
6. Lagre.

## Viktig om oversettelsen
Dette er en statisk nettleserapp uten AI/API. Oversettelsen er derfor regelbasert og laget for vanlige milsim-/ordreuttrykk. Kontroller alltid resultatet mot originalordren før bruk.
