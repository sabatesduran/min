# min
## Pla complet de producte, disseny i construcció

**Dídac Sabatés · 4 de novembre de 2026 · Especificació 1.0**

Una app per a colles i entitats que concentra l’horari, les tasques i les persones d’un esdeveniment. Permet saber què està previst ara, què ve després i què et toca fer, també sense cobertura. Una única entrega amb tot l’abast descrit en aquest document; els passos indiquen l’ordre de construcció, no versions reduïdes del producte.

**Nom definitiu:** min, sempre en minúscules. **Frase de marca:** Tot al seu moment. **Plataformes:** iOS i Android. **Base verificada:** Expo SDK 58, publicat el 15 d’octubre de 2026, amb React Native 0.88. Dependències compatibles resoltes amb `npx expo install` i fixades al lockfile; no s’actualitzen paquets natius individualment a cegues. [1]

## 1. Decisions de producte

- Les dades són locals. No hi ha comptes, autenticació, backend, col·laboració simultània ni sincronització entre dispositius.
- Una persona prepara i crea revisions de cada document. Els participants reben una còpia de consulta, seleccionen qui són i segueixen l’horari. Les còpies rebudes no es poden editar: cal duplicar-les com a document nou.
- Qualsevol còpia rebuda es pot duplicar per editar; la duplicació crea un nou document amb un nou identificador i evita crear revisions incompatibles del document original.
- La primera entrega inclou creació i edició d’esdeveniments, persones, equips, tasques, instruccions, filtres, revisions, importació, exportació, PDF, avisos locals, aparença clara/fosca, widgets i Live Activity iOS amb límits explícits.
- Un minut a minut existeix abans, durant i després de la seva finestra temporal. Acabar no elimina ni oculta el document.
- El seguiment de l’hora és automàtic. El rellotge no verifica que una activitat hagi començat o acabat realment.
- La revisió que tens desada sempre és visible. Sense una font compartida no es pot comprovar si n’existeix una de més recent. L’app mai mostra «última versió» sense evidència.
- La interfície és en català. Tots els textos es centralitzen per poder localitzar-los sense canviar components.

## 2. Què aporta l’exemple dels Dimonis

El document aportat, de la Festa Major de Sant Martí de Teià del 9 de novembre de 2024, conté activitats simultànies, diversos responsables per tasca, tasques generals, torns de barra, notes llargues, camps pendents d’assignar i activitats «en acabar» una altra. La jornada s’allarga fins a la matinada del dia següent.

Això obliga a suportar més d’una tasca prevista en el mateix instant, responsables identificats per ID, subapartats de funcions i instruccions vinculades. La demo fa servir una selecció representativa d’aquests continguts. Les hores de final no presents al PDF, algunes agrupacions i les checklists s’han afegit exclusivament per demostrar el disseny. No es presenta la demo com una transcripció operativa completa.

La versió final de l’app no incorpora un importador automàtic de PDFs arbitraris ni una API d’IA. Es creen tasques amb l’editor, es poden enganxar notes i es pot adjuntar un PDF de referència local si es decideix incloure’l al dispositiu. L’intercanvi estructurat entre usuaris fa servir el format min.

## 3. Inici i selecció automàtica

Cada esdeveniment té `startsAt`, `endsAt` i `timeZone`. És actiu si `startsAt <= now < endsAt`. La finestra es defineix amb dates i hores completes. Un esdeveniment de dissabte a les 08:00 fins diumenge a les 06:00 és un únic minut a minut.

En un llançament normal, sense enllaç ni fitxer d’entrada:

1. Si només hi ha un esdeveniment actiu, obre el seu Ara.
2. Si hi ha diversos actius i el darrer seleccionat continua actiu, obre’l i mostra el selector a la capçalera amb l’indicador de diversos actius.
3. Si hi ha diversos actius sense selecció vàlida, mostra un selector amb el primer suggerit i el botó «Obre aquest min». Ordre: preferit actiu, inici més recent, títol i ID com a desempat estable.
4. Si no hi ha actius, mostra Els teus minuts amb el pròxim en primer lloc. Si només hi ha passats, mostra l’arxiu. Si no hi ha documents, mostra l’estat buit.
5. Obrir explícitament un fitxer, un avís o un enllaç intern té prioritat sobre la selecció automàtica. No es redirigeix l’usuari mentre està llegint un altre document o editant.

