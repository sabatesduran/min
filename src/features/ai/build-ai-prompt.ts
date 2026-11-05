export const AI_PROMPT_VERSION = 1;

export function buildAiImportPrompt(): string {
  return `Vull convertir el document que adjuntaré en un fitxer compatible amb l’app min.

Objectiu
- Extreu del document l’esdeveniment, les persones, els equips, les tasques, els horaris, els llocs, les notes, els rols i els checklists que hi constin.
- No inventis cap persona, assignació, hora, durada, lloc, tasca ni dada de l’organització.
- Si falta una dada imprescindible o hi ha una ambigüitat real, fes primer només les preguntes necessàries i espera la resposta. No generis el JSON fins que les dades imprescindibles siguin clares.

Fitxer final
- Crea i retorna un fitxer descarregable amb extensió .minut.json. Posa-li un nom curt relacionat amb l’esdeveniment, per exemple correfoc-2026.minut.json.
- El contingut del fitxer ha de ser exclusivament un únic objecte JSON vàlid, sense Markdown, explicacions ni blocs de codi.
- No enganxis el JSON al xat si pots lliurar-lo com a fitxer. Si la teva interfície no permet crear fitxers, retorna només el JSON perquè es pugui desar amb l’extensió .minut.json.
- No afegeixis propietats que no apareguin al contracte.
- Fes servir UUID v4 diferents per a documentId, organizationId i tots els id.
- Fes servir dates ISO 8601 amb Z o desplaçament horari, per exemple 2026-11-04T18:30:00+01:00.
- Fes servir una zona IANA vàlida, per exemple Europe/Madrid.
- Usa revision 1 i schemaVersion 1. publishedAt és l’instant real en què generes la resposta.
- Si no s’indica cap color, usa "blue". Els únics colors possibles són "blue", "lime", "lilac" i "peach".

Regles de dades
- event.startsAt ha de ser anterior a event.endsAt.
- Les tasques point i interval han de quedar dins de la finestra de l’esdeveniment.
- Usa kind "point" si només hi ha una hora exacta; "interval" si hi ha inici i final; "after" només si el document diu explícitament que va després d’una altra tasca.
- Una tasca after referencia amb afterTaskId l’id d’una altra tasca i no pot formar cicles.
- personIds i teamIds només poden referenciar elements existents.
- common només és true quan la tasca és explícitament per a tothom.
- No dedueixis responsables per proximitat visual o pel nom d’un rol.
- Mantén l’ordre editorial del document amb sortOrder començant per 0.
- Omet category, place, notes, disambiguation i initialsColor quan no constin. La resta de camps i arrays són obligatoris.

Contracte exacte
{
  "schemaVersion": 1,
  "documentId": "<uuid-v4>",
  "organizationId": "<uuid-v4>",
  "revision": 1,
  "publishedAt": "<instant-ISO-amb-offset>",
  "event": {
    "title": "<nom-de-l-esdeveniment>",
    "organization": "<nom-de-l-entitat>",
    "startsAt": "<instant-ISO-amb-offset>",
    "endsAt": "<instant-ISO-amb-offset>",
    "timeZone": "<zona-IANA>",
    "accent": "blue"
  },
  "people": [
    {
      "id": "<uuid-v4>",
      "name": "<nom-complet>"
    }
  ],
  "teams": [
    {
      "id": "<uuid-v4>",
      "name": "<nom-de-l-equip>",
      "personIds": ["<uuid-de-persona>"]
    }
  ],
  "tasks": [
    {
      "id": "<uuid-v4>",
      "kind": "point",
      "title": "<titol>",
      "sortOrder": 0,
      "startsAt": "<instant-ISO-amb-offset>",
      "personIds": [],
      "teamIds": [],
      "roles": [],
      "common": false,
      "checklist": []
    },
    {
      "id": "<uuid-v4>",
      "kind": "interval",
      "title": "<titol>",
      "sortOrder": 1,
      "startsAt": "<instant-ISO-amb-offset>",
      "endsAt": "<instant-ISO-amb-offset>",
      "personIds": [],
      "teamIds": [],
      "roles": [
        {
          "id": "<uuid-v4>",
          "name": "<nom-del-rol>",
          "personIds": [],
          "teamIds": []
        }
      ],
      "common": false,
      "checklist": [
        {
          "id": "<uuid-v4>",
          "text": "<pas-comprovable>"
        }
      ]
    },
    {
      "id": "<uuid-v4>",
      "kind": "after",
      "title": "<titol>",
      "sortOrder": 2,
      "afterTaskId": "<uuid-de-la-tasca-anterior>",
      "personIds": [],
      "teamIds": [],
      "roles": [],
      "common": false,
      "checklist": []
    }
  ]
}

Elimina del fitxer final els exemples que no corresponguin al document. Conserva tasks, people i teams com a arrays buits si el document no en conté. Abans de lliurar-lo, comprova totes les referències, els UUID, les dates i que el fitxer sigui un .minut.json vàlid.`;
}
