import { cloneDeep } from '@microsoft/sp-lodash-subset';
import { DateTime } from 'luxon';
import ITask, { WeekDay, WeekDayMap } from '../models/ITask';
import ITaskLog from '../models/ITaskLog';
import { IUser } from '../models/IUser';
import TaskLogsService from '../services/tasklogs';
import { CHANGE_DELETE_RE, CHANGE_ROW_RE, CHANGE_TOKEN_RE } from './constants';

export interface ICustomSorting {
    [id: string]: string[];
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

export function getTaskUniqueId(elem: ITask | ITaskLog): string {
    return isTask(elem) ? `T-${elem.ID}` : `TL-${elem.ID}`;
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

export function getReassignedTaskLog(log: ITaskLog, toUser: number, users: IUser[]): ITaskLog {
    const newUser = users.find(u => u.User.ID === toUser);
    return {
        ...log,
        User: newUser.User,
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
            const id1 = getTaskUniqueId(t1);
            const id2 = getTaskUniqueId(t2);
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

export interface IDateStatistics {
    dt: DateTime;
    isWorkDay: boolean;
    weekday: number;
    daysInMonth: number;
    workdaysInMonth: number;
    nthDay: number;
    nthWorkday: number;
};

export function getDateStatistics(date: Date): IDateStatistics {
    const dt = DateTime.fromJSDate(date);
    const result: IDateStatistics = {
        dt,
        weekday: dt.weekday,
        isWorkDay: dt.weekday < 6,
        daysInMonth: dt.daysInMonth,
        workdaysInMonth: getNumberOfWorkdays(dt),
        nthDay: dt.day,
        nthWorkday: getNthWorkday(dt),
    };
    return result;
}

export function getNumberOfWorkdays(dt: DateTime): number {
    // We get the weekday, 1 is Monday and 7 is Sunday.
    // It can be any day from 1 to 7
    // Thus, i can calculate number of workdays in the first week of the month
    // Ex: weekday is Tue = 2 => 7 - 2 + 1 = 6 days in the first week
    // It means number of workdays will be = daysInFirstWeek - 2, or 0 if < 0
    const daysInFirstWeek = 7 - dt.startOf('month').weekday + 1;
    // Then we can calculate number of days in the rest of the month
    // without first week, so we can calculate number of full weeks
    // Ex: having a 31 day month and 5 days in first week, we get
    // 31 - 5 = 26 days without first week
    const daysWithoutFirstWeek = dt.daysInMonth - daysInFirstWeek;
    // Now we can know the number of full weeks
    // Each full week has 5 workdays
    // Ex: floor(26 / 7) = 3 full weeks
    const fullWeeks = Math.floor(daysWithoutFirstWeek / 7)
    // And we can get the amount of remaining days at the end of the month
    // that do not form a full week, for example monday till Thursday
    // The amount of workdays is always equal to min(5, number of days in the week)
    // Ex: 26 mod 7 = 5 days remaining
    const lastWeekDays = daysWithoutFirstWeek % 7;
    // Now we can calculate the result
    // Ex: max(daysInFirstWeek - 2, 0) + fullWeeks * 5 + min(lastWeekDays, 5);
    return Math.max(daysInFirstWeek - 2, 0) + fullWeeks * 5 - Math.min(lastWeekDays, 5);
}

export function getNthWorkday(dt: DateTime): number {
    // We can calculate the number of workdays by knowing the weekday and the day in month
    const fullWeeks = Math.floor((dt.day - 1) / 7);
    // We also need to know the number of days in the first week
    // which is potentially 0 if month starts with monday.
    const firstWeekDays = (dt.day - 1) % 7;
    
    return fullWeeks * 5 + Math.min(dt.weekday, 5) + Math.max(firstWeekDays - 2, 0);
}

export function getWeekDaySet(daysList: WeekDay[]): Set<number> {
    return new Set(daysList.map(d => WeekDayMap[d]));
}