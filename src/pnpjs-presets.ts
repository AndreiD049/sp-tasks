import { WebPartContext } from '@microsoft/sp-webpart-base';

import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/batching';
import '@pnp/sp/fields';
import '@pnp/sp/site-users/web';

var _context: WebPartContext = null;
var _sp: { [k: string]: SPFI } = {};

export const setupSP = (
    context: WebPartContext,
    tennants?: { [k: string]: string }
): void => {
    _context = context;
    _sp['Default'] = spfi().using(SPFx(context));
    if (tennants) {
        for (const key of Object.keys(tennants)) {
            _sp[key] = spfi(tennants[key]).using(SPFx(context));
        }
    }
};

export const getSP = (key?: string): SPFI => {
    if (!key) {
        key = 'Default';
    }
    if (_context === null) throw Error('Setup was not called');
    return _sp[key];
};
