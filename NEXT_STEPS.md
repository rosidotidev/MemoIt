# MemoIt: prossimi passi

Aggiornato il 2026-11-06. Stato: brainstorming, brief, PRD, UX e architettura sono fatti. Manca tutto il lavoro di pianificazione delle storie e la costruzione.

## Da fare, in ordine

1. **Epiche e storie** (obbligatorio): `/bmad-create-epics-and-stories`
   Parte da PRD e architettura. Non includere le funzioni tagliate (Notifications, "Remind me", "Keep me signed in", spostare elementi, "Done today").
2. **Sprint planning** (obbligatorio): `/bmad-sprint-planning`
   Controlla che la pianificazione sia completa e crea il file di stato dello sprint.
3. **Build** (obbligatorio): `/bmad-build`
   Una storia alla volta. Primo passo naturale: scaffold Angular 22 e regole Firestore con i test, prima di qualunque dato reale.
4. **Code review** (facoltativo, dopo ogni build): `/bmad-code-review`

Ogni passo in una finestra di contesto nuova (`/clear` prima).

## Facoltativi, quando vuoi

- **Revisione completa** di PRD, UX e spine (`/bmad-review`, oppure `/bmad-architecture` in modalità Validate). Mai eseguita: `final` vuol dire "deciso e allineato", non "revisionato".
- **`/bmad-spec`**: adotta lo spine come allegato di una specifica. La skill lo suggerisce, il catalogo non lo richiede.
- **Aggiornare il brief**: è ancora `draft` e viene prima del PRD.

## Rimandato di proposito (non è nella v1)

- Push notifications e promemoria fuori dall'app
- Offline
- PWA installabile (Could)
- Cifratura delle password nelle descrizioni (da rivedere subito dopo la v1)
- Anticipo del promemoria

## Da tenere d'occhio durante la build

- Otto ipotesi `[ASSUMPTION]` nello spine, per esempio settimane del Report che iniziano di lunedì e regione Firestore `eur3`.
- I mockup sono un riferimento, non codice da copiare (AD-18).
- Nessun codice server: niente Cloud Functions, mai senza cambiare prima la regola AD-3.
- Versioni verificate il 2026-11-06: Angular 22.2.4, TypeScript ~6.0.3 (la 7 non è supportata da Angular 22), Firebase SDK 13.2.0. Riverificarle allo scaffold.

## Dove sono i file

- PRD: `_bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-11-06/prd.md`
- UX e mockup: `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/` (apri `mockups/index.html`)
- Architettura: `_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-11-06/ARCHITECTURE-SPINE.md`
- Note per l'articolo: `writer_notes.md`

---

## Dopo l'epica 3 (2026-11-07)

Stato: epiche 1, 2 e 3 chiuse (build, review di epica, retrospettiva). `ng build` e `npm run check` passano con 251 test unitari e 53 test delle regole Firestore. Non provato in browser. Restano aperte le azioni delle retro 1, 2 e 3 (le retrospettive automatiche le propongono ma non le chiudono). Restano 9 storie in 4 epiche (4, 5, 6, 7).

Prossimo prompt, da incollare dopo `/clear`:

<prompt>
Riprendi l'esecuzione autonoma di MemoIt da doc/run-plan.md. Applica la sezione "Modello di prompt per i sotto-agenti". Passo 0, prima della storia 4.1: chiudi le azioni aperte delle retro 1, 2 e 3 (elenco in `_bmad-output/implementation-artifacts/sprint-status.yaml` e nelle retro): quelle che sono lavoro di codice vanno come intento di un `bmad-build` insieme alla 4.1 o a parte, quelle che sono decisioni le decidi tu col criterio "tenere piccolo il prodotto" e le annoti nello stato. Poi primo passo todo: storia 4.1. Lavora fino alla fine dell'epica 4 compresa (build, review, retrospettiva), scrivi in append in NEXT_STEPS.md il prompt per l'epica 5 e fermati.
</prompt>

