const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const USER_WEB_RE = /^(.*sharepoint.com\/(sites|teams)\/.*)\/Lists/;
const CHANGE_TOKEN_RE = /LastChangeToken=['"](.*?)['"]/;
const CHANGE_ROW_RE = /\<.?\:row/;

export {
    MINUTE,
    HOUR,
    USER_WEB_RE,
    CHANGE_TOKEN_RE,
    CHANGE_ROW_RE,
};