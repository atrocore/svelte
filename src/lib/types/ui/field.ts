export type FieldMode = 'detail' | 'list' | 'listLink' | 'edit' | 'search';

export type FieldFetchResult = Record<string, unknown>;

export type FieldSearchResult = Record<string, unknown> | false;

/**
 * Contract for top-level field components accessed via bind:this.
 * Each field component exposes fetch() and optionally fetchSearch().
 */
export type FieldInstance = {
    fetch(): FieldFetchResult;
    fetchSearch?(): FieldSearchResult;
};