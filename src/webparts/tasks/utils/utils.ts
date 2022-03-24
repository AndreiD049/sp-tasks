import { DateTime } from 'luxon';
import ITask from '../models/ITask';
import ITaskLog from '../models/ITaskLog';
import { CHANGE_DELETE_RE, CHANGE_ROW_RE, CHANGE_TOKEN_RE } from './constants';

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
};
export interface ICustomSorting {
    [id: string]: number[];
}

export function getSortedTaskList(
    tasks: ITask[],
    taskLogs: ITaskLog[],
    userId: number,
    customSorting: ICustomSorting = {},
): (ITask | ITaskLog)[] {
    const taskLogSet = new Set(taskLogs.map((t) => t.Task.ID));
    let result: (ITask | ITaskLog)[] = [
        ...taskLogs,
        ...tasks.filter(t => !taskLogSet.has(t.ID))
    ];
    result.sort((a, b) => {
        const dtA = DateTime.fromISO(getTime(a)).toISOTime();
        const dtB = DateTime.fromISO(getTime(b)).toISOTime();
        return dtA < dtB ? -1 : 1;
    })
    if (customSorting[userId.toString()] !== undefined) {
        // Map [task id]: current index
        const map = new Map(customSorting[userId.toString()].map((id, idx) => [id, idx]));
        result.sort((t1, t2) => {
            const id1 = getTaskId(t1);
            const id2 = getTaskId(t2);
            if (!map.has(id1) || !map.has(id2)) return 0;
            return map.get(id1) - map.get(id2);
        });
    }
    return result;
}
