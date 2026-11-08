import type { AddError, UpdateError } from '../domain/category';
import type { ItemError } from '../domain/item';
import type { AuthErrorCode } from '../domain/session';

import type { Language } from '../domain/preferences';
export type { Language };

export interface Strings {
  readonly appName: string;
  readonly brandMark: string;
  readonly tagline: string;
  readonly login: {
    readonly heroTitle: string;
    readonly heroBody: string;
    readonly welcome: string;
    readonly subtitle: string;
    readonly email: string;
    readonly password: string;
    readonly show: string;
    readonly hide: string;
    readonly submit: string;
    readonly submitting: string;
    readonly ownerNote: string;
    readonly features: readonly string[];
  };
  readonly authErrors: Record<AuthErrorCode, string>;
  readonly categories: {
    readonly title: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly newCategory: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly noMatches: string;
    readonly loadError: string;
    readonly retry: string;
    readonly progress: string;
    readonly summaryLabel: string;
    readonly summaryOverdue: string;
    readonly summaryOpen: string;
    readonly summaryWeek: string;
    readonly summaryCategories: string;
    readonly dueSoonTitle: string;
    readonly dueSoonOverdue: string;
    readonly openBadge: string;
    readonly dialogTitle: string;
    readonly nameLabel: string;
    readonly create: string;
    readonly creating: string;
    readonly cancel: string;
    readonly errors: Record<AddError, string>;
    /** Contain the `{name}` placeholder. */
    readonly greetingMorning: string;
    readonly greetingAfternoon: string;
    readonly greetingEvening: string;
    readonly heroEyebrow: string;
    readonly heroOverdueUnit: string;
    /** Contain `{n}`, `{done}`, `{total}` placeholders. */
    readonly openCount: string;
    readonly allDone: string;
    readonly doneOf: string;
    readonly categoryCountOne: string;
    readonly categoryCountMany: string;
    readonly nameHint: string;
    readonly namePlaceholder: string;
    readonly themeSettings: string;
  };
  readonly category: {
    readonly back: string;
    readonly paneLabel: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly menuLabel: string;
    readonly settingsItem: string;
    readonly loadError: string;
    readonly retry: string;
    readonly addItem: string;
    readonly itemsLabel: string;
    readonly editItem: string;
    readonly openTitle: string;
    readonly itemCount: string;
    readonly markedDone: string;
    readonly reopened: string;
    readonly undo: string;
    readonly toggleError: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly filtersLabel: string;
    readonly filterAll: string;
    readonly filterOverdue: string;
    readonly filterHigh: string;
    readonly filterDeadline: string;
    /** Word on the High priority chip of a row. */
    readonly highChip: string;
    /** Word on the Overdue chip of a row. */
    readonly overdueChip: string;
    readonly inTotal: string;
    readonly onTrack: string;
    readonly allPrefix: string;
    readonly noMatches: string;
    readonly sortLabel: string;
    readonly sortTitle: string;
    readonly sortNewest: string;
    readonly sortPriority: string;
    readonly sortDeadline: string;
    readonly sortClose: string;
  };
  readonly itemForm: {
    readonly title: string;
    readonly editTitle: string;
    readonly back: string;
    readonly titleLabel: string;
    readonly descriptionLabel: string;
    readonly priorityLabel: string;
    readonly priorityLow: string;
    readonly priorityMedium: string;
    readonly priorityHigh: string;
    readonly deadlineLabel: string;
    readonly deadlineToday: string;
    readonly deadlineTomorrow: string;
    readonly deadlineNextWeek: string;
    readonly deadlineNone: string;
    readonly deadlineCustom: string;
    readonly valueLabel: string;
    readonly detailsLabel: string;
    readonly dateLabel: string;
    readonly timeLabel: string;
    readonly valueNumber: string;
    readonly categoryLabel: string;
    readonly createdLabel: string;
    readonly createdNow: string;
    readonly previewLabel: string;
    readonly previewEmpty: string;
    readonly save: string;
    readonly saving: string;
    readonly cancel: string;
    readonly delete: string;
    readonly deleteTitle: string;
    /** Contains the `{title}` placeholder. */
    readonly deleteBody: string;
    readonly deleting: string;
    readonly errors: Record<ItemError, string>;
  };
  readonly categorySettings: {
    readonly title: string;
    readonly back: string;
    readonly nameLabel: string;
    readonly stateLabelLabel: string;
    readonly stateLabelHint: string;
    readonly suggestionsLabel: string;
    readonly previewLabel: string;
    readonly reportableLabel: string;
    readonly reportableHint: string;
    readonly generalTitle: string;
    readonly reportTitle: string;
    /** Contains the `{label}` placeholder. */
    readonly previewBody: string;
    /** Contains `{total}`, `{open}`, `{done}` and `{label}`. */
    readonly headSummary: string;
    readonly deleteCategoryHint: string;
    readonly glanceTitle: string;
    readonly glanceItems: string;
    readonly glanceOpen: string;
    readonly glanceReportable: string;
    readonly on: string;
    readonly off: string;
    readonly save: string;
    readonly saving: string;
    readonly saved: string;
    readonly dangerTitle: string;
    readonly clearDone: string;
    readonly clearDoneHint: string;
    readonly clearDoneTitle: string;
    readonly clearDoneBody: string;
    readonly clearing: string;
    readonly cleared: string;
    readonly deleteCategory: string;
    readonly deleteCategoryTitle: string;
    readonly deleteCategoryBody: string;
    readonly deletingCategory: string;
    readonly cancel: string;
    readonly errors: Record<UpdateError, string>;
  };
  readonly report: {
    readonly title: string;
    readonly categoryLabel: string;
    readonly summaryLabel: string;
    readonly latest: string;
    readonly change: string;
    readonly average: string;
    readonly lowest: string;
    readonly periodLabel: string;
    readonly period3m: string;
    readonly period6m: string;
    readonly period1y: string;
    readonly periodAll: string;
    readonly aggregationLabel: string;
    readonly weekly: string;
    readonly monthly: string;
    /** Contains the `{name}` placeholder. */
    readonly chartLabel: string;
    readonly tableToggle: string;
    readonly tableDate: string;
    readonly tableValue: string;
    readonly gap: string;
    readonly emptyNoCategory: string;
    readonly emptyNoValues: string;
    readonly toCategories: string;
    readonly loadError: string;
    readonly retry: string;
    readonly trend: string;
    readonly chartNote: string;
    /** Contains the `{name}` placeholder. */
    readonly openList: string;
  };
  readonly settings: {
    readonly title: string;
    readonly languageLabel: string;
    readonly english: string;
    readonly italian: string;
    readonly saveError: string;
    readonly appearanceLabel: string;
    readonly schemeLight: string;
    readonly schemeDark: string;
    readonly schemeSystem: string;
    readonly accentLabel: string;
    readonly accents: Readonly<Record<string, string>>;
    readonly hueLabel: string;
    readonly chromaLabel: string;
    readonly previewLabel: string;
    readonly previewTitle: string;
    readonly previewItem: string;
    readonly previewChip: string;
    readonly previewAction: string;
    readonly previewSamples: readonly [string, string, string, string, string, string];
    readonly btnFilled: string;
    readonly btnTonal: string;
    readonly btnOutlined: string;
    readonly roles: readonly [string, string, string, string];
    readonly accentHint: string;
    readonly languageHint: string;
  };
  readonly nav: {
    readonly categories: string;
    readonly report: string;
    readonly settings: string;
    readonly signOut: string;
    readonly navLabel: string;
  };
  readonly account: { readonly menuLabel: string; readonly avatarLabel: string };
  readonly snackbar: { readonly signedOut: string };
  readonly reminder: {
    /** Contains the `{title}` placeholder. */
    readonly dueNow: string;
    readonly open: string;
  };
}

