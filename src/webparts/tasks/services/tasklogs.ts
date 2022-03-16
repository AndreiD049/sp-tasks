import { SPFI } from '@pnp/sp';
import { IList } from '@pnp/sp/lists';
import { getSP } from '../../../pnpjs-presets';
import ITaskLog from '../models/ITaskLog';
import { ITasksWebPartProps } from '../TasksWebPart';
import UserService from './users';
import { DateTime } from 'luxon';
import ITask from '../models/ITask';
import { IItemAddResult, IItems } from '@pnp/sp/items';

const LOG_SELECT = [
    'ID',
    'Task/ID',
    'Task/Title',
    'Task/Description',
    'Task/Time',
    'Date',
    'DateTimeStarted',
    'DateTimeFinished',
    'Status',
    'User/ID',
    'User/Title',
    'User/EMail',
    'Remark',
];

const LOG_EXPAND = ['Task', 'User'];

export default class TaskLogsService {
    userService: UserService;
    rootSP: SPFI;
    sp: SPFI;
    list: IList;
    listName: string;

    constructor(props: ITasksWebPartProps) {
        this.sp = getSP('Data');
        this.rootSP = getSP();
        this.list = this.sp.web.lists.getByTitle(props.taskLogsListTitle);
        this.listName = props.taskLogsListTitle;
        this.userService = new UserService();
    }

    /**
     * Get task logs.
     * Possible parameters:
     *  - date: Date - filters on Date of the task log
     *  - user: string | number - if number, should be user's id, if string should be user's title
     * Without any parameters will return all task logs
     */
    async getTaskLogs(): Promise<ITaskLog[]>;
    async getTaskLogs(date: Date): Promise<ITaskLog[]>;
    async getTaskLogs(date: Date, user: number): Promise<ITaskLog[]>;
    async getTaskLogs(date: Date, user: string): Promise<ITaskLog[]>;
    async getTaskLogs(
        date?: Date,
        user?: number | string
    ): Promise<ITaskLog[]> {
        if (date === undefined) {
            date = new Date();
        }
        if (user === undefined) {
            user = (await this.userService.getCurrentUser()).Id;
        }
        if (typeof user === 'string') {
            user = (await this.userService.getUser(user)).Id;
        }
        const filter = `(Date eq '${DateTime.fromJSDate(
            date
        ).toISODate()}') and (UserId eq ${user})`;
        return this._wrap(this.list.items.filter(filter))();
    }

    async getTaskLogsByUserIds(date: Date, ids: number[]): Promise<ITaskLog[]> {
        let res: ITaskLog[] = [];
        const [batchedSP, execute] = this.sp.batched();
        const dt = DateTime.fromJSDate(date).toISODate();
        const list = batchedSP.web.lists.getByTitle(this.listName);
        ids.forEach((id) => {
            this._wrap(list.items.filter(`(Date eq '${dt}') and (UserId eq ${id})`))()
            .then(r => res = res.concat(r));
        });

        await execute();
        return res;
    }

    /**
     * Create a new task log from a task.
     * In order to create the task we should know:
     *  - User to which the task is assigned
     *  - Date of the task (default today)
     */
    async createTaskLogs(tasks: ITask[], date?: Date) {
        const [batchSP, execute] = this.sp.batched();
        if (date === undefined) {
            date = new Date();
        }

        let res: IItemAddResult[] = [];

        tasks.forEach((task) => {
            batchSP.web.lists
                .getByTitle(this.listName)
                .items.add(this.createLogFromTask(task, date))
                .then((r) => res.push(r));
        });
        await execute();
        return res;
    }

    async updateTaskLog(id: number, update: Partial<ITaskLog>) {
        return (await this.list.items.getById(id).update(update)).item
            .select(...LOG_SELECT)
            .expand(...LOG_EXPAND)();
    }

    async getTaskLogsFromAddResult(
        results: IItemAddResult[]
    ): Promise<ITaskLog[]> {
        return Promise.all(
            results.map(
                async (res) =>
                    await res.item.select(...LOG_SELECT).expand(...LOG_EXPAND)()
            )
        );
    }

    private createLogFromTask(task: ITask, date: Date): Partial<ITaskLog> {
        return {
            Date: DateTime.fromJSDate(date).toISODate(),
            Status: 'Open',
            TaskId: task.ID,
            UserId: task.AssignedTo.ID,
        };
    }

    private _wrap(items: IItems) {
        return items
            .orderBy('Task/Time', true)
            .select(...LOG_SELECT)
            .expand(...LOG_EXPAND);
    }
}
