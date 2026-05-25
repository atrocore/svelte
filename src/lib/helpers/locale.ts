/*
  AtroCore Software

  This source file is available under GNU General Public License version 3 (GPLv3).
  Full copyright and license information is available in LICENSE.txt, located in the root directory.

  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
  @license    GPLv3 (https://www.gnu.org/licenses/)
*/

import { Config } from '$lib/core/config';
import { Storage } from '$lib/core/storage';

export type LocaleSettings = {
    thousandSeparator: string;
    decimalMark: string;
};

export function getLocaleSettings(): LocaleSettings {
    const locales: Record<string, any> = Config.get('locales') ?? {};

    let localeId: string = Storage.get('user', 'locale');
    if (!localeId || !locales[localeId]) {
        localeId = Config.get('locale') ?? '';
    }
    if (!localeId || !locales[localeId]) {
        localeId = 'main';
    }

    const locale = locales[localeId];
    return {
        thousandSeparator: locale?.thousandSeparator ?? ',',
        decimalMark:       locale?.decimalMark       ?? '.',
    };
}
