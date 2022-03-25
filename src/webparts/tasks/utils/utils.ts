import { cloneDeep } from '@microsoft/sp-lodash-subset';
import { DateTime } from 'luxon';
import ITask from '../models/ITask';
import ITaskLog from '../models/ITaskLog';
import TaskLogsService from '../services/tasklogs';
import { CHANGE_DELETE_RE, CHANGE_ROW_RE, CHANGE_TOKEN_RE } from './constants';

export interface ICustomSorting {
    [id: string]: number[];
}

export function processChangeResult(
    result: string,
    obj: { lastToken: string }
) {
    const newToken = result.match(CHANGE_TOKEN_RE)[1];
    if (!obj.lastToken) {
        obj.lastToken = newToken;
        return false;
    }
    obj.lastToken = newToken;
    return CHANGE_ROW_RE.test(result) || CHANGE_DELETE_RE.test(result);
}

export function isTask(elem: ITask | ITaskLog): elem is ITask {
    return (elem as ITask).AssignedTo !== undefined;
}

export function getTaskId(elem: ITask | ITaskLog) {
    return isTask(elem) ? elem.ID : elem.Task.ID;
}

export function getTime(elem: ITask | ITaskLog) {
    if (isTask(elem)) {
        return elem.Time;
    }
    return elem.Task.Time;
}

export function reorder<T>(list: T[], startIndex, endIndex): T[] {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
}

export function move<T>(
    listFrom: T[],
    listTo: T[],
    indexFrom,
    indexTo
): {
    from: T[];
    to: T[];
} {
    const cloneFrom = cloneDeep(listFrom);
    const cloneTo = cloneDeep(listTo);

    const [removed] = cloneFrom.splice(indexFrom, 1);
    cloneTo.splice(indexTo, 0, removed);
    return {
        from: cloneFrom,
        to: cloneTo,
    };
}

export function getReassignedTaskLog(log: ITaskLog, toUser: number): ITaskLog {
    return {
        ...log,
        User: {
            ...log.User,
            ID: toUser,
        },
    };
}

export function getSortedTaskList(
    tasks: ITask[],
    taskLogs: ITaskLog[],
    userId: number,
    customSorting: ICustomSorting = {}
): (ITask | ITaskLog)[] {
    let result: (ITask | ITaskLog)[] = [...taskLogs, ...tasks];
    result.sort((a, b) => {
        const dtA = DateTime.fromISO(getTime(a)).toISOTime();
        const dtB = DateTime.fromISO(getTime(b)).toISOTime();
        return dtA < dtB ? -1 : 1;
    });
    if (customSorting[userId.toString()] !== undefined) {
        // Map [task id]: current index
        const map = new Map(
            customSorting[userId.toString()].map((id, idx) => [id, idx])
        );
        result.sort((t1, t2) => {
            const id1 = getTaskId(t1);
            const id2 = getTaskId(t2);
            if (!map.has(id1) || !map.has(id2)) return 0;
            return map.get(id1) - map.get(id2);
        });
    }
    return result;
}

/**
 * Matches the tasks with the task logs.
 * If there are tasks without match, a task log is created from them.
 * Then, the newly created tasks are retrieved from the list and returned to the client
 *
 * @param tasks - the list of tasks assigned to current user
 * @param logs - the list of concrete task logs currently created from assigned tasks
 * @returns newly created logs
 */
export async function checkTasksAndCreateTaskLogs(
    tasks: ITask[],
    logs: ITaskLog[],
    date: Date,
    logService: TaskLogsService
) {
    let missing: ITask[] = [];
    let logSet = new Set(logs.map((log) => log.Task.ID));
    tasks.forEach((task) => {
        if (!logSet.has(task.ID)) {
            missing.push(task);
        }
    });
    const results = await logService.createTaskLogs(missing, date);
    let newLogs =
        results.length === 0
            ? []
            : await logService.getTaskLogsFromAddResult(results);
    return newLogs;
}