L’estat es recalcula en obrir, en tornar a primer pla, en canviar el rellotge/zona del dispositiu i en travessar una frontera d’inici o final amb l’app visible. El temporitzador s’alinea amb la pròxima frontera, es neteja en sortir i no substitueix els timestamps persistits. No cal tenir l’app executant-se en segon pla perquè un esdeveniment sigui considerat actiu la pròxima vegada que s’obre.

En acabar el document consultat, mostra «Finalitzat» i manté la pantalla. Un banner permet anar a un altre actiu. En un llançament nou s’apliquen de nou les regles anteriors. La preferència d’esdeveniment no selecciona ni canvia la identitat de persona.

## 4. Navegació completa

Tres destinacions contextuals: **Ara**, **Agenda** i **Equip**. La biblioteca **Esdeveniments** queda fora de les pestanyes i s’obre des de la capçalera. Preferències s’obre des de la capçalera; el mode **Prepara** només apareix en documents propis o duplicats.

| Pantalla | Contingut i accions |
|---|---|
| Benvinguda | Marca, proposta breu, Crear, Importar i Provar la demo. La demo és temporal i queda fora de la biblioteca. Sense registre. |
| Inici buit | Explicació breu, crear document, importar fitxer. |
| Selector d’actius | Actius ara, selecció recordada, accés a tots els documents. |
| Ara | Hora, estat, activitats previstes actuals, pròximes tasques, filtre i revisió. |
| Agenda | Dies i matinada, llista temporal, activitats simultànies, notes dependents. |
| Detall de tasca | Horari, lloc, responsables, funcions, notes, checklist personal, editar. |
| Esdeveniments | Actius, pròxims i passats; cercar, crear, importar, duplicar i eliminar localment. |
| Abans de començar | Data d’inici i consulta completa. No es mostra un estat En directe. |
| Finalitzat | Consulta i arxiu; sense compte enrere negatiu ni seguiment antic. |
| Directori de persones | Persones i equips de l’entitat/document seleccionat, cerca i alta. |
| Fitxa de persona | Nom, equips, funcions, tasques assignades i selecció Soc jo. |
| Qui ets? | Selecció local explícita, desambiguació de noms i opció Encara no ho sé. |
| Crear o editar document | Títol, entitat, zona, dates i hores, color i notes generals. |
| Editor d’agenda | Llista ordenada, alta, duplicació, edició, moviment dins del mateix moment i publicació. |
| Editor de tasca | Tipus temporal, inici/final, lloc, responsables, equips, funcions i notes. |
| Publicar i compartir | Revisió, resum, fitxer estructurat, full general i full personal en PDF. |
| Importació i revisió | Validació, comparació, canvis que t’afecten, acceptar o cancel·lar. |
| Preferències | Identitat, avisos, seguiment, aparença, dades locals i informació. |
| Seguiment iOS | Tot/les meves/desactivat, estat actiu, caducat, denegat i sessió acabada. |
| Dades i recuperació | Exportació de seguretat, importació, confirmació d’eliminació i resultat. |

El prototip web agrupa diverses pantalles com a fulls desplegables i deixa provar les interaccions principals. Els permisos, avisos i presentacions d’iOS són previsualitzacions de disseny; no s’executen en un navegador.

## 5. Ara, agenda i semàntica del temps

**Ara.** Mostra totes les tasques amb interval explícit que inclouen l’instant actual. Si hi ha diverses tasques, la primera targeta destaca les teves; les altres continuen visibles amb la mateixa hora. El text diu «Ara, segons l’horari». Mai es dedueix que només hi pot haver una activitat en curs.

**Després.** Agrupa totes les tasques amb la mateixa pròxima hora rellevant. La primera targeta pot resumir-ne una i indicar «+2 al mateix moment». La pàgina de detall mostra el grup. Si no queden tasques, mostra «Tot el que tenies previst per avui ja ha passat».

**Tasques puntuals.** Una tasca sense final és una fita, no un interval infinit. A la seva hora apareix a «A aquesta hora» durant una finestra de lectura de 10 minuts; després queda a «Fa poc» amb el text «Previst a les HH:mm». El valor és una regla de presentació documentada, no una durada real. No es marca com a feta automàticament.

**Intervals.** Requereixen final posterior a inici, admeten canviar de dia i tenen límits [inici, final). A l’hora exacta de final ja no es mostren com a actuals. Un responsable amb dues assignacions superposades genera un avís a l’editor, amb opció de conservar-les.

