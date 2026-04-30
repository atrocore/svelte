import 'driver.js/dist/driver.css'
import './styles/style.css';

import { Language } from '$lib/core/language';
import { UserData } from '$lib/core/user-data';
import { Notifier } from '$lib/core/notifier';
import { LayoutManager } from "$lib/core/layout-manager";
import { Metadata } from '$lib/core/metadata';
import { ModelFactory } from "$lib/core/model-factory";
import { Config } from '$lib/core/config';
import { Storage } from "$lib/core/storage";
import { Acl } from "$lib/core/acl";
import { CollectionFactory } from "$lib/core/collection-factory";

import { Tooltip } from "$lib/dom/tooltip";
import { Dropdown } from "$lib/dom/dropdown";
import { Popover } from "$lib/dom/popover";

import JobManagerButton from '$lib/components/navbar-buttons/JobManagerButton/JobManagerButton.svelte';
import SystemUpdatePanel from "./routes/update/SystemUpdatePanel/SystemUpdatePanel.svelte";
import LayoutComponent from "./routes/admin/layouts/LayoutComponent/LayoutComponent.svelte";
import RebuildDatabaseModal from "$lib/components/RebuildDatabaseModal/RebuildDatabaseModal.svelte";
import ApiRequestComponent from "./routes/admin/api-request/ApiRequest/ApiRequestComponent.svelte";
import FuzzySearchComponent from "./routes/admin/fuzzy-search/FuzzySearch/FuzzySearchComponent.svelte";
import { default as ScriptField } from "$lib/components/fields/Script/Script.svelte";
import { default as BoolField } from "$lib/components/fields/Bool/Bool.svelte";
import { default as TextField } from "$lib/components/fields/Text/Text.svelte";
import { default as MarkdownField } from "$lib/components/fields/Markdown/Markdown.svelte";
import { default as WysiwygField } from "$lib/components/fields/Wysiwyg/Wysiwyg.svelte";
import Navigation from "$lib/components/layout-manager/layouts/Navigation/Navigation.svelte";
import Favorites from "$lib/components/layout-manager/layouts/Favorites/Favorites.svelte";
import TreePanel from "$lib/components/TreePanel/TreePanel.svelte";
import EntityContextPanel from "$lib/components/EntityContextPanel/EntityContextPanel.svelte";
import BaseHeader from "$lib/components/headers/BaseHeader/BaseHeader.svelte";
import ListHeader from "$lib/components/headers/ListHeader/ListHeader.svelte";
import ListToolbar from "$lib/components/toolbars/ListToolbar/ListToolbar.svelte";
import PlateToolbar from "$lib/components/toolbars/PlateToolbar/PlateToolbar.svelte";
import DetailHeader from "$lib/components/headers/DetailHeader/DetailHeader.svelte";
import Gallery from "$lib/components/Gallery/Gallery.svelte";
import FilterSearchBar from "$lib/components/searches/FilterSearchBar/FilterSearchBar.svelte";
import LocaleSwitcher from "$lib/components/LocaleSwitcher/LocaleSwitcher.svelte";
import CurrentSelectionButton from "$lib/components/navbar-buttons/CurrentSelectionButton/CurrentSelectionButton.svelte";
import FieldStateFilter from "$lib/components/filters/FieldStateFilter/FieldStateFilter.svelte";
import AnchorNavigation from "$lib/components/headers/AnchorNavigation/AnchorNavigation.svelte";
import DashboardHeader from "$lib/components/headers/DashboardHeader/DashboardHeader.svelte";
import { default as Administration } from "./routes/admin/Admin/Admin.svelte";
import SelectionItemList from "$lib/components/SelectionItemList/SelectionItemList.svelte";
import ClusterItemList from "$lib/components/ClusterItemList/ClusterItemList.svelte";

declare global {
    interface Window {
        SvelteLanguage: typeof Language;
        SvelteUserData: typeof UserData;
        SvelteNotifier: typeof Notifier;
        SvelteLayoutManager: typeof LayoutManager;
        SvelteMetadata: typeof Metadata;
        SvelteModelFactory: typeof ModelFactory;
        SvelteConfig: typeof Config;
        SvelteStorage: typeof Storage;
        SvelteAcl: typeof Acl;
        SvelteCollectionFactory: typeof CollectionFactory;
        Tooltip: typeof Tooltip;
        Dropdown: typeof Dropdown;
        Popover: typeof Popover;
    }
}

window.SvelteLanguage = Language;
window.SvelteUserData = UserData;
window.SvelteNotifier = Notifier;
window.SvelteLayoutManager = LayoutManager;
window.SvelteMetadata = Metadata;
window.SvelteModelFactory = ModelFactory;
window.SvelteConfig = Config;
window.SvelteStorage = Storage;
window.SvelteAcl = Acl;
window.SvelteCollectionFactory = CollectionFactory;
window.Dropdown = Dropdown;
window.Popover = Popover;
window.Tooltip = Tooltip;

export {
    ScriptField,
    BoolField,
    TextField,
    MarkdownField,
    WysiwygField,
    SystemUpdatePanel,
    JobManagerButton,
    LayoutComponent,
    EntityContextPanel,
    TreePanel,
    ApiRequestComponent,
    FuzzySearchComponent,
    Navigation,
    Favorites,
    BaseHeader,
    ListHeader,
    ListToolbar,
    PlateToolbar,
    DetailHeader,
    DashboardHeader,
    FilterSearchBar,
    Gallery,
    LocaleSwitcher,
    CurrentSelectionButton,
    FieldStateFilter,
    AnchorNavigation,
    RebuildDatabaseModal,
    Administration,
    SelectionItemList,
    ClusterItemList
};
