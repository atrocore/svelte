/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

/**
 * An active quality check of an entity, as the metadata describes it in scopes.<Entity>.activeQualityChecks.
 */
type ActiveQualityCheck = {
    name: string,
    tooltip: string | null,
    classificationId: string | null,
}

export default ActiveQualityCheck;