**En acabar.** Una tasca relativa referencia una altra amb `afterTaskId`, sense inventar-li una hora exacta. Apareix just després de la tasca pare a l’agenda i com a instrucció contextual al detall. No s’inicia automàticament pel simple pas de l’hora. No hi ha estat de finalització compartit. Es prohibeixen cicles i referències inexistents.

**Dates.** Persistir instants ISO amb offset i zona IANA de l’esdeveniment. Fer servir un adaptador Temporal amb suport de zona, mai una conversió basada en el mes. Davant una hora inexistent per canvi d’horari d’estiu, demanar-ne una de vàlida; davant una hora duplicada, permetre escollir l’offset. Mostrar sempre hores de l’esdeveniment. Si el dispositiu té una altra zona, indicar-la discretament.

**Consulta.** Agenda no salta sola quan l’usuari està llegint. El botó «Torna a ara» situa la llista al moment corresponent. En un primer accés a un document actiu s’enfoca el moment actual; futurs al principi i passats al principi amb accés al final.

## 6. Persones, equips i identitat

Cada persona té un ID estable, nom visible, cognoms o etiqueta de desambiguació, equips i color d’inicials. No es demanen correu, contrasenya, data de naixement ni foto. Els noms es poden repetir. Un canvi de nom conserva assignacions i preferències perquè es resolen per ID.

El directori principal mostra l’entitat seleccionada i permet canviar de context; es pot cercar entre els documents desats, mantenint visible l’entitat de procedència. Els participants importats no es fusionen per coincidència de nom. Una persona de dues entitats conserva identitats contextuals separades. «Soc jo» es desa per document/entitat i mai es transfereix a una altra entitat silenciosament.

Una tasca pot tenir diverses persones, diversos equips i funcions concretes: Enceses, Carro pirotècnia o Repartidors. Les assignacions a equips es resolen amb la composició publicada a la mateixa revisió del document. Les funcions sense responsable continuen visibles com «Per assignar».

El filtre té Tothom i Les meves, i una persona alternativa es pot inspeccionar temporalment sense canviar «Soc jo». Les meves inclou assignacions directes i d’equip. L’opció «Inclou activitats de tota la colla» és independent i està activada per defecte. Les tasques sense responsable no es converteixen automàticament en activitats comunes: el creador ho marca explícitament.

Eliminar una persona mostra les tasques afectades i exigeix reassignar-les o deixar-les pendents. Si una revisió rebuda elimina la persona seleccionada, es conserva el document, es desactiven els seus avisos antics i es pregunta qui és ara l’usuari.

## 7. Creació, edició i publicació

L’editor treballa sobre un esborrany local autosalvat. La còpia publicada continua disponible com a referència immutable. El botó de compartir ofereix la darrera revisió publicada; si hi ha canvis sense publicar, ofereix publicar-los abans de compartir.

El document inclou títol, nom de l’entitat, dates completes, zona horària, color d’accent triat dins de la paleta i notes generals. La data final és obligatòria. Si una tasca queda fora de la finestra de l’esdeveniment, l’editor ofereix ampliar-la o corregir la tasca abans de publicar.

Cada tasca permet títol, categoria/equip, inici puntual o interval, dependència En acabar, lloc, persones, funcions, activitat comuna, notes i checklist. Es pot duplicar conservant contingut però creant un ID nou. Les tasques d’una mateixa hora tenen un ordre editorial explícit; canviar-ne l’ordre no altera les hores.

La publicació valida dates, referències, camps obligatoris, identificadors únics i dependències. Mostra avisos de superposició, persones sense tasques i rols sense assignar sense impedir publicar quan siguin intencionats. Títol buit, final anterior a inici, cicles i referències trencades sí que bloquegen.

Publicar incrementa `revision` i crea un resum de canvis a partir del document publicat anterior. No s’utilitza l’hora del telèfon com a número de versió. La revisió inclou `publishedAt`, `documentId` i la versió de l’esquema. Es preserven totes les revisions rebudes/publicades localment amb una política de retenció visible; exportar abans d’esborrar l’historial és possible.

No hi ha botó «Retarda tot 15 minuts» compartit en aquesta entrega. Es poden ajustar hores i tornar a publicar. Un canvi d’horari només afecta altres persones quan importen la revisió.

## 8. Compartició i revisions

El format d’intercanvi és un JSON UTF-8 amb extensió `.minut.json`, MIME `application/json` i associació de documents/deep links a l’app. L’enllaç intern `min://event/{documentId}` només identifica un document ja importat; no descarrega contingut ni serveix com a enllaç de compartició universal. No es genera un QR que aparenti descarregar un document quan no existeix cap allotjament.

