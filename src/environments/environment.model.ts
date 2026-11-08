export interface Environment {
  readonly useEmulators: boolean;
  readonly firebase: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly appId: string;
  };
}

