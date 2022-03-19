import { WebPartContext } from '@microsoft/sp-webpart-base';

import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/batching';
import '@pnp/sp/fields';
import '@pnp/sp/site-users/web';
import RPMController from './rpm-controller';

var _context: WebPartContext = null;
var _sp: { [k: string]: SPFI } = {};
var _controller = null;
var _tennants = null;

export const setupSP = (
    context: WebPartContext,
    tennants?: { [k: string]: string }
): void => {
    _tennants = tennants;
    _controller = RPMController(1000, context);
    _context = context;
    _sp['Default'] = spfi().using(SPFx(context), _controller);
    if (tennants) {
        for (const key of Object.keys(tennants)) {
            _sp[key] = spfi(tennants[key]).using(SPFx(context), _controller);
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

export const getNewSP = (key?: string): SPFI => {
    if (!key) {
        return spfi().using(SPFx(_context), _controller);
    }
    if (_context === null) throw Error('Setup was not called');
    if (!(key in _tennants)) throw Error(`No '${key}' in tennants. Check your setup or key. Avilable options are: ${Object.keys(_tennants).join(', ')}`);
    return spfi(_tennants[key]).using(SPFx(_context), _controller);
}