El full de compartir del sistema envia el fitxer per WhatsApp, AirDrop, correu o Fitxers. També es poden exportar un PDF general i un PDF personal amb data, entitat, revisió, notes i indicació que és una còpia. Una còpia de seguretat local inclou documents i preferències amb una advertència clara abans d’incloure-les; el fitxer compartit amb la colla exclou preferències personals.

La importació obre primer una previsualització, mai sobreescriu directament. Comprova mida màxima de 2 MB per document de text, esquema, dates, 1.000 tasques i 500 persones com a límits de producte, IDs únics, referències, dependències i longitud dels camps. Els textos es tracten com a text, no HTML. Es rebutgen URLs actives i fitxers incrustats executables; els enllaços de notes s’obren només després d’una acció explícita.

Regles d’acceptació:

- Document nou: importar i preguntar identitat; si és actiu, obrir Ara.
- Mateix document i revisió superior: resum de canvis, tasques que t’afecten i confirmació. Una transacció substitueix les dades publicades i conserva les preferències per ID.
- Mateixa revisió i contingut idèntic: no crear duplicat.
- Mateixa revisió i contingut diferent: advertir del conflicte i conservar les dues còpies sense escollir-ne una silenciosament.
- Revisió inferior: no retrocedir per defecte. Es pot consultar com a còpia històrica sense substituir la vigent.
- Esquema desconegut: explicar que cal actualitzar l’app, sense perdre la còpia actual.

Després d’acceptar una revisió, es cancel·len els avisos afectats, es recalcula el seguiment i es conserva la posició de lectura si la tasca encara existeix. L’app mostra «V3 · Importada a les 17:42», no un indicador verd de sincronització. No pot confirmar qui ha rebut o llegit un fitxer. Les marques Feta i les checklists són personals i no es comparteixen.

## 9. Avisos, widgets i Live Activities

**Avisos locals.** Opcions cap, 5, 10 o 15 minuts abans; filtre propi Totes / Les meves amb comunes opcionals. Permís demanat després d’activar l’opció, no a la benvinguda. Agrupar tasques simultànies per evitar una ràfega d’avisos. Programar una finestra de pendents compatible amb els límits del sistema; si no hi caben tots, indicar l’abast programat. Cancel·lar i reprogramar en importar revisions, canviar persona, editar hores o eliminar documents. No dependre d’un timer JavaScript en segon pla. El sistema pot silenciar o ajornar presentacions segons permisos i modes del dispositiu.

**Widgets.** Widget petit de pròxima tasca i mitjà d’Ara + Després. Les dades es calculen a l’app i es transfereixen al contenidor compartit. La timeline d’un widget és diferent de l’actualització d’una Live Activity; la seva presentació segueix el pressupost i les polítiques del sistema. No es promet exactitud al segon.

**Live Activity iOS.** Preferència Desactivada / Tot / Les meves, independent del filtre visible. El disseny inclou pantalla bloquejada, Dynamic Island compacta/mínima/expandida, contingut antic, denegació i final de sessió. Es limita a una activitat seguida per l’app per no saturar el sistema. Payload curt: ID, revisió, tasca o grup, títol curt, lloc, intervals i pròxima tasca; les notes completes es consulten a l’app.

`expo-widgets` ofereix creació, inici, actualització, recuperació i finalització de Live Activities; requereix development build i no funciona a Expo Go. L’API consultada exposa `start(props, url, staleDate)`, `update(props, staleDate)` i `getInstances()`. No exposa un mètode documentat per programar tots els futurs canvis de contingut. [2]

Apple limita una Live Activity a 8 hores activa i fins a 4 hores addicionals de permanència a la pantalla bloquejada. Programar l’inici amb l’API nativa disponible no equival a programar totes les actualitzacions futures; a més, les activitats programades compten dins dels límits del sistema. [3][4]

**Comportament concret sense backend:** s’inicia o reprèn el seguiment quan l’app és visible i l’usuari l’activa; s’actualitza a cada frontera temporal mentre hi ha execució. Es fixa `staleDate` a la primera frontera on el contingut pot deixar de ser cert, i es fa servir `environment.isStale` per substituir el contingut actiu per «Obre min per continuar». Un compte enrere natiu pot continuar avançant, però això no substitueix actualitzacions arbitràries de títol o responsable. Després de 8 hores cal iniciar una altra sessió des d’un context permès.

