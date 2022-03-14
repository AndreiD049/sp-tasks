import { SPFI } from '@pnp/sp'
import { IList } from '@pnp/sp/lists'
import { getSP } from '../../../pnpjs-presets'
import ITaskLog from '../models/ITaskLog'
import { ITasksWebPartProps } from '../TasksWebPart'
import UserService from './users'
import { DateTime } from 'luxon'
import ITask from '../models/ITask'

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
]

const LOG_EXPAND = ['Task', 'User']

export default class TaskLogsService {
    userService: UserService
    rootSP: SPFI
    sp: SPFI
    list: IList

    constructor(props: ITasksWebPartProps) {
        this.sp = getSP('Data')
        this.rootSP = getSP()
        this.list = this.sp.web.lists.getByTitle(props.taskLogsListTitle)
        this.userService = new UserService()
    }

    /**
     * Get task logs.
     * Possible parameters:
     *  - date: Date - filters on Date of the task log
     *  - user: string | number - if number, should be user's id, if string should be user's title
     * Without any parameters will return all task logs
     */
    async getTaskLogs(): Promise<ITaskLog[]>
    async getTaskLogs(date: Date): Promise<ITaskLog[]>
    async getTaskLogs(date: Date, user: number): Promise<ITaskLog[]>
    async getTaskLogs(date: Date, user: string): Promise<ITaskLog[]>
    async getTaskLogs(
        date?: Date,
        user?: number | string
    ): Promise<ITaskLog[]> {
        if (user !== undefined && typeof user === 'number') {
            return this.list.items
                .filter(
                    `(Date eq '${DateTime.fromJSDate(date).toISODate()}') and
                     (UserId eq ${user})`
                )
                .select(...LOG_SELECT)
                .expand(...LOG_EXPAND)()
        }
        if (user !== undefined && typeof user === 'string') {
            const userId = (await this.userService.getUser(user)).Id
            return this.list.items
                .filter(
                    `(Date eq '${DateTime.fromJSDate(date).toISODate()}') and
                     (UserId eq ${userId})`
                )
                .select(...LOG_SELECT)
                .expand(...LOG_EXPAND)()
        }
        if (date !== undefined) {
            return this.list.items
                .filter(`Date eq '${DateTime.fromJSDate(date).toISODate()}'`)
                .select(...LOG_SELECT)
                .expand(...LOG_EXPAND)()
        }
        return this.list.items
            .filter(`UserId eq ${(await this.userService.getCurrentUser()).Id}`)
            .select(...LOG_SELECT)
            .expand(...LOG_EXPAND)()
    }

    /**
     * Create a new task log from a task.
     * In order to create the task we should know:
     *  - User to which the task is assigned
     *  - Date of the task (default today)
     */
    async createTaskLog(task: ITask)
    async createTaskLog(task: ITask, user: number)
    async createTaskLog(task: ITask, user: string)
    async createTaskLog(task: ITask, user: number, date: Date)
    async createTaskLog(task: ITask, user: string, date: Date)
    async createTaskLog(task: ITask, user?: string | number, date?: Date) {
        if (date === undefined) {
            date = new Date()
        }
        if (user === undefined) {
            user = (await this.userService.getCurrentUser()).Id
        }
        let userId = -1
        if (typeof user === 'string') {
            const foundUser = await this.userService.getUser(user)
            if (!foundUser) throw Error(`User ${user} was not found`)
            userId = foundUser.Id
        } else {
            userId = user
        }
        const taskLog: Partial<ITaskLog> = {
            Date: date.toISOString(),
            Status: 'Open',
            DateTimeStarted: DateTime.utc().toJSDate(),
            TaskId: task.ID,
            UserId: userId,
        }
        return this.list.items.add(taskLog)
    }
}
