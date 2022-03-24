import * as React from 'react';
import ITask from '../models/ITask';
import ITaskLog from '../models/ITaskLog';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';
import { getSortedTaskList, ICustomSorting } from '../utils/utils';

export interface ITasksPerUser {
    [user: string]: {
        user: IUser;
        result: (ITask | ITaskLog)[];
    };
}

export function useTasksPerUser(
    tasks: ITask[],
    taskLogs: ITaskLog[],
    userIds: number[],
    selectedUsers: IUser[],
    customSorting: ICustomSorting
) {
    const { currentUser } = React.useContext(GlobalContext);
    const tasksPerUser = React.useMemo(() => {
        const result: ITasksPerUser = {};

        userIds.forEach((id) => {
            const user =
                id === currentUser.User.ID
                    ? currentUser
                    : selectedUsers.find((u) => u.User.ID === id);
            const userTasks = tasks.filter((t) => t.AssignedTo.ID === id);
            const userTaskLogs = taskLogs.filter((l) => l.User.ID === id);
            const userResult = getSortedTaskList(
                userTasks,
                userTaskLogs,
                id,
                customSorting
            );
            result[id] = {
                user,
                result: userResult,
            };
        });

        return result;
    }, [tasks, taskLogs, customSorting]);

    return tasksPerUser;
}
