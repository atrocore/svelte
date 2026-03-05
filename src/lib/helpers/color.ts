/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

export function getBorder(col: string): string {
    let amt = -10;
    let num = parseInt(col.slice(1), 16);
    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    let color = (g | (b << 8) | (r << 16)).toString(16);
    while (color.length < 6) {
        color = '0' + color;
    }

    return '1px solid #' + color;
}

export function getFontColor(backgroundColor: string): string {
    let color = '#000';
    if (backgroundColor) {
        backgroundColor = backgroundColor.slice(1);
        let r = parseInt(backgroundColor.substr(0, 2), 16);
        let g = parseInt(backgroundColor.substr(2, 2), 16);
        let b = parseInt(backgroundColor.substr(4, 2), 16);
        let l = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (l >= 0.5) {
            color = '#fff';
        }
    }
    return color;
}
