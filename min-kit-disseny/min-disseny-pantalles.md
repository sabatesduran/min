# min · Disseny de pantalles

**Especificació visual 1.0 · 04.11.2026**

Acompanya el prototip navegable i el pla complet. Les dimensions es donen en punts lògics i s’adapten a les convencions d’iOS i Android. La base mòbil de composició és 390 punts d’ample, amb marge de 20, safe areas natives i controls tàctils de 44/48 punts. El prototip web és una maqueta interactiva amb dades de demostració, no una compilació Expo.

## Estructura comuna

Marca min, accent i context de l’esdeveniment a la capçalera; preferències a la dreta. Tres destinacions inferiors: Ara, Agenda i Equip. La biblioteca Esdeveniments s’obre des del context i no ocupa una pestanya permanent. El mode Prepara queda separat de la consulta i només és disponible en documents editables.

Barra inferior dins de safe area, sense tapar l’última fila; contingut amb padding inferior equivalent. Fulls de detall amb handle, títol, tancament i scroll propi. El botó Enrere del sistema tanca primer fulls i després retorna a la pantalla anterior. Modals amb focus inicial, retorn de focus i anunci accessible.

## 01 · Benvinguda

Wordmark en gran sobre paper i proposta de valor breu. Tres accions ordenades: «Crea un esdeveniment», «Importa un horari» i «Prova la demo». La demo és una sessió temporal del dia actual: no apareix a Esdeveniments ni es presenta com un document propi, però es pot duplicar per editar. Peu: «Sense compte. Disponible sense connexió.» No es demanen permisos ni identitat aquí.

**Sortides:** crear document → formulari; importar → selector de fitxer; demo → Ara amb dades representatives. Cancel·lar el selector conserva la benvinguda. En una obertura nova sense documents propis o rebuts, l’app torna a aquesta pantalla encara que la sessió anterior fos la demo.

## 02 · Inici buit

Titular «El pròxim gran dia». Composició abstracta petita de tres peces de diferents alçades, sense mascota. Explicació, Crear i Obrir fitxer. Si esborres l’últim document, l’app torna aquí sense conservar un selector trencat.

## 03 · Selector d’esdeveniments

Full amb títol «Canvia de min» o «Dos minuts actius». Cada fila/targeta té estat textual, entitat, títol, finestra amb dates completes i revisió. L’esdeveniment seleccionat incorpora check i text Seleccionat. Si hi ha una elecció suggerida encara no confirmada, el botó «Obre aquest min» fa explícita l’acció.

Actius en primer lloc; accés «Veure tots els minuts». La finestra d’un document nocturn mostra dos dies. L’elecció es desa. L’app no salta de context mentre l’usuari consulta o edita.

## 04 · Ara

Part superior: «Som-hi, Dídac» o «Som-hi, colla» si no s’ha seleccionat persona. Hora monoespaiada, data local de l’esdeveniment i estat En directe només si és actiu. Filtre Tothom / Les meves. Si Les meves, checkbox «Inclou activitats de tota la colla».

Secció «Ara, segons l’horari». Targeta blava amb interval, títol gran, lloc i responsables en text. Les activitats simultànies addicionals tenen files immediatament sota, amb indicador «També a aquesta hora». Ordenar primer coincidències personals i després ordre editorial. La llista no desapareix en seleccionar una targeta.

Secció «Després». Targeta llima amb hora, compte enrere en minuts, títol i responsable. Si hi ha diverses a la mateixa hora, resum «+2 al mateix moment». Secció final amb dues pròximes files, accés a Agenda i revisió amb moment d’importació/publicació.

**Variants:** pausa personal, cap tasca assignada, fita sense final, diverses actuals, cap pròxima, persona no seleccionada i font local antiga. Una pausa no és un error.

## 05 · Agenda

Titular «El fil del dia». Dos selectors de dia si hi ha matinada; més dies en una llista horitzontal accessible si cal. Capçalera de cada dia sticky. Hores en columna monoespaiada, rail fi i punts d’activitat. Múltiples tasques d’una mateixa hora queden agrupades, sense inventar una seqüència temporal.

Les relatives es mostren indentades amb connector i text «En acabar X». Per pantalla estreta, el text es parteix i l’hora conserva l’amplada. Botó «Torna a ara» quan l’usuari s’allunya del moment actual; no fer autoscroll durant la lectura. Botó Afegeix visible per al document editable; accés Edita al menú del document.

**Variants:** tot, filtre personal, cerca sense resultats, document sense tasques, dia següent, text molt gran i tasques de títol llarg.

## 06 · Detall de tasca

Full amb data i interval o condició En acabar. Títol de 30-34 punts segons mida; lloc amb icona i text. Responsables en chips amb nom, no només inicials. Rols en files «Enceses — Dídac» o «Carro — Per assignar».

