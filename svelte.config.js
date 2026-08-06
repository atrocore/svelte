import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'

const suppressedWarnings = ['a11y-invalid-attribute'];

export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),
    onwarn(warning, handle) {
        if (suppressedWarnings.includes(warning.code)) {
            return;
        }
        handle(warning);
    },
}