---

## Dopo l'epica 4 (2026-11-07)

Stato: epiche 1-4 chiuse (build, review di epica, retrospettiva). `ng build` e `npm run check` passano con 293 test unitari e 55 test delle regole Firestore. Non provato in browser.
Aperto: azioni delle retro (test emulatore di `FirestoreItemBackend`, a11y del banner e delle epiche 3-4 in 7.1, regole su NaN/priority/deadline in 5.1) e i rinvii in `deferred-work.md` ("Code review of epic 4"). Restano 6 storie in 3 epiche (5, 6, 7).

Prossimo prompt, da incollare dopo `/clear`:

<prompt>
Riprendi l'esecuzione autonoma di MemoIt da doc/run-plan.md. Applica la sezione "Modello di prompt per i sotto-agenti". Primo passo todo: storia 5.1. Lavora fino alla fine dell'epica 5 compresa (build, review, retrospettiva) e fermati.
</prompt>

---

## Dopo l'epica 5 (2026-11-07)

Stato: epiche 1-5 chiuse (build, review di epica, retrospettiva). `ng build` e `npm run check` passano con 335 test unitari e 67 test delle regole Firestore. Non provato in browser.
Aperto: colori del grafico che non seguono il cambio tema dal vivo (da riprendere in 6.2), test emulatore di `FirestoreItemBackend`, a11y (banner, grafico, epiche 3-5) in 7.1, rinvii in `deferred-work.md` ("Code review of epic 5"); i revisori annidati non vengono lanciati nelle build.
Restano 4 storie in 2 epiche (6, 7).

Prossimo prompt, da incollare dopo `/clear`:

<prompt>
Riprendi l'esecuzione autonoma di MemoIt da doc/run-plan.md. Applica la sezione "Modello di prompt per i sotto-agenti". Primo passo todo: storia 6.1. Lavora fino alla fine dell'epica 6 compresa (build, review, retrospettiva) e fermati.
</prompt>

---

## Dopo l'epica 6 (2026-11-07)

Stato: epiche 1-6 chiuse (build, review di epica con 3 revisori annidati, retrospettiva). `ng build` e `npm run check` passano con 362 test unitari e 68 test delle regole Firestore. Non provato in browser.
Aperto: a11y (banner, grafico, impostazioni, epiche 3-6) e percorsi end-to-end in 7.1, test emulatore di `FirestoreItemBackend` e `FirestorePreferencesBackend`, rinvii in `deferred-work.md` ("Code review of epic 6": flash del tema al primo paint, ecc.). Restano 2 storie nell'epica 7.

Prossimo prompt, da incollare dopo `/clear`:

<prompt>
Riprendi l'esecuzione autonoma di MemoIt da doc/run-plan.md. Applica la sezione "Modello di prompt per i sotto-agenti". Primo passo todo: storia 7.1. Lavora fino alla fine dell'epica 7 compresa (build, review, retrospettiva) e fermati.
</prompt>

## Dopo l'epica 7 (2026-11-07)

Stato: `ng build` ok; `npm run check` ok (lint, 365 test unit in 49 file, 68 test rules); `npm run test:e2e` 12 passati. Review di epica con quattro revisori, correzioni piccole in `spec-epic-7-review-fixes.md`, retrospettiva `epic-7-retro-2026-11-07.md` (accepted-with-open-items).
Aperto: `test:e2e` fuori da `check` e dal deploy, copertura a11y piu stretta del testo (vedi "Code review of epic 7" in `deferred-work.md`), `theme-color` statico, app installata mai provata in un browser.

<prompt>
FERMATI. L'epica 7 era l'ultima: non c'e nessun passo successivo da eseguire in `doc/run-plan.md`.
Stato finale della v1: epiche 1-7 tutte `done` (accesso e sessione, categorie, elementi, scadenze e priorita, valori e report, lingua e tema, e2e e accessibilita, app installabile senza service worker). Nessun deploy fatto e nessun progetto Firebase reale: tutto gira sugli emulatori. Prima di un deploy vero: creare il progetto Firebase, compilare `environment.prod`, decidere se mettere `test:e2e` nel gate, rivedere i rinvii in `deferred-work.md`.
</prompt>

