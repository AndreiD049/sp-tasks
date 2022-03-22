import { Caching } from '@pnp/queryable';
import { SPFI } from '@pnp/sp';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import { getNewSP } from 'sp-preset';
import { HOUR } from '../utils/constants';

export default class UserService {
    sp: SPFI;
    usersSP: SPFI;

    constructor() {
        this.sp = getNewSP().using(Caching());
    }

    async getSiteUsers() {
        return this.sp.web.siteUsers();
    }

    async getUser(title: string) {
        return (await this.getSiteUsers()).find((u) => u.Title === title);
    }

    async getCurrentUser(): Promise<ISiteUserInfo> {
        return this.sp.web.currentUser();
    }
}