A l’abast complet client-only, l’activació automàtica de l’esdeveniment dins de l’app sí que queda garantida per càlcul local. Una Live Activity que canviï sola cada tasca amb l’app suspesa durant tota una jornada de 22 hores no queda garantida. El producte incorpora l’estat caducat i el recorregut per reprendre, no amaga aquesta limitació ni fa servir ubicació o àudio per mantenir l’app desperta. Les tasques de fons les decideix iOS i no ofereixen una agenda exacta. [5]

Android incorpora avisos i widgets equivalents dins de les capacitats del sistema; no s’anomena Live Activity ni es mostra una Dynamic Island fictícia. Si el sistema denega funcionalitats natives, consultar l’agenda continua funcionant.

## 10. Identitat i sistema visual

**Logo revisat.** Wordmark `min` amb lletres gruixudes, irregulars i lleugerament saltadores. Una espurna llima substitueix el punt de la i. La proposta generada s’ha refet després de descartar el primer monograma rígid. El nom és el logo: no es col·loca un altre «min» tipogràfic al costat del wordmark.

**Direcció.** Jove, editorial i enèrgica. El component lúdic queda en marca, composició i estats buits; els horaris es mantenen molt clars. No hi ha rellotges decoratius, mascotes, avatars dibuixats ni gradients de fons. Les mostres aportades orienten la llegibilitat temporal i l’ús de superfícies suaus, però no es reprodueixen les seves composicions ni components distintius.

| Token | Valor | Ús |
|---|---|---|
| brand.blue | #3947F5 | Marca, tasca actual, acció principal |
| accent.now | #D8FA67 | Pròxima tasca i indicador actiu, text tinta |
| canvas.paper | #F6F4EC | Fons principal clar |
| text.ink | #20221F | Text principal |
| text.secondary | #6C706A | Metadades secundàries |
| surface.soft | #EAEDE4 | Controls, agrupacions discretes |
| accent.lilac | #E7E4FF | Identitat i suport |
| accent.peach | #F8DCCA | Informació contextual i sense connexió |
| dark.canvas | #191C1C | Fons nocturn |
| dark.surface | #252A26 | Superfícies nocturnes |

Tipografia nativa de sistema a iOS/Android; titulars amb pes 700 i tracking lleugerament negatiu, cos de 16 punts, metadades mínimes de 12 punts en producció. Hores monoespaiades amb dígits tabulars. El prototip usa una sans local per reproduir el caràcter. Escala: 12, 14, 16, 20, 26, 34 i 42. No es redueix el text principal per fer-lo cabre.

Espaiat basat en 4 punts: 4, 8, 12, 16, 20, 24, 32 i 40. Marges de pantalla de 20 punts; amples màxims en tauleta i orientacions grans. Radis: 12 per inputs, 16 per botons, 22-24 per targetes destacades i 28 per fulls. Ombres mínimes només en elements flotants. La navegació inferior és clara amb selecció blava, diferent de les barres negres de les referències.

La targeta Ara és blava amb text blanc, hora i lloc. Després usa llima amb text tinta. L’agenda usa una línia prima i punts; el color acompanya text/forma, mai és l’únic indicador. Les persones tenen inicials i colors discrets, sense necessitat de fotografia.

## 11. Accessibilitat, interacció i contingut

Objectius: controls tàctils mínims de 44 punts a iOS i 48 dp a Android; contrast AA; Dynamic Type/font scaling sense truncar tasques; VoiceOver i TalkBack; ordre de lectura estable; descripcions de botons d’icona; cap informació només per color; Reduce Motion respectat.

Els titulars poden partir en dues o tres línies. Les hores es llegeixen junt amb data i estat quan cal. Una tasca amb molts responsables mostra un resum i un botó accessible per desplegar tots els noms. No es fa servir una fila d’inicials com a únic accés a responsables.

Transicions de 160-220 ms per fulls i seleccions; sense pulsacions infinites del punt Live. La línia temporal manté la posició quan es tanca el detall. Confirmació hàptica curta només en accions significatives i amb respecte a les preferències del dispositiu.

Textos principals: «Som-hi, Dídac», «Ara, segons l’horari», «Les meves», «Tota la colla», «Per assignar», «En acabar», «Obre min per continuar», «Aquesta és la teva còpia». Errors expliquen el problema i l’acció possible. No es fa servir llenguatge de servidors, JSON o permisos natius si no ajuda a decidir.

