import { SPFI } from '@pnp/sp'
import { IList } from '@pnp/sp/lists'
import { getSP } from '../../../pnpjs-presets'
import { ITasksWebPartProps } from '../TasksWebPart'
import UserService from './users'

const TASK_SELECT = [
    'ID',
    'Title',
    'Description',
    'AssignedTo/ID',
    'AssignedTo/Title',
    'AssignedTo/EMail',
    'Time',
    'Type',
]

const TASK_EXPAND = ['AssignedTo']

class TaskService {
    userService: UserService
    rootSP: SPFI
    sp: SPFI
    list: IList

    constructor(public props: ITasksWebPartProps) {
        this.sp = getSP('Data')
        this.rootSP = getSP()
        this.list = this.sp.web.lists.getByTitle(props.tasksListTitle)
        this.userService = new UserService()
    }

    async getTasks() {
        return this.list.items.select(...TASK_SELECT).expand(...TASK_EXPAND)()
    }

    async getTasksByUserId(userId: number) {
        return this.list.items
            .filter(`AssignedToId eq ${userId}`)
            .select(...TASK_SELECT)
            .expand(...TASK_EXPAND)()
    }

    async getTasksByUserTitle(userTitle: string) {
        const user = await this.userService.getUser(userTitle)
        return this.getTasksByUserId(user.Id)
    }
}

export default TaskService
