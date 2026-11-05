# Seguretat

## Versions mantingudes

Les correccions de seguretat s’apliquen a la branca `main` i a l’última versió publicada. Les versions anteriors poden no rebre actualitzacions.

## Informar d’un problema

No publiquis una vulnerabilitat ni un document `.minut.json` real en una incidència pública. Contacta el mantenidor de forma privada a `sabatesduran@gmail.com` amb:

- versió i plataforma afectades;
- impacte possible;
- passos mínims per reproduir-ho;
- un fitxer sintètic sense dades personals, si és necessari.

Rebràs una confirmació quan s’hagi pogut revisar l’informe. No comparteixis públicament els detalls fins que hi hagi una correcció o s’hagi acordat una data de divulgació.

## Model de seguretat

min no té comptes ni backend. Els documents, preferències i checklists viuen localment i es comparteixen només per acció explícita. Els fitxers importats es validen abans d’escriure a SQLite i els textos es tracten com a text, no com a HTML.

La protecció del dispositiu i de les còpies exportades depèn del sistema operatiu i del lloc on l’usuari les desi. min no anuncia xifrat d’extrem a extrem.
