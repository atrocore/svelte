/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

type ClusterItem = {
    id: string;
    name: string;
    entityType: string;
    isMaster: boolean;
    confirm: boolean;
    confirmedAutomatically: boolean;
    rejected: boolean;
}

export default ClusterItem;
