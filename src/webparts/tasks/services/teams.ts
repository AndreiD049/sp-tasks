import { Caching } from '@pnp/queryable';
import { SPFI } from '@pnp/sp';
import { IItems } from '@pnp/sp/items';
import { IList } from '@pnp/sp/lists';
import { getSP } from 'sp-preset';
import { convertToUser, IUser } from '../models/IUser';
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
        private roleCol: string
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
        return convertToUser(
            (
                await this._wrap(
                    this.list.items
                        .filter(`${this.userCol}Id eq ${currentUser.Id}`)
                        .top(1)
                )()
            )[0],
            this.userCol,
            this.teamCol,
            this.roleCol
        );
    }

    async getCurrentUserTeamMembers(): Promise<IUser[]> {
        const currentUser = await this.getCurrentUser();

        const filter = currentUser.Teams.map(
            (t) => `${this.teamCol} eq '${t}'`
        ).join(' or ');
        const members = this._wrap(
            this.list.items.filter(
                `(${filter}) and ${this.userCol}Id ne ${currentUser.User.ID}`
            )
        )();
        return members.then((users) =>
            users.map((user) =>
                convertToUser(user, this.userCol, this.teamCol, this.roleCol)
            )
        );
    }

    private _wrap(items: IItems) {
        return items.select(...this.select).expand(...this.expand);
    }
}
