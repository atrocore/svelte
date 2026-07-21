/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export default interface Collection {
    name: string;

    url: string;

    total: number;

    offset: number;

    maxSize: number;

    sortBy: string;

    asc: boolean;

    where: Array<object>;

    whereAdditional: Array<object>;

    fetchOnlyCollection: boolean;

    lengthCorrection: number;

    fetch: Function;

    fetchTotal: Function,
}