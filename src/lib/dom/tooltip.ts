/*
 *  AtroCore Software
 *
 *  This source file is available under GNU General Public License version 3 (GPLv3).
 *  Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 *  @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 *  @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import 'tippy.js/dist/tippy.css';
import 'tippy.js/dist/border.css';

import tippy, { Instance, Props, SingleTarget } from "tippy.js";

type HTMLElementWithTooltip = HTMLElement & { _tippy: Instance };

function getTooltipContent(el: Element): string {
    const titleText = el.getAttribute('data-original-title') || el.getAttribute('title');
    let content = `<div>${titleText}</div>`;

    const titleLink = el.getAttribute('data-original-title-link') || el.getAttribute('data-title-link');
    if (titleLink) {
        content += `<div class="tippy-footer"><a href="${titleLink}" target="_blank"><u>Read more</u></a></div>`;
    }

    return content;
}

export const Tooltip = {
    create: (target: SingleTarget, props: Partial<Props>): Instance => {
        return tippy(target, props);
    },

    initWithinNode: (node: Element): void => {
        node.querySelectorAll('[title]').forEach(el => {
            // do not set tooltips for the summernote wysiwyg editor
            if (el.closest('.note-toolbar')) {
                return;
            }

            if (!el.getAttribute('title')) {
                return;
            }

            if (!el.getAttribute('data-original-title')) {
                el.setAttribute('data-original-title', el.getAttribute('title') || '');
            }

            if (el.getAttribute('data-title-link') && !el.getAttribute('data-original-title-link')) {
                el.setAttribute('data-original-title-link', el.getAttribute('data-title-link') || '');
            }

            const tooltipEl = el as HTMLElementWithTooltip;
            if (tooltipEl.dataset.tippy) {
                if (tooltipEl._tippy) {
                    tooltipEl._tippy.setContent(getTooltipContent(el));
                }
            } else {
                window.Tooltip.create(tooltipEl, {
                    appendTo: () => document.body,
                    maxWidth: 350,
                    content: getTooltipContent(el),
                    allowHTML: true,
                    trigger: 'mouseenter',
                    delay: [500, 0],
                    touch: ['hold', 500],
                    hideOnClick: true,
                    interactive: true,
                    onShow(instance) {
                        const items = document.querySelectorAll('[data-tippy-root]') as NodeListOf<HTMLElementWithTooltip>;
                        items.forEach(tip => {
                            if (tip !== instance.popper) {
                                tip._tippy.hide();
                            }
                        });
                    }
                });

                tooltipEl.setAttribute('data-tippy', 'true');
                tooltipEl.removeAttribute('title');
                tooltipEl.removeAttribute('data-title-link');
            }
        });
    },

    processMutation: (mutation: MutationRecord): void => {
        mutation.removedNodes.forEach(node => {
            if (!(node instanceof HTMLElement)) return;
            const withTooltip = node.querySelectorAll?.('[data-tippy]') as NodeListOf<HTMLElementWithTooltip>;
            withTooltip?.forEach(el => {
                if (el._tippy) {
                    el._tippy.destroy();
                }
            });

            const tooltipNode = node as HTMLElementWithTooltip;
            if (tooltipNode.dataset?.tippy && tooltipNode._tippy) {
                tooltipNode._tippy.destroy();
            }
        });

        const el = mutation.target as HTMLElementWithTooltip;

        if (el.getAttribute('title')) {
            el.setAttribute('data-original-title', el.getAttribute('title') || '');
        }
        if (el.getAttribute('data-title-link')) {
            el.setAttribute('data-original-title-link', el.getAttribute('data-title-link') || '');
        }

        if (el.dataset.tippy && el._tippy) {
            const tooltipContent = getTooltipContent(el);
            if (tooltipContent) {
                el._tippy.setContent(getTooltipContent(el));
                el.removeAttribute('title');
                el.removeAttribute('data-title-link');
            } else {
                el._tippy.destroy();
                el.removeAttribute('data-tippy');
                el.removeAttribute('title');
            }
        } else {
            Tooltip.initWithinNode(el);
        }
    }
}