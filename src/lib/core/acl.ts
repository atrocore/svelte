/*
 * AtroCore Software
 *
 * This source file is available under GNU General Public License version 3 (GPLv3).
 * Full copyright and license information is available in LICENSE.txt, located in the root directory.
 *
 * @copyright  Copyright (c) AtroCore GmbH (https://www.atrocore.com)
 * @license    GPLv3 (https://www.gnu.org/licenses/)
 */

import { writable } from 'svelte/store';

interface AclInterface {
    getUser(): any,

    checkScope(data: any, action: any, precise: any, entityAccessData: any): boolean,

    checkModel(model: any, data: any, action: any, precise: any): boolean,

    checkModelDelete(model: any, data: any, precise: any): boolean,

    checkIsOwner(model: any): boolean,

    checkInTeam(model: any): boolean,

    check(subject: any, action: any, precise: any): boolean

    checkScopeHasAcl(scope: string): boolean

    getScopeForbiddenFieldList(scope: string, action: string): any

    getForbiddenLanguageList(action: string): any
}

const data = writable<AclInterface>();

export const Acl = {

    setAcl(acl: AclInterface): void {
        data.set(acl);
    },

    getUser() {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.getUser();
            }
        })();
        return res;
    },

    checkScope(dataV: any, action: any, precise: any, entityAccessData: any) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.checkScope(dataV, action, precise, entityAccessData);
            }
        })();
        return res;
    },

    checkModel(model: any, dataV: any, action: any, precise: any) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.checkModel(model, dataV, action, precise);
            }
        })();
        return res;
    },

    checkModelDelete(model: any, dataV: any, precise: any) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.checkModelDelete(model, dataV, precise);
            }
        })();
        return res;
    },

    checkIsOwner(model: any) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.checkIsOwner(model);
            }
        })();
        return res;
    },

    checkInTeam(model: any) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.checkInTeam(model);
            }
        })();
        return res;
    },

    check(subject: any, action: any, precise: any = null) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.check(subject, action, precise);
            }
        })();
        return res;
    },

    checkScopeHasAcl(scope: string) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.checkScopeHasAcl(scope);
            }
        })();
        return res;
    },

    getScopeForbiddenFieldList(scope: string, action: string) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.getScopeForbiddenFieldList(scope, action);
            }
        })();

        return res;
    },

    getForbiddenLanguageList(action: string) {
        let res = null
        data.subscribe((current: AclInterface) => {
            if (current) {
                res = current.getForbiddenLanguageList(action);
            }
        })();
        return res;
    }


};