---

## SPECIALE — Mettere MemoIt online su Firebase (guida passo passo)

MemoIt non ha codice server (AD-3): "il server" è Firebase gestito (Authentication + Firestore + Hosting). Piano Spark (gratuito) basta; non serve Blaze né Cloud Functions. Nomi scelti: progetto `memoit-app` (l'ID reale va scelto unico a livello globale: se è occupato Firebase ne propone uno, es. `memoit-app-a1b2c`; usa quello al posto di `memoit-app` ovunque sotto), app web `MemoIt Web`, database Firestore `(default)`.
Il login dell'app è solo email + password e **non c'è registrazione nell'app**: gli utenti si creano dalla console (passo 5).

### 1. Prerequisiti (una tantum)
1. Account Google. Node/npm già presenti (`packageManager: npm@11.12.1`).
2. `npm install` nella cartella del progetto (la CLI `firebase-tools` è già tra le devDependency: usa `npx firebase ...`).
3. Login: `npx firebase login` (si apre il browser). Verifica con `npx firebase projects:list`.

### 2. Crea il progetto
1. Console: https://console.firebase.google.com → **Aggiungi progetto** → nome `memoit-app`.
2. Google Analytics: **disattivalo** (non serve, tiene il prodotto piccolo).
3. Opzionale da CLI: `npx firebase projects:create memoit-app --display-name "MemoIt"`.

### 3. Abilita Authentication
1. Console → **Build → Authentication → Inizia**.
2. Scheda **Metodo di accesso** → **Email/password** → abilita il primo interruttore (NON "link via email"). Salva.
3. Scheda **Impostazioni → Domini autorizzati**: ci sono già `localhost` e `memoit-app.web.app`/`.firebaseapp.com`. Se userai un dominio tuo, aggiungilo qui (passo 9).

### 4. Crea il database Firestore
1. Console → **Build → Firestore Database → Crea database**.
2. ID database: `(default)` (l'app usa quello). Edizione Standard.
3. Posizione: scegli **una volta sola, non si cambia più**. Per utenti in Italia: `eur3 (Europe)` oppure `europe-west8 (Milano)`.
4. Modalità: **Produzione** (blocca tutto finché non pubblichi le regole del passo 7; le regole sono in `firestore.rules`).

### 5. Crea gli utenti
1. Console → Authentication → scheda **Utenti → Aggiungi utente** → email + password (min. 6 caratteri).
2. Ripeti per ogni persona che deve usare l'app. Ogni utente vede solo i propri dati (regole + test UJ-1..5 lo verificano).
3. Non esiste "password dimenticata" nell'app: la password si reimposta dalla console (menu ⋮ accanto all'utente → **Reimposta password**).

### 6. Registra l'app web e copia la configurazione
1. Console → ⚙ **Impostazioni progetto → Generali → Le tue app → icona Web `</>`**.
2. Nickname `MemoIt Web`. **NON** spuntare "Configura anche Firebase Hosting" (lo facciamo da CLI, `firebase.json` esiste già). Registra.
3. Copia dal blocco `firebaseConfig` i valori `apiKey`, `authDomain`, `projectId`, `appId`.
4. Crea il file di produzione (è in `.gitignore`, non finisce nel repo):
   `cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts`
5. Sostituisci i `YOUR_...` con i valori copiati. Lascia `useEmulators: false`. Esempio:
   ```ts
   export const environment: Environment = {
     useEmulators: false,
     firebase: {
       apiKey: 'AIza...',
       authDomain: 'memoit-app.firebaseapp.com',
       projectId: 'memoit-app',
       appId: '1:1234567890:web:abcdef',
     },
   };
   ```
   La `apiKey` web non è un segreto: la sicurezza sta nelle regole Firestore. `npm run build:prod` si rifiuta di partire se restano `YOUR_` o `useEmulators: true`.

### 7. Collega la CLI al progetto e pubblica le regole
1. Crea `.firebaserc` nella radice (non esiste ancora):
   ```json
   { "projects": { "default": "memoit-app" } }
   ```
   oppure `npx firebase use --add` e scegli il progetto con alias `default`.
2. Pubblica le regole: `npx firebase deploy --only firestore:rules`.
   Senza questo passo l'app online non legge né scrive nulla (permesso negato).
3. Facoltativo: dopo il deploy, console → Firestore → **Regole** e controlla che il testo coincida con `firestore.rules`.

### 8. Costruisci e pubblica l'app (Hosting)
1. Comando unico: `npm run deploy`. Esegue, nell'ordine: `npm run check` (lint + test unitari + test regole), `build:prod`, deploy regole, deploy hosting.
2. Se vuoi anche gli e2e prima di pubblicare: `npm run test:e2e` (usa solo emulatori, non tocca il progetto vero).
3. A fine comando la CLI stampa l'URL: `https://memoit-app.web.app` (e `.firebaseapp.com`). `firebase.json` ha già la riscrittura `** → /index.html`, quindi gli URL profondi (es. `/categories`) funzionano.
4. Il `deploy` richiede `.firebaserc` (passo 7) e `environment.prod.ts` (passo 6).

### 9. (Opzionale) Dominio personalizzato
Console → **Build → Hosting → Aggiungi dominio personalizzato** → segui i record DNS (TXT di verifica + A) → attendi il certificato. Poi aggiungi il dominio in Authentication → Impostazioni → Domini autorizzati.

### 10. Prova di fumo online
1. Apri l'URL, accedi con un utente creato al passo 5.
2. Crea una categoria e un elemento, ricarica la pagina: i dati restano e la sessione è mantenuta.
3. Console → Firestore → Dati: i documenti compaiono sotto l'UID dell'utente. Accedi con un secondo utente: non deve vedere i dati del primo.
4. Cambia lingua/tema e ricarica: le preferenze restano.
5. Se vedi "permission-denied" → regole non pubblicate (passo 7). Se il login dà `auth/invalid-api-key` o `auth/configuration-not-found` → config sbagliata (passo 6) o Email/password non abilitato (passo 3). Schermata bianca dopo il deploy → `ng build` non prod o `public` sbagliato: rifai `npm run deploy`.

### 11. Guardrail e costi (consigliati)
1. Console → ⚙ **Utilizzo e fatturazione**: resta su Spark; imposta un avviso di budget solo se passi a Blaze (non necessario).
2. Console → Authentication → **Impostazioni → Criteri password**: facoltativo, alza la lunghezza minima.
3. Google Cloud Console → API e servizi → Credenziali → chiave browser: restringi i **referrer HTTP** a `memoit-app.web.app/*`, `memoit-app.firebaseapp.com/*` e `localhost/*` (e il tuo dominio). Riduce l'abuso della chiave.
4. Backup: nessuno automatico sul piano Spark; se i dati contano, valuta export manuali (`gcloud firestore export` richiede Blaze).

### 12. Cose da sapere (aperti dalla v1)
- `test:e2e` non fa parte di `npm run check` né di `npm run deploy`: lancialo a mano prima di pubblicare.
- La PWA (manifest, nessun service worker) non è mai stata provata su un browser reale: dopo il deploy prova "Installa app" da Chrome/Edge su HTTPS.
- Rinvii noti in `_bmad-output/implementation-artifacts/deferred-work.md` (es. flash del tema al primo paint).
- Per ripartire in locale sugli emulatori nulla cambia: `npm run emulators` + `npm start` usano `demo-memoit` e non toccano il progetto reale.
