<script lang="ts">
    import { Config } from '$lib/core/config';
    import { ApiClient } from '$lib/core/api-client';
    import { UserData } from "$lib/core/user-data";
    import { LayoutManager } from "$lib/core/layout-manager";
    import { Language } from "$lib/core/language"
    import { Storage } from "$lib/core/storage";
    import { Acl } from "$lib/core/acl";
    import { onMount } from "svelte";
    import type Floating from "$lib/dom/floating";
    import { Dropdown } from "$lib/dom/dropdown";

    export let checkConfirmLeaveOut: Function;

    let localeTrigger: HTMLElement;
    let languageTrigger: HTMLElement;
    let localeDropdown: HTMLElement;
    let languageDropdown: HTMLElement;

    let mainLanguageCode = '';

    for (const [code, language] of Object.entries(Config.get('referenceData').Language || {}) as [string, any][]) {
        if (language.role === 'main') {
            mainLanguageCode = code
        }
    }

    const allLocales: Record<string, any> = Config.get('locales') || {}
    let locales: Record<string, any> = Object.fromEntries(
        Object.entries(allLocales).filter(([, loc]) => !loc.disableForUi)
    )
    const forbiddenLanguages: string[] = Acl.getForbiddenLanguageList('read') || []
    let languages: Record<string, any> = [mainLanguageCode, ...(Config.get('inputLanguageList') || [])].reduce((res, item) => {
        if (!forbiddenLanguages.includes(item)) {
            res[item] = Config.get('referenceData').Language?.[item]
        }
        return res
    }, {})

    let locale = Storage.get('user', 'locale')
    if (!locale || !locales[locale]) {
        locale = UserData.get()?.user?.localeId
        if (!locale || !locales[locale]) {
            locale = Config.get('locale')
            if (!locales[locale]) {
                locale = 'main'
            }
        }
    }

    let disabledLanguages = UserData.get()?.user?.disabledLanguages || []
    let defaultLanguageCode: string | null = null
    if (languages[mainLanguageCode]) {
        defaultLanguageCode = mainLanguageCode
    }

    if (locale && locales[locale]?.language && languages[locales[locale].language]) {
        defaultLanguageCode = locales[locale].language
    }

    disabledLanguages = disabledLanguages.filter(code => !!languages[code])

    function unselectAllLanguages() {
        enabledLanguages = []
        onLanguageChange()
    }

    let enabledLanguages: string[] = disabledLanguages.length > 0
        ? Object.keys(languages).filter(item => item !== defaultLanguageCode && !disabledLanguages.includes(item))
        : []

    async function onLocaleSelected(id: string) {
        locale = id;
        await onLocaleChange();
    }

    async function onLocaleChange() {
        const userData = UserData.get()!
        const code = locales[locale]?.language
        const newDefaultCode = code && languages[code] ? code : mainLanguageCode

        checkConfirmLeaveOut(async () => {
            if (locale === UserData.get()!.user.localeId) {
                Storage.clear('user', 'locale')
            } else {
                Storage.set('user', 'locale', locale)
            }

            LayoutManager.clearListAndDetailCache()

            try {
                await ApiClient.patch('/UserProfile/' + userData.user.id, {
                    disabledLanguages: Object.keys(languages).filter(item => item !== newDefaultCode)
                })
            } catch (e) {
                if (e.status !== 304) {
                    throw e
                }
            }


            window.location.reload();
        })
    }

    async function onLanguageChange() {
        const userData = UserData.get()!
        const disabledLanguages = Object.keys(languages).filter(item => item !== defaultLanguageCode && !enabledLanguages.includes(item));
        try {
            await ApiClient.patch('/UserProfile/' + userData.user.id, {
                disabledLanguages: disabledLanguages
            })
        } catch (e) {
            if (e.status !== 304) {
                throw e
            }
        }

        LayoutManager.clearListAndDetailCache();

        // emit event to reload layouts
        for (const [_, view] of (window.languageObservableViews?.entries() ?? [])) {
            view?.trigger('change:disabled-languages', disabledLanguages)
        }
    }

    onMount(() => {
        let localeFloating: Floating | null = null;
        let languageFloating: Floating | null = null;

        if (localeTrigger) {
            localeFloating = Dropdown.create(localeTrigger, localeDropdown, {
                placement: 'bottom-end',
            });
        }

        if (languageTrigger) {
            languageFloating = Dropdown.create(languageTrigger, languageDropdown, {
                placement: 'bottom-start',
                disableAutoHide: true
            })
        }

        return () => {
            localeFloating?.destroy();
            languageFloating?.destroy();
        }
    });