Notes llargues amb paràgrafs, llistes i enllaços explícits. Checklist personal amb ID per element. Control «Feta, per a mi» amb aclariment de privacitat. Edita només en la còpia d’autor. A les còpies rebudes, opció «Duplica per editar» crea un document nou; no canvia permisos reals d’un sistema compartit.

Tancar conserva posició i filtre. Després d’una revisió, si la tasca ha desaparegut, mostrar un resum i tornar a l’agenda sense error de ruta.

## 07 · Esdeveniments

Titular «Esdeveniments». Cerca i filtres Tots / En curs / Pròxims / Passats. Targetes amb entitat, títol, dates, origen, revisió i moment d’importació quan correspon. Tocar la targeta l’obre; les accions de gestió viuen al menú contextual.

Accions: crear, importar, duplicar com a nou, exportar còpia i eliminar localment. Eliminar explica que afecta només el dispositiu i ofereix exportar abans. Si hi ha esborrany, la confirmació ho explicita. El menú no fa servir una acció de destrucció remota que no existeix.

## 08 · Abans de començar i finalitzat

Abans: «Tot a punt», dates i explicació que l’horari es pot consultar ja. Acció principal «Consulta el minut a minut». Mostrar moment d’inici, sense falsa animació Live. Després: «Ho heu fet», indicador Finalitzat i l’agenda disponible. Es pot duplicar per preparar una altra edició.

El moment actual no es confon amb la data d’inici de l’esdeveniment. El final no desapareix automàticament de l’arxiu.

## 09 · Persones

Titular «La gent que ho fa». Context d’entitat visible i canviable. Banner lila «Tu ets Dídac» amb acció Canvia. Cerca per nom, cognoms o equip; filtres d’equip. Inicials de 40-44 punts, nom, equip, nombre de tasques i etiqueta Soc jo.

Botó Afegeix en context editable. En còpia rebuda es pot consultar i canviar identitat local, però no alterar els responsables publicats. Directori transversal opcionable des del selector de context, preservant entitats i IDs separats.

**Variants:** noms repetits amb cognom/equip, persona sense assignacions, persona eliminada en revisió, cap identitat seleccionada i filtre buit.

## 10 · Fitxa de persona

Inicials grans, nom, equips, rols i resum de tasques. Botó «Aquesta persona soc jo» o etiqueta «Aquesta persona ets tu». Tasques assignades ordenades temporalment dins del document seleccionat. Possibilitat de consultar una altra persona sense canviar la identitat pròpia.

El canvi Soc jo confirma què afecta: filtre, recordatoris i seguiment local. No es presenta com a login, verificació d’identitat o confirmació d’assistència.

## 11 · Qui ets?

Full cercable de persones amb noms complets i context. Cap persona seleccionada per coincidència del nom del dispositiu. Opció «Encara no ho sé» per consultar tot. Si hi ha dos noms iguals, equip/etiqueta evita ambigüitat. Si la teva persona desapareix en una revisió, aquest full es torna a oferir després de mostrar els canvis.

## 12 · Crear / dades del document

Titular «Un dia per fer». Camps: nom, entitat, inici amb data/hora, final amb data/hora, zona horària, notes generals i color dins de paleta. La finestra es valida abans de continuar. El final de matinada és un dia explícit, no una hora de final amb data deduïda silenciosament.

En edició, mostrar tasques afectades per canviar dates i oferir corregir-les. Errors sota el camp, sense esborrar contingut introduït. Autosalvat local amb etiqueta discreta Esborrany desat. Separar botó Desa de Publica.

## 13 · Editor d’agenda

Titular «Fem que tot encaixi». Nom, estat Esborrany o Vn, botons Dades del dia i Publica. Files amb hora, títol, responsables i edició. Les simultànies es poden reordenar amb arrossegament i botons accessibles; el canvi d’ordre no altera timestamps.

Accions de tasca: afegir, duplicar, editar, eliminar. Eliminar pare amb dependències requereix resoldre-les abans. Resum final de camps pendents i conflictes de persona, amb accés directe. Publicar mostra un diff, no només un spinner.

## 14 · Editor de tasca

Un únic formulari amb tipus temporal inicial: Hora puntual / Interval / En acabar. Els camps apareixen segons el tipus. Inici i final amb data completa; dependència amb selector cercable. Lloc i notes. Responsables amb multiselecció de persones/equips, rols editables i marca Tota la colla separada.

Per als responsables molts, cerca i resum de selecció; no una pantalla infinita de checkboxes sense agrupació. Checklist amb altes, ordre i eliminació. Avís de solapament mostra quines tasques i quina persona; opció «Conserva igualment». Un cicle o final invàlid bloqueja Desa/Publica amb explicació.

## 15 · Publicació i compartició

Titular «Passa el min». Revisió i data. Resum de què inclou. Acció principal Compartir fitxer. Secundàries PDF general, PDF personal i desar a Fitxers. Si hi ha esborrany: «Publica i comparteix» amb resum abans de confirmar.