Estats complets: sense documents, sense tasques, sense persona seleccionada, sense tasques personals, abans de començar, finalitzat, múltiples actius, fitxer incompatible, fitxer malmès, revisió duplicada, conflicte de revisió, esborrany amb errors, sense connexió, avisos denegats, seguiment no compatible, seguiment caducat i font de dades antiga.

## 12. Arquitectura i dades

Expo SDK 58 + React Native 0.88 + TypeScript estricte + Expo Router. SQLite és la font de veritat. Repositoris locals separen UI, persistència i lògica temporal; una llibreria petita d’estat local només conserva preferències i navegació. El temps, la selecció d’esdeveniment i el càlcul d’Ara són funcions pures amb rellotge injectat.

Paquets previstos: `expo-sqlite`, `expo-document-picker`, `expo-file-system`, `expo-sharing`, `expo-print`, `expo-notifications`, `expo-widgets`, `expo-localization`, `expo-haptics`, `react-native-safe-area-context`, `react-native-reanimated`, `react-native-svg`, validació d’esquema amb Zod i un adaptador Temporal amb zona IANA. Instal·lar paquets Expo amb `npx expo install`; comprovar les versions compatibles amb SDK 58. Builds de desenvolupament des del primer dia per comprovar extensions natives.

Estructura: `app/(tabs)/{index,agenda,people,events}.tsx`, `app/events/[id]`, `app/tasks/[id]`, `app/people/[id]`, `app/settings`, `features/{events,tasks,people,sharing,tracking}`, `domain/{time,selection,validation}`, `db/{schema,migrations,repositories}`, `ui/{tokens,components}`, `widgets/` i `locales/ca.json`.

Taules: documents, event_drafts, published_revisions, people, teams, team_members, tasks, task_assignments, role_assignments, preferences, personal_checks i notification_jobs. Una revisió rebuda s’importa en una transacció. Les preferències i checklists no viuen dins de la revisió compartida. Les migracions tenen número propi i no es confonen amb la versió del format d’intercanvi.

Camp essencial de document: `schemaVersion`, `documentId`, `revision`, `publishedAt`, `event{title,organization,startsAt,endsAt,timeZone}`, `people`, `teams`, `tasks`. Les tasques fan servir una unió discriminada puntual/interval/after. IDs UUID; horaris com a ISO amb offset; ordre estable per `sortOrder`. El hash canònic de contingut ajuda a detectar mateixa revisió amb contingut diferent, però no autentica l’autor.

No s’hi inclouen credencials ni serveis d’IA. No hi ha enviament de dades ni analítica remota per defecte. El xifrat del sistema operatiu protegeix el dispositiu; no es publicita un xifrat d’extrem a extrem que l’app no implementa.

## 13. Construcció pas per pas

**01. Crear el projecte.** Inicialitzar amb Expo SDK 58 i TypeScript. Fixar versions, gestor de paquets i lockfile. Validar `expo-doctor` i compilar una app buida de desenvolupament a iOS i Android. Resultat: base reproduïble, no dependència d’Expo Go.

**02. Incorporar la identitat.** Afegir el nou logo min, icona d’app i splash sense retallar el wordmark. Centralitzar colors, espaiats, radis, tipus i modes clar/fosc. Revisar llegibilitat de la icona petita en dispositiu. El PNG generat s’inclou com a proposta de marca; qualsevol mestre vectorial s’ha de traçar i verificar, no etiquetar una aproximació com si fos el mestre original.

**03. Definir els contractes.** Escriure tipus de document, tasca, persona, equip, rol, revisió i preferències. Preparar esquema d’importació estricte i fixtures representatives del document dels Dimonis, marcant les dades afegides a la demo.

**04. Preparar SQLite.** Crear taules, índexs i migració inicial. Implementar repositoris, transaccions d’importació, autosalvat d’esborrany i retenció d’historial. Verificar recuperació després de tancar l’app a mig esborrany.

**05. Construir el motor temporal.** Convertir dates amb zona IANA, validar canvis d’hora, classificar documents i tasques, agrupar simultanis i gestionar fites sense final. Injectar `now` per comprovar dates històriques, futurs i matinada.

**06. Implementar la selecció d’entrada.** Aplicar les regles d’un actiu, diversos actius i cap actiu; persistir selecció vàlida. Prioritzar fitxers i avisos entrants. Protegir una consulta o edició manual de redireccions inesperades.

**07. Muntar navegació i layouts.** Quatre tabs, pantalles de detall i fulls. Suportar safe areas, teclat, botó enrere Android, redimensionament, tauleta i text ampliat. Conservar posicions de lectura per document.

