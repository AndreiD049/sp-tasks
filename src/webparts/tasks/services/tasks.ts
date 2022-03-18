import { Caching } from '@pnp/queryable';
import { SPFI } from '@pnp/sp';
import { IItems } from '@pnp/sp/items';
import { IList } from '@pnp/sp/lists';
import { getNewSP } from '../../../pnp-preset/pnpjs-presets';
import ITask from '../models/ITask';
import { ITasksWebPartProps } from '../TasksWebPart';
import { processChangeResult } from '../utils/utils';
import UserService from './users';

const TASK_SELECT = [
    'ID',
    'Title',
    'Description',
    'AssignedTo/ID',
    'AssignedTo/Title',
    'AssignedTo/EMail',
    'Time',
    'Type',
];

const TASK_EXPAND = ['AssignedTo'];

class TaskService {
    userService: UserService;
    sp: SPFI;
    list: IList;
    listTitle: string;
    lastToken: string;


    constructor(public props: ITasksWebPartProps) {
        this.sp = getNewSP('Data').using(Caching());
        this.list = this.sp.web.lists.getByTitle(props.tasksListTitle);
        this.listTitle = props.tasksListTitle;
        this.userService = new UserService();
        this.lastToken = null;
    }

    async getTasks() {
        return this.list.items.select(...TASK_SELECT).expand(...TASK_EXPAND)();
    }

    async getTasksByUserId(userId: number) {
        return this._wrap(this.list.items
            .filter(`AssignedToId eq ${userId}`))();
    }

    /**
     * This is a rather strange method, but as long as it works
     * CAML queries should be used here
     * See: https://docs.microsoft.com/en-us/sharepoint/dev/schema/introduction-to-collaborative-application-markup-language-caml
     */
    async didTasksChanged(userIds: number[]): Promise<boolean> {
        const values = userIds.map(id => `<Value Type='User'>${id}</Value>`).join();
        const result = await this.list.getListItemChangesSinceToken({
            RowLimit: '1',
            Query: 
            `<Where>
                <In>
                    <FieldRef Name='AssignedTo' LookupId='TRUE'/>
                    <Values>
                        ${values}
                    </Values>
                </In>
            </Where>`,
            ChangeToken: this.lastToken,
        });
        return processChangeResult(result, this);
    }

    async getTasksByMultipleUserIds(userIds: number[]) {
        let res: ITask[] = [];
        const [batchedSP, execute] = this.sp.batched();
        const list = batchedSP.web.lists.getByTitle(this.listTitle);
        userIds.forEach((id) => this._wrap(list.items
            .filter(`AssignedToId eq ${id}`))()
            .then(r => res = res.concat(r)));
        await execute();
        return res;
    }

    async getTasksByUserTitle(userTitle: string) {
        const user = await this.userService.getUser(userTitle);
        return this.getTasksByUserId(user.Id);
    }

    private _wrap(items: IItems) {
        return items
            .orderBy('Time', true)
            .select(...TASK_SELECT)
            .expand(...TASK_EXPAND);
    }
}

export default TaskService;