Informació clara: una revisió nova s’ha de tornar a repartir. No mostrar persones amb check de rebut o llegit. Cap QR inventat ni URL de descàrrega que no existeixi. La identitat, els avisos i els checks personals queden exclosos del fitxer per al grup.

## 16 · Importació i comparació de revisions

Previsualització de nom, entitat, finestra, revisió i nombre de persones/tasques. Per actualitzar un document existent: seccions Afegit / Modificat / Eliminat; primer els canvis que t’afecten. Diferències d’hora amb abans/després textuals.

Botons «Actualitza la meva còpia» i Cancel·la. Fitxer nou: «Desa aquest min». Mateixa revisió idèntica: «Ja el tens». Revisió antiga: consulta històrica opcional. Mateixa revisió amb altre contingut: conflicte explícit, sense sobreescriure silenciosament.

**Errors:** format incompatible, esquema més nou, fitxer massa gran, referències trencades o dades malmeses. La còpia anterior es conserva.

## 17 · Preferències

Titular «A la teva manera». Seccions Seguiment, Aparença i El teu dispositiu. Live Activity Desactivada / Tot / Les meves, comunes opcionals; avisos independents amb antelació; tema Sistema / Clar / Fosc. Identitat i gestió de documents.

Permisos denegats amb acció «Obre els ajustos del sistema». No es mostra un switch activat si el sistema no ho permet. Les preferències no es modifiquen en importar documents aliens.

## 18 · Live Activity iOS

Pantalla bloquejada: marca min petita, títol curt del document, hora/interval, tasca actual prevista, lloc i pròxima tasca. Contrast fort i mida de text adaptada. Amagar notes llargues i informació privada innecessària.

Dynamic Island compacta: logo/espurna a l’esquerra i hora/compte enrere a la dreta. Mínima: espurna. Expandida: document, tasca, interval i pròxima tasca. Tocar obre el document correcte. Si el document no existeix localment, explicar-ho i oferir importar, sense pantalla en blanc.

Estat antic: «Obre min per continuar» i última hora de validesa. S’utilitza staleDate/isStale, no només una comparació de JavaScript que deixaria de funcionar amb l’app suspesa. Estat finalitzat: sessió acabada. Sessions de fins a 8 hores; no es dissenya una falsa activitat única de 22 hores. Tot/Les meves canvia el seguiment, no forçosament el filtre de l’agenda.

## 19 · Widgets i Android

Widget petit amb pròxima tasca; mitjà amb Ara i Després, revisió i filtre. Sense dades: accés a importar/crear. Contingut antic amb text coherent. Les timelines són sol·licituds al sistema, no una promesa d’execució exacta.

Android: mateixa arquitectura d’informació, tipografia nativa, accessibilitat, retorn del sistema, widgets i recordatoris. Cap còpia fictícia de Dynamic Island. Els components de selecció de data/hora respecten cada plataforma.

## 20 · Errors, dades i accessibilitat

Sense connexió no és un error bloquejant; banner discret que indica còpia desada. Fitxer incompatible no destrueix res. Esborrany amb errors destaca camps afectats. Accions destructives tenen confirmació amb context del document.

Còpia de seguretat diferenciada del fitxer per compartir. Exportació de dades explícita i restauració amb previsualització. Eliminació local informa de documents, esborranys i avisos que es cancel·laran.

Text dinàmic, VoiceOver/TalkBack, contrast, objectius tàctils, moviment reduït, mode fosc i enfocament visible formen part del disseny complet. En mida gran, les targetes creixen i la navegació conserva noms accessibles. La lectura correcta d’una hora inclou dia quan travessa mitjanit.

## Estats de components

| Component | Estats exigits |
|---|---|
| Botó | Normal, pressionat, focus, desactivat, treballant amb text de l’acció |
| Input | Buit, amb valor, focus, error, només lectura |
| Filtre | Tot, personal, altres persones, comunes activades/desactivades |
| Targeta de tasca | Prevista ara, pròxima, passada, puntual, relativa, comuna, sense responsable |
| Document | Esborrany, publicat, importat, actiu, pròxim, finalitzat, conflicte |
| Persona | Normal, Soc jo, sense tasques, nom duplicat, eliminada en revisió |
| Revisió | Nova, actualització, duplicada, antiga, incompatible, conflicte |
| Seguiment | Desactivat, permís pendent, denegat, actiu, antic, finalitzat, no compatible |

## Handoff

Els tokens del JSON són la font de valors compartits. Els components natius es construeixen a partir de la jerarquia i estats aquí descrits, no copiant mides petites de la maqueta web. El pla complet especifica el model temporal, les revisions, les dependències i l’ordre de construcció. El prototip permet comentar el comportament i la direcció visual abans d’implementar les funcions natives.
