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

function getTime(elem: ITask | ITaskLog) {
    if (isTask(elem)) {
        return elem.Time;
    }
    return elem.Task.Time;
}

export function getSortedTaskList(
    tasks: ITask[],
    taskLogs: ITaskLog[]
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
    return result;
}
