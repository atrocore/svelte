/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

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