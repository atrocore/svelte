/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import * as monaco from 'monaco-editor';

export function registerEditorTheme(): void {
    monaco.editor.defineTheme('twig', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'twig.keyword', foreground: '0451A5', fontStyle: 'bold' },
            { token: 'twig.tagDelimiter', foreground: '0451A5', fontStyle: 'bold' },
            { token: 'twig.variable', foreground: '267F99' },
            { token: 'twig.operator', foreground: '000000' },
            { token: 'twig.string', foreground: 'A31515' },
            { token: 'twig.delimiter', foreground: '0000FF' },
            { token: 'twig.filter', foreground: '795E26' },
            { token: 'twig.number', foreground: '098658' },
            { token: 'twig.comment', foreground: '808080', fontStyle: 'italic' },
            { token: 'expr.keyword', foreground: '0451A5', fontStyle: 'bold' },
            { token: 'expr.operator', foreground: '000000' },
            { token: 'expr.string', foreground: 'A31515' },
            { token: 'expr.number', foreground: '098658' },
            { token: 'expr.identifier', foreground: '267F99' },
            { token: 'expr.function', foreground: '795E26' }
        ],
        colors: {
            'editor.background': '#FFFFFE',
            'editor.foreground': '#000000',
            'editor.inactiveSelectionBackground': '#E5EBF1',
            'editorIndentGuide.background1': '#D3D3D3',
            'editorIndentGuide.activeBackground1': '#939393',
            'editor.selectionHighlightBackground': '#ADD6FF4D',
            'editorHoverWidget.background': '#F8F8F8',
            'editorHoverWidget.border': '#C8C8C8',
            'editorHoverWidget.statusBarBackground': '#E7E7E7'
        }
    });
}