export const STRINGS: Record<Language, Strings> = {
  en: {
    appName: 'MemoIt',
    brandMark: 'M',
    tagline: 'Your notes and lists, always in your pocket.',
    login: {
      heroTitle: 'Everything you need to remember, in one calm place.',
      heroBody: 'Notes, to-dos and wish lists, organised in your own categories.',
      welcome: 'Welcome back',
      subtitle: 'Sign in to continue to your lists.',
      email: 'Email',
      password: 'Password',
      show: 'Show',
      hide: 'Hide',
      submit: 'Sign in',
      submitting: 'Signing in',
      ownerNote: 'Accounts are created by the owner. No sign-up, no password reset.',
      features: ['Tick things off with a single tap', 'Track a value over time in a report', 'Make it yours with any colour'],
    },
    authErrors: {
      'invalid-credentials': 'Email or password is not correct.',
      'invalid-email': 'Enter a valid email address.',
      network: 'No connection. Check your network and try again.',
      unknown: 'Something went wrong. Try again.',
    },
    categories: {
      title: 'Categories',
      searchLabel: 'Search categories',
      searchPlaceholder: 'Search categories and items',
      newCategory: 'New category',
      emptyTitle: 'Nothing here yet',
      emptyBody: 'Create a category to start collecting your items.',
      noMatches: 'No category matches your search.',
      loadError: 'Could not load your categories.',
      retry: 'Retry',
      progress: 'Progress',
      summaryLabel: 'Summary',
      summaryOverdue: 'Overdue',
      summaryOpen: 'Open',
      summaryWeek: 'Due this week',
      summaryCategories: 'Categories',
      dueSoonTitle: 'Due soon',
      dueSoonOverdue: 'Overdue',
      openBadge: 'open items',
      dialogTitle: 'New category',
      nameLabel: 'Name',
      create: 'Create',
      creating: 'Creating',
      cancel: 'Cancel',
      greetingMorning: 'Good morning, {name}',
      greetingAfternoon: 'Good afternoon, {name}',
      greetingEvening: 'Good evening, {name}',
      heroEyebrow: 'Needs your attention',
      heroOverdueUnit: 'items overdue',
      openCount: '{n} open',
      allDone: 'All done',
      doneOf: '{done} of {total} done',
      categoryCountOne: '{n} category',
      categoryCountMany: '{n} categories',
      nameHint: 'You can rename it later.',
      namePlaceholder: 'e.g. Movies to watch',
      themeSettings: 'Theme and settings',
      errors: {
        empty: 'Enter a name.',
        duplicate: 'You already have a category with this name.',
        invalid: 'Use a name of 60 characters or fewer.',
        notFound: 'This category no longer exists.',
        network: 'No connection. Check your network and try again.',
        timeout: 'This is taking too long. Try again.',
        permission: 'You are not allowed to do this.',
        unknown: 'Something went wrong. Try again.',
      },
    },
    category: {
      back: 'Back to categories',
      paneLabel: 'Category list',
      emptyTitle: 'No items yet',
      emptyBody: 'Items you add to this category will show up here.',
      menuLabel: 'Category menu',
      settingsItem: 'Category settings',
      loadError: 'Could not load your items.',
      retry: 'Retry',
      addItem: 'Add item',
      itemsLabel: 'Items',
      editItem: 'Edit item',
      openTitle: 'Open',
      itemCount: 'of',
      markedDone: 'marked',
      reopened: 'reopened',
      undo: 'Undo',
      toggleError: 'Could not update this item. Check your connection and try again.',
      searchLabel: 'Search items',
      searchPlaceholder: 'Search in this category',
      filtersLabel: 'Filter items',
      filterAll: 'All',
      filterOverdue: 'Overdue',
      filterHigh: 'High priority',
      filterDeadline: 'Has deadline',
      highChip: 'High',
      overdueChip: 'Overdue',
      inTotal: 'in total',
      onTrack: 'All on track',
      allPrefix: 'All',
      noMatches: 'No items match.',
      sortLabel: 'Sort items',
      sortTitle: 'Sort open items',
      sortNewest: 'Newest first',
      sortPriority: 'Priority',
      sortDeadline: 'Deadline',
      sortClose: 'Close',
    },
    itemForm: {
      title: 'New item',
      editTitle: 'Edit item',
      back: 'Back to category',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      priorityLabel: 'Priority',
      priorityLow: 'Low',
      priorityMedium: 'Medium',
      priorityHigh: 'High',
      deadlineLabel: 'Deadline',
      deadlineToday: 'Today',
      deadlineTomorrow: 'Tomorrow',
      deadlineNextWeek: 'Next week',
      deadlineNone: 'No deadline',
      deadlineCustom: 'Date and time',
      valueLabel: 'Value',
      detailsLabel: 'Details',
      dateLabel: 'Date',
      timeLabel: 'Time',
      valueNumber: 'Number',
      categoryLabel: 'Category',
      createdLabel: 'Created',
      createdNow: 'Now',
      previewLabel: 'Preview',
      previewEmpty: 'Your item will appear here.',
      save: 'Save',
      saving: 'Saving',
      cancel: 'Cancel',
      delete: 'Delete item',
      deleteTitle: 'Delete this item?',
      deleteBody: '"{title}" will be deleted. This cannot be undone.',
      deleting: 'Deleting',
      errors: {
        empty: 'Enter a title.',
        titleTooLong: 'Use a title of 120 characters or fewer.',
        descriptionTooLong: 'Use a description of 4000 characters or fewer.',
        valueInvalid: 'Enter a number, for example 12.5.',
        invalid: 'This item cannot be saved. Check the text and try again.',
        notFound: 'This item no longer exists.',
        network: 'No connection. Check your network and try again.',
        timeout: 'This is taking too long. Try again.',
        permission: 'You are not allowed to do this.',
        unknown: 'Something went wrong. Try again.',
      },
    },
    categorySettings: {
      title: 'Category settings',
      back: 'Back to category',
      nameLabel: 'Name',
      stateLabelLabel: 'Done label',
      stateLabelHint: 'What an item is called once it is done.',
      suggestionsLabel: 'Suggestions',
      previewLabel: 'Preview',
      reportableLabel: 'Reportable',
      reportableHint: 'Include this category in your report.',
      generalTitle: 'General',
      reportTitle: 'Report',
      previewBody: 'Tapping an item marks it {label}',
      headSummary: '{total} items · {open} open · {done} {label}',
      deleteCategoryHint: 'And all its items',
      glanceTitle: 'At a glance',
      glanceItems: 'Items',
      glanceOpen: 'Open',
      glanceReportable: 'Reportable',
      on: 'On',
      off: 'Off',
      save: 'Save',
      saving: 'Saving',
      saved: 'Changes saved',
      dangerTitle: 'Danger zone',
      clearDone: 'Clear done items',
      clearDoneHint: 'Deletes the done items of this category and keeps the open ones.',
      clearDoneTitle: 'Clear done items?',
      clearDoneBody: 'Done items in "{name}" ({count}) will be deleted. This cannot be undone.',
      clearing: 'Clearing',
      cleared: 'Done items cleared',
      deleteCategory: 'Delete category',
      deleteCategoryTitle: 'Delete this category?',
      deleteCategoryBody: '"{name}" and its items ({count}) will be deleted. This cannot be undone.',
      deletingCategory: 'Deleting',
      cancel: 'Cancel',
      errors: {
        empty: 'Enter a name.',
        duplicate: 'You already have a category with this name.',
        invalid: 'Use a name of 60 characters or fewer.',
        labelEmpty: 'Enter a done label.',
        labelInvalid: 'Use a done label of 16 characters or fewer.',
        notFound: 'This category no longer exists.',
        network: 'No connection. Check your network and try again.',
        timeout: 'This is taking too long. Try again.',
        permission: 'You are not allowed to do this.',
        unknown: 'Something went wrong. Try again.',
      },
    },
    report: {
      title: 'Report',
      categoryLabel: 'Category',
      summaryLabel: 'Summary',
      latest: 'Latest',
      change: 'Change',
      average: 'Average',
      lowest: 'Lowest',
      periodLabel: 'Period',
      period3m: '3 months',
      period6m: '6 months',
      period1y: '1 year',
      periodAll: 'All',
      aggregationLabel: 'Group by',
      weekly: 'Weekly',
      monthly: 'Monthly',
      chartLabel: 'Line chart of {name} over time',
      tableToggle: 'Show as table',
      tableDate: 'Period starting',
      tableValue: 'Value',
      gap: 'No values',
      emptyNoCategory: 'No category is Reportable yet. Turn on Reportable in the settings of a category to see it here.',
      emptyNoValues: 'No values yet. Add a Value to an item of this category to see your trend.',
      toCategories: 'Go to categories',
      loadError: 'Could not load your items.',
      retry: 'Try again',
      trend: 'Trend',
      chartNote: 'Plotted by deadline, or by creation date when there is none.',
      openList: 'Open {name} list',
    },
    settings: {
      title: 'Settings',
      languageLabel: 'Language',
      english: 'English',
      italian: 'Italiano',
      saveError: 'Could not save your settings. Please try again.',
      appearanceLabel: 'Appearance',
      schemeLight: 'Light',
      schemeDark: 'Dark',
      schemeSystem: 'System',
      accentLabel: 'Colour',
      accents: {
        indigo: 'Indigo',
        blue: 'Blue',
        teal: 'Teal',
        green: 'Green',
        amber: 'Amber',
        orange: 'Orange',
        rose: 'Rose',
        magenta: 'Magenta',
        purple: 'Purple',
        custom: 'Custom',
      },
      hueLabel: 'Custom hue',
      chromaLabel: 'Intensity',
      previewLabel: 'Live preview',
      previewTitle: 'Grocery list',
      previewItem: 'Buy milk',
      previewChip: '6 open',
      previewAction: 'Add',
      previewSamples: ['Oat milk', '2 cartons', 'Birthday candles', 'Overdue · 18:00', 'High', 'Coffee beans'],
      btnFilled: 'Filled',
      btnTonal: 'Tonal',
      btnOutlined: 'Outlined',
      roles: ['Primary', 'Container', 'Secondary', 'Tertiary'],
      accentHint: 'Pick an accent. Surfaces, buttons and charts all follow it.',
      languageHint: 'Applies to text, dates and times.',
    },
    nav: {
      categories: 'Categories',
      report: 'Report',
      settings: 'Settings',
      signOut: 'Sign out',
      navLabel: 'Main navigation',
    },
    account: { menuLabel: 'Account menu', avatarLabel: 'Account' },
    snackbar: { signedOut: 'You have been signed out' },
    reminder: { dueNow: 'Due now: {title}', open: 'Open' },
  },
  it: {
    appName: 'MemoIt',
    brandMark: 'M',
    tagline: 'Le tue note e liste, sempre in tasca.',
    login: {
      heroTitle: 'Tutto quello che devi ricordare, in un posto sereno.',
      heroBody: 'Note, cose da fare e liste dei desideri, nelle tue categorie.',
      welcome: 'Bentornato',
      subtitle: 'Accedi per continuare con le tue liste.',
      email: 'Email',
      password: 'Password',
      show: 'Mostra',
      hide: 'Nascondi',
      submit: 'Accedi',
      submitting: 'Accesso in corso',
      ownerNote: 'Gli account li crea il proprietario. Niente registrazione, niente reimpostazione password.',
      features: ['Spunta le cose con un tocco', 'Segui un valore nel tempo in un report', 'Rendila tua con qualsiasi colore'],
    },
    authErrors: {
      'invalid-credentials': 'Email o password non corretti.',
      'invalid-email': 'Inserisci un indirizzo email valido.',
      network: 'Nessuna connessione. Controlla la rete e riprova.',
      unknown: 'Qualcosa è andato storto. Riprova.',
    },
    categories: {
      title: 'Categorie',
      searchLabel: 'Cerca categorie',
      searchPlaceholder: 'Cerca categorie e voci',
      newCategory: 'Nuova categoria',
      emptyTitle: 'Ancora niente qui',
      emptyBody: 'Crea una categoria per iniziare a raccogliere i tuoi elementi.',
      noMatches: 'Nessuna categoria corrisponde alla ricerca.',
      loadError: 'Impossibile caricare le tue categorie.',
      retry: 'Riprova',
      progress: 'Avanzamento',
      summaryLabel: 'Riepilogo',
      summaryOverdue: 'Scaduti',
      summaryOpen: 'Aperti',
      summaryWeek: 'In scadenza questa settimana',
      summaryCategories: 'Categorie',
      dueSoonTitle: 'In scadenza',
      dueSoonOverdue: 'Scaduto',
      openBadge: 'elementi aperti',
      dialogTitle: 'Nuova categoria',
      nameLabel: 'Nome',
      create: 'Crea',
      creating: 'Creazione in corso',
      cancel: 'Annulla',
      greetingMorning: 'Buongiorno, {name}',
      greetingAfternoon: 'Buon pomeriggio, {name}',
      greetingEvening: 'Buonasera, {name}',
      heroEyebrow: 'Richiede la tua attenzione',
      heroOverdueUnit: 'elementi scaduti',
      openCount: '{n} aperti',
      allDone: 'Tutto completato',
      doneOf: '{done} di {total} completati',
      categoryCountOne: '{n} categoria',
      categoryCountMany: '{n} categorie',
      nameHint: 'Potrai rinominarla in seguito.',
      namePlaceholder: 'es. Film da guardare',
      themeSettings: 'Tema e impostazioni',
      errors: {
        empty: 'Inserisci un nome.',
        duplicate: 'Hai già una categoria con questo nome.',
        invalid: 'Usa un nome di al massimo 60 caratteri.',
        notFound: 'Questa categoria non esiste più.',
        network: 'Nessuna connessione. Controlla la rete e riprova.',
        timeout: 'Ci sta mettendo troppo. Riprova.',
        permission: 'Non hai il permesso di farlo.',
        unknown: 'Qualcosa è andato storto. Riprova.',
      },
    },
    category: {
      back: 'Torna alle categorie',
      paneLabel: 'Elenco categorie',
      emptyTitle: 'Ancora nessun elemento',
      emptyBody: 'Gli elementi che aggiungi a questa categoria compariranno qui.',
      menuLabel: 'Menu categoria',
      settingsItem: 'Impostazioni categoria',
      loadError: 'Impossibile caricare i tuoi elementi.',
      retry: 'Riprova',
      addItem: 'Aggiungi elemento',
      itemsLabel: 'Elementi',
      editItem: 'Modifica elemento',
      openTitle: 'Aperti',
      itemCount: 'su',
      markedDone: 'segnato come',
      reopened: 'riaperto',
      undo: 'Annulla',
      toggleError: 'Impossibile aggiornare questo elemento. Controlla la connessione e riprova.',
      searchLabel: 'Cerca elementi',
      searchPlaceholder: 'Cerca in questa categoria',
      filtersLabel: 'Filtra elementi',
      filterAll: 'Tutti',
      filterOverdue: 'Scaduti',
      filterHigh: 'Priorità alta',
      filterDeadline: 'Con scadenza',
      highChip: 'Alta',
      overdueChip: 'Scaduto',
      inTotal: 'in totale',
      onTrack: 'Tutto in regola',
      allPrefix: 'Tutti',
      noMatches: 'Nessun elemento corrisponde.',
      sortLabel: 'Ordina elementi',
      sortTitle: 'Ordina gli elementi aperti',
      sortNewest: 'Prima i più recenti',
      sortPriority: 'Priorità',
      sortDeadline: 'Scadenza',
      sortClose: 'Chiudi',
    },
    itemForm: {
      title: 'Nuovo elemento',
      editTitle: 'Modifica elemento',
      back: 'Torna alla categoria',
      titleLabel: 'Titolo',
      descriptionLabel: 'Descrizione',
      priorityLabel: 'Priorità',
      priorityLow: 'Bassa',
      priorityMedium: 'Media',
      priorityHigh: 'Alta',
      deadlineLabel: 'Scadenza',
      deadlineToday: 'Oggi',
      deadlineTomorrow: 'Domani',
      deadlineNextWeek: 'Settimana prossima',
      deadlineNone: 'Nessuna scadenza',
      deadlineCustom: 'Data e ora',
      valueLabel: 'Valore',
      detailsLabel: 'Dettagli',
      dateLabel: 'Data',
      timeLabel: 'Ora',
      valueNumber: 'Numero',
      categoryLabel: 'Categoria',
      createdLabel: 'Creato',
      createdNow: 'Adesso',
      previewLabel: 'Anteprima',
      previewEmpty: 'Il tuo elemento comparirà qui.',
      save: 'Salva',
      saving: 'Salvataggio in corso',
      cancel: 'Annulla',
      delete: 'Elimina elemento',
      deleteTitle: 'Eliminare questo elemento?',
      deleteBody: '"{title}" verrà eliminato. Non si può annullare.',
      deleting: 'Eliminazione in corso',
      errors: {
        empty: 'Inserisci un titolo.',
        titleTooLong: 'Usa un titolo di al massimo 120 caratteri.',
        descriptionTooLong: 'Usa una descrizione di al massimo 4000 caratteri.',
        valueInvalid: 'Inserisci un numero, per esempio 12,5.',
        invalid: 'Questo elemento non può essere salvato. Controlla il testo e riprova.',
        notFound: 'Questo elemento non esiste più.',
        network: 'Nessuna connessione. Controlla la rete e riprova.',
        timeout: 'Ci sta mettendo troppo. Riprova.',
        permission: 'Non hai il permesso di farlo.',
        unknown: 'Qualcosa è andato storto. Riprova.',
      },
    },
    categorySettings: {
      title: 'Impostazioni categoria',
      back: 'Torna alla categoria',
      nameLabel: 'Nome',
      stateLabelLabel: 'Etichetta di completamento',
      stateLabelHint: 'Come si chiama un elemento quando è completato.',
      suggestionsLabel: 'Suggerimenti',
      previewLabel: 'Anteprima',
      reportableLabel: 'Nel report',
      reportableHint: 'Includi questa categoria nel tuo report.',
      generalTitle: 'Generale',
      reportTitle: 'Report',
      previewBody: 'Toccando un elemento lo segni come {label}',
      headSummary: '{total} elementi · {open} aperti · {done} {label}',
      deleteCategoryHint: 'E tutti i suoi elementi',
      glanceTitle: 'In breve',
      glanceItems: 'Elementi',
      glanceOpen: 'Aperti',
      glanceReportable: 'Nel report',
      on: 'Sì',
      off: 'No',
      save: 'Salva',
      saving: 'Salvataggio in corso',
      saved: 'Modifiche salvate',
      dangerTitle: 'Zona pericolosa',
      clearDone: 'Elimina elementi completati',
      clearDoneHint: 'Elimina gli elementi completati di questa categoria e lascia quelli aperti.',
      clearDoneTitle: 'Eliminare gli elementi completati?',
      clearDoneBody: 'Gli elementi completati in "{name}" ({count}) verranno eliminati. Non si può annullare.',
      clearing: 'Eliminazione in corso',
      cleared: 'Elementi completati eliminati',
      deleteCategory: 'Elimina categoria',
      deleteCategoryTitle: 'Eliminare questa categoria?',
      deleteCategoryBody: '"{name}" e i suoi elementi ({count}) verranno eliminati. Non si può annullare.',
      deletingCategory: 'Eliminazione in corso',
      cancel: 'Annulla',
      errors: {
        empty: 'Inserisci un nome.',
        duplicate: 'Hai già una categoria con questo nome.',
        invalid: 'Usa un nome di al massimo 60 caratteri.',
        labelEmpty: "Inserisci un'etichetta.",
        labelInvalid: "Usa un'etichetta di al massimo 16 caratteri.",
        notFound: 'Questa categoria non esiste più.',
        network: 'Nessuna connessione. Controlla la rete e riprova.',
        timeout: 'Ci sta mettendo troppo. Riprova.',
        permission: 'Non hai il permesso di farlo.',
        unknown: 'Qualcosa è andato storto. Riprova.',
      },
    },
    report: {
      title: 'Report',
      categoryLabel: 'Categoria',
      summaryLabel: 'Riepilogo',
      latest: 'Ultimo',
      change: 'Variazione',
      average: 'Media',
      lowest: 'Minimo',
      periodLabel: 'Periodo',
      period3m: '3 mesi',
      period6m: '6 mesi',
      period1y: '1 anno',
      periodAll: 'Tutto',
      aggregationLabel: 'Raggruppa per',
      weekly: 'Settimana',
      monthly: 'Mese',
      chartLabel: 'Grafico a linee di {name} nel tempo',
      tableToggle: 'Mostra come tabella',
      tableDate: 'Periodo dal',
      tableValue: 'Valore',
      gap: 'Nessun valore',
      emptyNoCategory: 'Nessuna categoria è nel report. Attiva "Nel report" nelle impostazioni di una categoria per vederla qui.',
      emptyNoValues: 'Ancora nessun valore. Aggiungi un valore a un elemento di questa categoria per vedere il tuo andamento.',
      toCategories: 'Vai alle categorie',
      loadError: 'Impossibile caricare gli elementi.',
      retry: 'Riprova',
      trend: 'Andamento',
      chartNote: 'Tracciato per scadenza, oppure per data di creazione se manca.',
      openList: 'Apri la lista {name}',
    },
    settings: {
      title: 'Impostazioni',
      languageLabel: 'Lingua',
      english: 'English',
      italian: 'Italiano',
      saveError: 'Impossibile salvare le impostazioni. Riprova.',
      appearanceLabel: 'Aspetto',
      schemeLight: 'Chiaro',
      schemeDark: 'Scuro',
      schemeSystem: 'Sistema',
      accentLabel: 'Colore',
      accents: {
        indigo: 'Indaco',
        blue: 'Blu',
        teal: 'Verde acqua',
        green: 'Verde',
        amber: 'Ambra',
        orange: 'Arancione',
        rose: 'Rosa',
        magenta: 'Magenta',
        purple: 'Viola',
        custom: 'Personalizzato',
      },
      hueLabel: 'Tonalità personalizzata',
      chromaLabel: 'Intensità',
      previewLabel: 'Anteprima live',
      previewTitle: 'Lista della spesa',
      previewItem: 'Comprare il latte',
      previewChip: '6 aperti',
      previewAction: 'Aggiungi',
      previewSamples: ["Latte d'avena", '2 confezioni', 'Candeline', 'In ritardo · 18:00', 'Alta', 'Caffè in grani'],
      btnFilled: 'Pieno',
      btnTonal: 'Tonale',
      btnOutlined: 'Contorno',
      roles: ['Primario', 'Contenitore', 'Secondario', 'Terziario'],
      accentHint: 'Scegli un colore. Superfici, pulsanti e grafici lo seguono.',
      languageHint: 'Vale per testi, date e orari.',
    },
    nav: {
      categories: 'Categorie',
      report: 'Report',
      settings: 'Impostazioni',
      signOut: 'Esci',
      navLabel: 'Navigazione principale',
    },
    account: { menuLabel: 'Menu account', avatarLabel: 'Account' },
    snackbar: { signedOut: 'Hai effettuato la disconnessione' },
    reminder: { dueNow: 'Scade ora: {title}', open: 'Apri' },
  },
};
