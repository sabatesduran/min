# Contribuir a min

Gràcies per voler millorar **min**. És una app local-first per compartir el minut a minut d’una colla sense comptes, backend ni connexió obligatòria.

## Principis del projecte

- Les dades de l’usuari es queden al dispositiu fins que decideix exportar-les.
- No afegim analítica, publicitat, identificadors remots ni dependències de pagament per defecte.
- Una còpia rebuda és de consulta; per editar-la cal duplicar-la.
- No presentem una revisió com a sincronitzada o actualitzada si no en tenim evidència.
- La interfície principal és en català i els textos d’usuari han de ser clars i no tècnics.
- Accessibilitat, funcionament sense cobertura i integritat de les dades formen part de la funcionalitat.

## Preparar l’entorn

Requisits: Node.js 24, npm 11 i, per a builds natives, Xcode o Android Studio.

```bash
npm ci
npm start
```

Les superfícies natives com widgets i Live Activity necessiten una development build:

```bash
npx expo prebuild
npx pod-install ios
npm run start:dev-client
```

## Abans d’obrir una proposta

```bash
make check
npm run doctor
```

Qualsevol canvi de domini o persistència ha d’incloure proves. Els canvis de widgets, avisos, importació de fitxers o Live Activity també s’han de validar en un dispositiu real; una previsualització web no és suficient.

Amb una build instal·lada i [Maestro](https://maestro.mobile.dev/) disponible, els recorreguts bàsics es poden executar amb:

```bash
maestro test .maestro
```

## Estructura

- `src/domain/`: regles pures, contractes i validació.
- `src/db/`: SQLite, migracions, revisions i backups.
- `src/app/`: rutes i pantalles Expo Router.
- `src/features/`: importació, exportació, avisos i superfícies natives.
- `src/ui/`: components i tokens visuals.
- `src/widgets/`: widgets i Live Activity.
- `web/`: landing i generador web.

## Propostes i incidències

Explica el problema d’usuari abans de descriure la solució. Per a errors, indica plataforma, versió del sistema, passos de reproducció i si passa sense cobertura o amb permisos denegats. No adjuntis documents reals que continguin noms, telèfons o informació privada.

Abans d’obrir una pull request:

1. crea una branca amb un nom descriptiu;
2. limita el canvi al problema que vols resoldre;
3. afegeix o actualitza proves quan canviï el comportament;
4. executa `make check` i `npm run doctor`;
5. explica què canvia, per què i com ho has validat.

Totes les persones que participen en el projecte han de respectar el [codi de conducta](CODE_OF_CONDUCT.md).

En enviar una contribució, acceptes que es publiqui sota la mateixa llicència MIT del projecte. La llicència no concedeix drets sobre la marca ni els recursos identificats a [TRADEMARKS.md](TRADEMARKS.md).
