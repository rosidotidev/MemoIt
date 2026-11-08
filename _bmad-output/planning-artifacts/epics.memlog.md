# Memlog: bmad-create-epics-and-stories (esecuzione autonoma)

Decisioni prese senza l'utente, criterio "tenere piccolo il prodotto".
- Documenti confermati: PRD, addendum, spine, DESIGN, EXPERIENCE, NAVIGATION. Brief escluso (draft, a monte del PRD). Mockup non letti come fonte (AD-18).
- Requisiti estratti: 14 FR, 9 NFR, 19 requisiti aggiuntivi dallo spine, 18 UX-DR. Funzioni tagliate non incluse.
- Epica 1 contiene per scelta dell'orchestratore la storia 1.1: scaffold Angular 22 piu regole Firestore con test su emulatore, prima di ogni dato reale. Epica tenuta con valore utente (accesso) per non essere puramente tecnica.
- 7 epiche, 22 storie, ordine di epica = ordine di dipendenza. Epica 3 raggruppa Items e pulizia/eliminazione Categoria (FR4 spezzato: 2.2 e 3.5) perche l'eliminazione a cascata richiede ItemStore.
- Filtri 3.6 e ordinamento 3.7 compaiono prima delle Deadline (4.1): funzionano con dati mancanti e si completano dopo, senza dipendenze in avanti.
- Tema (FR14) dopo; fino ad allora token Material di default. Lingua: strings.ts nasce in 1.2 per evitare testo letterale.
- FR10 (Should) incluso come 3.7; PWA (Could) come 7.2, saltabile. Aggiunta 7.1 (e2e Playwright + axe) per AD-17 e SM-3.
- Nessuna storia crea risorse reali Firebase; deploy mai eseguito.
- Step interattivi (conferme, menu A/P/C): auto-approvati, nessuna domanda all'utente. Menu di completamento: C scelto, epics.md status final. bmad-help non invocato (richiederebbe un utente).
