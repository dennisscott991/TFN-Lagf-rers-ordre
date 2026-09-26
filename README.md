# IRFMI – Lagførers minimumsordre v2.3

Statisk GitHub Pages-app for milsim. Lim inn en full 5-punktsordre på engelsk, velg 1-Papa, 2-Papa, 3-Papa eller 4-Papa, og få ut en kort norsk IRFMI/minimumsordre.

## Nytt i v2.3
- Full automatisk oversettelse av utvalgte IRFMI-linjer fra engelsk til norsk.
- Lokal militær terminologi brukes som fallback hvis oversettelsestjenesten ikke svarer.
- Kallesignal og typiske militære tokens som OBJ, RP, PL, ORP, CASEVAC, ROE, PID, NLT, CH og klokkeslett forsøkes beholdt uendret.
- Valgbar nettoversettelse: slå av avkrysningsboksen hvis teksten ikke skal sendes til ekstern oversettelsestjeneste.

## GitHub Pages
Last opp `index.html`, `style.css`, `app.js` og `README.md` til roten av repositoryet. Aktiver deretter GitHub Pages fra `Settings -> Pages -> Deploy from a branch -> main -> /(root)`.

## Personvern
Når "Full automatisk oversettelse til norsk" er aktivert, sendes kun de tekstlinjene appen har valgt ut til IRFMI-en til MyMemory Translation API for oversettelse. Når funksjonen er slått av, behandles alt lokalt i nettleseren.
