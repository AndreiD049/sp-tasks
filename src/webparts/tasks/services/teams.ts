import { Caching } from '@pnp/queryable';
import { SPFI } from '@pnp/sp';
import { IItems } from '@pnp/sp/items';
import { IList } from '@pnp/sp/lists';
import { getSP } from '../../../pnp-preset/pnpjs-presets';
import { IUser } from '../models/IUser';
import { HOUR } from '../utils/constants';
import UserService from './users';

const LIST_NAME_RE = /^.*sharepoint.com\/(sites|teams)\/.*\/(\w+)$/;

export default class TeamService {
    usersSP: SPFI;
    userService: UserService;
    list: IList;
    select: string[];
    expand: string[];

    constructor(
        url: string,
        private userCol: string,
        private teamCol: string,
        roleCol: string
    ) {
        this.userService = new UserService();
        this.usersSP = getSP('Users').using(
            Caching({
                expireFunc: (_url: string) =>
                    new Date(new Date().getTime() + HOUR),
            })
        );
        const listName = url?.match(LIST_NAME_RE)[2];
        this.list = this.usersSP.web.lists.getByTitle(listName);
        this.select = [
            `${userCol}/ID`,
            `${userCol}/Title`,
            `${userCol}/EMail`,
            teamCol,
            roleCol,
        ];
        this.expand = [userCol];
    }

    async getCurrentUser(): Promise<IUser> {
        const currentUser = await this.userService.getCurrentUser();
        return (await this._wrap(
            this.list.items
                .filter(`${this.userCol}Id eq ${currentUser.Id}`)
                .top(1)
        )())[0];
    }

    async getCurrentUserTeamMembers(): Promise<IUser[]> {
        const currentUser = await this.getCurrentUser();
        const filter = currentUser.Teams.map((t) => `${this.teamCol} eq '${t}'`).join(' or ');
        return this._wrap(
            this.list.items.filter(`(${filter}) and ${this.userCol}Id ne ${currentUser.User.ID}`)
        )();
    }

    private _wrap(items: IItems) {
        return items.select(...this.select).expand(...this.expand);
    }

    private hasMultipleTeams(val: string | string[]): val is string[] {
        return val.length !== undefined;
    }
}