</script>

<div class="button-group input-group">
    {#if Object.keys(locales).length > 1}
        <div class="dropdown">
            <button class="locale-switcher dropdown-toggle" data-toggle="dropdown" aria-expanded="false"
                    bind:this={localeTrigger}>
                <span>{locales[locale]?.name ?? locale}</span>
                <i class="ph ph-caret-down"></i>
            </button>
            <ul class="dropdown-menu small" bind:this={localeDropdown}>
                {#each Object.entries(locales) as [id, loc]}
                    <li class:disabled={id === locale}>
                        <a href="javascript:"
                           on:click|preventDefault={e => locale !== id ? onLocaleSelected(id) : null }>
                            {loc.name}
                        </a>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
    {#if Object.keys(languages).length > 1}
        <div class="dropdown has-content">
            <button data-toggle="dropdown" class="language-switcher" aria-expanded="false" bind:this={languageTrigger}>
                <i class="{`ph ph-${enabledLanguages.length >= Object.keys(languages).length - 1 ? 'globe-simple' : 'translate' }`}"></i>
            </button>
            <div class="dropdown-menu" bind:this={languageDropdown}>
                <h5>{Language.translate('contentLanguages', 'labels', 'Global')}</h5>
                <ul>
                    {#if defaultLanguageCode}
                        <li class="checkbox">
                            <label style="cursor: not-allowed">
                                <input type="checkbox" checked disabled>
                                {languages[defaultLanguageCode]?.name}
                            </label>
                        </li>
                    {/if}
                    {#each Object.entries(languages).filter(v => v[0] !== defaultLanguageCode).sort((v1, v2) => v1[1].name.localeCompare(v2[1].name)) as [code, language] }
                        <li class="checkbox">
                            <label>
                                <input type="checkbox" bind:group={enabledLanguages} value="{code}"
                                       on:change={onLanguageChange}>
                                {language.name}
                            </label>
                        </li>
                    {/each}
                </ul>
                {#if enabledLanguages.length > 0}
                    <a href="javascript:" on:click={unselectAllLanguages}
                       style="margin-top: 10px">{Language.translate('unselectAll', 'labels', 'Global')}</a>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .button-group {
        display: flex;
        align-items: center;
        padding: 0 10px;
        height: 100%;
    }

    button {
        color: var(--toolbar-font-color);
        background-color: var(--toolbar-background-color);
        border-color: rgba(var(--nav-font-color-rgb, 0, 0, 0), 0.2);
        cursor: pointer;
    }

    button:hover, button:focus {
        background-color: rgba(0, 0, 0, 0.03);
    }

    .dropdown > button {
        padding: 5px 12px;
        display: inline-flex;
        align-items: center;
    }

    .dropdown.open > button,
    button:active {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .button-group > * > button {
        border-radius: 0;
    }

    .button-group > :first-child > button {
        border-bottom-left-radius: 5px;
        border-top-left-radius: 5px;
    }

    .button-group > :last-child > button {
        border-bottom-right-radius: 5px;
        border-top-right-radius: 5px;
    }

    .button-group > :nth-child(2) > button {
        border-left-width: 0;
    }

    .dropdown-menu > li > a {
        padding: 5px 15px;
    }

    .language-switcher + .dropdown-menu {
        padding: 10px;
        min-width: 180px;
    }

    .language-switcher + .dropdown-menu > h5 {
        margin: 0;
    }

    .language-switcher + .dropdown-menu > ul {
        padding: 0;
        margin-bottom: 0;
    }

    .locale-switcher > span {
        display: inline-block;
        vertical-align: text-top;
        max-width: 75px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .locale-switcher > i {
        margin-inline-start: 8px;
        margin-inline-end: -4px;
        font-size: 12px;
        line-height: 1;
    }
</style>