import { Caching } from '@pnp/queryable'
import { SPFI } from '@pnp/sp'
import { ISiteUser, ISiteUserInfo } from '@pnp/sp/site-users/types'
import { getSP } from '../../../pnpjs-presets'

export default class UserService {
    sp: SPFI

    constructor() {
        this.sp = getSP().using(Caching())
    }

    async getSiteUsers() {
        return this.sp.web.siteUsers()
    }

    async getUser(title: string) {
        return (await this.getSiteUsers()).find((u) => u.Title === title)
    }

    async getCurrentUser(): Promise<ISiteUserInfo> {
        return this.sp.web.currentUser();
    }
}
