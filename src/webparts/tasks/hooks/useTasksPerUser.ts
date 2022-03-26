import { cloneDeep } from '@microsoft/sp-lodash-subset';
import * as React from 'react';
import ITask from '../models/ITask';
import ITaskLog from '../models/ITaskLog';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';
import { getSortedTaskList, ICustomSorting } from '../utils/utils';

export interface IUserTasks {
    user: IUser;
    result: (ITask | ITaskLog)[];
}

export interface ITasksPerUser {
    [user: string]: IUserTasks;
}

export interface ITaskPerUserResult {
    tasks: ITasksPerUser;
    reorder: (
        userId: number,
        startIndex: number,
        endIndex: number
    ) => IUserTasks;
    move: (
        userFromId: number,
        userToId: number,
        indexFrom: number,
        indexTo: number
    ) => {
        from: IUserTasks;
        to: IUserTasks;
    };
}

export function useTasksPerUser(
    tasks: ITask[],
    taskLogs: ITaskLog[],
    userIds: number[],
    selectedUsers: IUser[],
    customSorting: ICustomSorting
): ITaskPerUserResult {
    const { currentUser } = React.useContext(GlobalContext);
    const [tasksPerUser, setTasksPerUser] = React.useState<ITasksPerUser>({});

    /**
     * Handle user reordering tasks via drag and drop
     * @param userId - User whose task is reordered
     * @param startIndex - initial position of the task
     * @param endIndex - position of the task after drop
     * Returns the reordered User tasks
     */
    const handleReorder = (
        userId: number,
        startIndex: number,
        endIndex: number
    ) => {
        const cloneUser = cloneDeep(tasksPerUser[userId.toString()]);
        // Remove from previous location
        const [removed] = cloneUser.result.splice(startIndex, 1);
        // Insert to new location
        cloneUser.result.splice(endIndex, 0, removed);

        setTasksPerUser((prev) => ({
            ...prev,
            [userId.toString()]: cloneUser,
        }));
        return cloneUser;
    };

    /**
     *
     * @param userFromId - Original owner of the task
     * @param userToId - New owner of the task
     * @param indexFrom - From which position the task was taken
     * @param indexTo - New position the task was placed
     * Returns both reordered tasks (original and final columns)
     */
    const handleMove = (
        userFromId: number,
        userToId: number,
        indexFrom: number,
        indexTo: number
    ) => {
        const cloneFrom = cloneDeep(tasksPerUser[userFromId.toString()]);
        const cloneTo = cloneDeep(tasksPerUser[userToId.toString()]);

        const [removed] = cloneFrom.result.splice(indexFrom, 1);
        cloneTo.result.splice(indexTo, 0, removed);

        setTasksPerUser((prev) => ({
            ...prev,
            [userFromId.toString()]: cloneFrom,
            [userToId.toString()]: cloneTo,
        }));

        return {
            from: cloneFrom,
            to: cloneTo,
        };
    };

    React.useMemo(() => {
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

        setTasksPerUser(result);
    }, [tasks, taskLogs, customSorting]);

    return {
        tasks: tasksPerUser,
        move: handleMove,
        reorder: handleReorder,
    };
}
