import { SPFI } from '@pnp/sp';
import { IItems } from '@pnp/sp/items';
import { IList } from '@pnp/sp/lists';
import { getSP } from '../../../pnpjs-presets';
import ITask from '../models/ITask';
import { ITasksWebPartProps } from '../TasksWebPart';
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
    rootSP: SPFI;
    sp: SPFI;
    list: IList;
    listTitle: string;

    constructor(public props: ITasksWebPartProps) {
        this.sp = getSP('Data');
        this.rootSP = getSP();
        this.list = this.sp.web.lists.getByTitle(props.tasksListTitle);
        this.listTitle = props.tasksListTitle;
        this.userService = new UserService();
    }

    async getTasks() {
        return this.list.items.select(...TASK_SELECT).expand(...TASK_EXPAND)();
    }

    async getTasksByUserId(userId: number) {
        return this._wrap(this.list.items
            .filter(`AssignedToId eq ${userId}`))();
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
