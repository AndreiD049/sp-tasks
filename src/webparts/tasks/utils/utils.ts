import { CHANGE_DELETE_RE, CHANGE_ROW_RE, CHANGE_TOKEN_RE } from './constants';

export function processChangeResult(result: string, obj: { lastToken: string }) {
    const newToken = result.match(CHANGE_TOKEN_RE)[1];
    if (!obj.lastToken) {
        obj.lastToken = newToken;
        return false;
    }
    obj.lastToken = newToken;
    return CHANGE_ROW_RE.test(result) || CHANGE_DELETE_RE.test(result);
}
