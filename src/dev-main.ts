// Dev mode only — sets window.Svelte the same way the UMD build does
import * as Svelte from './main';

(window as any).Svelte = Svelte;