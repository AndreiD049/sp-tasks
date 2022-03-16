import { Caching } from '@pnp/queryable';
import { SPFI } from '@pnp/sp';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import { getSP } from '../../../pnpjs-presets';
import { IUser } from '../models/IUser';
import { HOUR } from '../utils/constants';

export default class UserService {
    sp: SPFI;
    usersSP: SPFI;

    constructor() {
        this.sp = getSP().using(Caching());
        this.usersSP = getSP('Users').using(
            Caching({
                expireFunc: (_url: string) =>
                    new Date(new Date().getTime() + HOUR),
            })
        );
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
