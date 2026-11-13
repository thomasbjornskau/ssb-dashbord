# Dashbord i SSB

Veiledere om dashbord i Statistisk sentralbyrå (del A–E), med figurer og utfyllbare arbeidsark til kurset «Datavisualisering og dashbord».

> **Utkast.** Veilederne er ikke vedtatt som retningslinjer i SSB.

## Innhold

| Mappe eller fil | Hva |
|---|---|
| `docs/a-hvorfor.md` … `docs/e-bygge-prototypen.md` | De fem veilederne, ett dokument per del. Vedlegg B1 ligger i `docs/b1-ni-formal.md` |
| `docs/figurer/` | Konseptfigurene som SVG (1920 × 1080), navngitt etter figurnummer |
| `docs/kurs/` | Kursoversikten og de tolv arbeidsarkene, med arkene som SVG og PNG i `docs/kurs/ark/` |
| `docs/assets/` | Stil (`ssb.css`) og skriptet som lagrer og eksporterer svarene på arbeidsarkene (`ark.js`) |
| `mkdocs.yml` | Oppsett for nettstedet og menyen |
| `.github/workflows/pages.yml` | Bygger nettstedet og publiserer det på GitHub Pages ved hver push til `main` |

## Publisere

1. Lag et nytt repo på GitHub og last opp innholdet i denne mappen.
2. Gå til **Settings → Pages** og velg **GitHub Actions** som kilde.
3. Push til `main`. Nettstedet ligger på `https://<bruker>.github.io/<repo>/` etter et par minutter.
4. Sett inn adressen i `site_url` og `repo_url` i `mkdocs.yml`.

## Se nettstedet lokalt

```
pip install -r requirements.txt
mkdocs serve
```

Åpne http://127.0.0.1:8000.

## Redigere

- **Tekst:** rediger markdown-filene i `docs/`. Overskrifter med `#` blir menyen til høyre.
- **Figur:** bytt SVG-filen i `docs/figurer/` og behold filnavnet. Bildeteksten står i markdown-filen.
- **Arbeidsark:** feltene er HTML inne i markdown-filene i `docs/kurs/`. Hvert felt har en nøkkel (`data-k`). Ikke endre nøklene etter at arkene er tatt i bruk, ellers finner ikke nettleseren igjen svarene deltakerne har skrevet.

## Arbeidsarkene og personvern

Svarene lagres i nettleserens `localStorage` på deltakerens egen maskin. Ingenting sendes til GitHub eller noe annet sted. Deltakerne kan laste ned svarene som markdown, ta sikkerhetskopi som JSON og hente den inn igjen på en annen maskin. Skriv ikke inn opplysninger som ikke er publisert.