**08. Crear Minuts i els seus estats.** Llista amb cerca, actius/pròxims/passats, preferit, crear, importar i eliminació local amb confirmació. Dates explícites a la matinada. Si no hi ha actius, destacar el pròxim sense dir que està en directe.

**09. Construir l’editor de document.** Títol, entitat, zona, inici/final, notes i color. Validacions inline amb focus al primer error. Canviar la finestra temporal revisa les tasques que en quedarien fora.

**10. Implementar Persones i equips.** Directori contextual, cerca, altes, modificació, equips i funcions. Desambiguar noms repetits i impedir eliminacions que trenquin referències sense una decisió explícita.

**11. Implementar Qui ets.** Selecció local, consulta sense identitat i canvi posterior. Guardar per context; no fusionar persones d’entitats diferents per nom. Mostrar què canvia en seleccionar-la: filtre i recordatoris locals.

**12. Construir l’editor de tasques.** Puntual, interval i En acabar; data, lloc, assignacions, comunes, rols, instruccions i checklist. Alta, duplicació i eliminació amb referències protegides. Ordenar simultànies amb drag accessible i botons alternatius.

**13. Afegir validació editorial.** Errors bloquejants per camps trencats i avisos per superposicions, rols pendents i tasques sense persona. El creador pot conservar simultaneïtats intencionades. Cap avís elimina contingut automàticament.

**14. Construir Agenda.** Dies, agrupacions horàries, línia temporal, dependències vinculades, cerca i Torna a ara. Detall desplegable amb responsables i notes llargues. Comprovar que diumenge a les 02:00 queda després de dissabte a les 23:00.

**15. Construir Ara i Després.** Mostrar tots els intervals actuals, grup de pròximes tasques i tractament de fites sense final. Mantenir l’explicació de temps previst. Distingir pausa, cap assignació i document finalitzat.

**16. Connectar filtres i marques personals.** Tothom, Les meves, equips i comunes. Inspeccionar una altra persona sense substituir Soc jo. Desar checks locals amb IDs i conservar-los en canvis de revisió quan continuen existint.

**17. Publicar revisions locals.** Separar esborrany de publicat, incrementar revisió, desar snapshot i calcular diff. Mostrar canvis abans de publicar. Exportar només una revisió coherent; mai una combinació parcial d’esborrany i dades publicades.

**18. Implementar exportació i compartir.** Generar `.minut.json`, obrir el full natiu i registrar tipus de document. Exportar PDF general/personal amb notes i revisió; paginar sense separar hora de tasca. Preparar backup local opcional diferenciat del fitxer per al grup.

**19. Implementar importació segura.** Capturar documents des del sistema i l’app. Validar abans d’escriure. Mostrar previsualització i diff; resoldre revisions antigues, duplicades i en conflicte. Aplicar dades en una transacció conservant preferències vàlides.

**20. Programar recordatoris.** Demanar permís en context, calcular avisos per filtre i agrupar simultanis. Mantenir un registre d’IDs natius per cancel·lar-los en revisions, canvis de persona o eliminació. Mostrar límits o permisos denegats sense bloquejar consulta.

**21. Construir widgets.** Transferir dades mínimes, generar timelines compatibles, mostrar revisió i pròxima tasca. Comprovar widget sense documents, filtre personal i esdeveniment acabat. No confondre timeline de widget amb actualitzacions de Live Activity.

**22. Construir la Live Activity iOS.** Implementar totes les presentacions, preferència de seguiment, recuperació d’instàncies i deep link al document. Fer servir staleDate i isStale al primer canvi que pugui deixar el contingut antic. Gestionar límit de 8 hores i reprendre des de l’app. No activar pushes sense backend ni prometre actualització contínua amb l’app suspesa.

**23. Completar Preferències i recuperació.** Mode clar/fosc/sistema, text localitzat, identitat, avisos, seguiment, exportació de dades, importar backup i eliminació. Una importació no canvia la configuració d’aparença o la identitat d’un altre document.

**24. Revisar accessibilitat i ergonomia.** VoiceOver/TalkBack, text gran, contrast, focus, teclat, espais segurs, ús amb una mà i moviment reduït. Revisar especialment responsables múltiples, tasques llargues i taules d’edició en mòbils estrets.

**25. Executar la verificació funcional.** Proves de domini, repositoris, importació i recorreguts complets amb el conjunt dels Dimonis i documents sintètics amb simultaneïtats, canvi d’hora i conflictes. No donar per verificades funcions natives només perquè la demo web les dibuixa.

**26. Provar físicament un dia llarg.** Dos iPhones i un Android amb diferents permisos; dispositiu bloquejat, sense cobertura, app tancada, revisió nova, persona canviada i pas de mitjanit. Comprovar bateries i pantalles de contingut antic. Fer una prova real de 8 hores per al final de sessió d’iOS, a més de proves amb rellotge injectat del domini.

**27. Preparar la distribució completa.** Bundle IDs propis, icones, metadades, textos de privacitat ajustats al comportament real, associacions de documents, configuració d’extensions i builds signades. TestFlight i testing intern Android abans de submissió. No s’inventen certificats, comptes de desenvolupador o autoritzacions de publicació.

**28. Tancar l’entrega.** Repositori amb instruccions reproduïbles, lockfile, assets, especificació, fixtures, proves, builds de validació i llista de límits coneguts. La publicació pública a les botigues és una acció separada que requereix els comptes i la decisió del propietari; no canvia l’abast funcional de l’app.

## 14. Criteris d’acceptació

| Cas | Resultat exigible |
|---|---|
| Un document actiu | S’obre automàticament Ara del document. |
| Dos actius i selecció vàlida | Es recorda la selecció i tots dos són accessibles. |
| Dos actius sense selecció | Selector explícit; no es tria silenciosament un context ambigu. |
| Cap actiu | Pròxims/passats accessibles; no apareix un fals Live. |
| Jornada 08:00-06:00 | No es tanca a mitjanit; les tasques s’ordenen per instant. |
| Tasques simultànies | Es poden veure totes, també amb el mateix responsable. |
| Puntual sense final | No continua en curs indefinidament ni es dona per feta. |
| Tasca En acabar | Es manté vinculada sense inventar una hora ni estat global. |
| Filtre personal | Inclou assignacions directes i d’equip; comunes configurables. |
| Persona duplicada de nom | IDs diferenciats i selecció desambiguada. |
| Nova revisió | Diff, confirmació, reemplaçament atòmic i preferències conservades. |
| Mateixa revisió amb altre contingut | Conflicte explícit; cap pèrdua silenciosa. |
| Persona seleccionada eliminada | Es demana una nova selecció i es cancel·len avisos antics. |
| Sense cobertura | Documents, persones, notes, filtres i horari disponibles. |
| App suspesa | No es presenta un timer JS com a mecanisme garantit d’actualització. |
| Live Activity antiga | Mostra contingut caducat i accés per reprendre. |
| Text gran i lector de pantalla | Tasques i accions principals continuen llegibles i operables. |
| Exportar i reimportar | Dades equivalents sense incloure preferències privades. |
| Tancament durant edició | L’esborrany local es recupera sense alterar la revisió publicada. |

## 15. Què s’entrega en aquest treball de disseny

Prototip web privat navegable, proposta de logo revisada, sistema visual, pantalles principals i estats, pla complet en PDF i Markdown, tokens de disseny, contracte de dades orientatiu i exemple estructurat. El prototip permet explorar i editar dades de demostració i exportar un fitxer; no és una compilació Expo ni prova que s’hagin implementat o validat les funcions natives.

La verificació visual del prototip en navegador pot quedar limitada si l’entorn de previsualització no està disponible. Aquest límit s’informa al lliurament i no es converteix en una afirmació de proves superades. El PDF es renderitza per comprovar-ne la maquetació.

## 16. Fonts tècniques verificades

[1] Expo, **Expo SDK 58**, 15 d’octubre de 2026. https://expo.dev/changelog/sdk-58

[2] Expo, **Widgets**, documentació vigent consultada el 4 de novembre de 2026. https://docs.expo.dev/versions/latest/sdk/widgets/

[3] Apple, **Displaying live data with Live Activities**. Durada, presentacions i cicle de vida. https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities

[4] Apple, **request(attributes:content:pushType:style:alertConfiguration:start:)**. Inici programat i límits de simultaneïtat. https://developer.apple.com/documentation/activitykit/activity/request(attributes:content:pushtype:style:alertconfiguration:start:)

[5] Expo, **BackgroundTask**. Execució ajornable i decisió del sistema. https://docs.expo.dev/versions/latest/sdk/background-task/

Font de contingut: PDF aportat «MINUT A MINUT CORREFOC DIMONIS 2024.docx.pdf». Les mostres gràfiques aportades s’han fet servir com a referència de direcció, no com a material copiat.
