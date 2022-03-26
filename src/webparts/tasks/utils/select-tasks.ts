import ITask, { TaskType } from "../models/ITask";
import { getDateStatistics, getWeekDaySet, IDateStatistics } from "./utils";

export function selectTasks(list: ITask[], date: Date): ITask[] {
    const stats = getDateStatistics(date);
    console.log(stats);
    return list.filter((task) => isTaskValid(task, stats));
}

export function isTaskValid(task: ITask, stats: IDateStatistics) {
    switch (task.Type) {
        case TaskType.Daily:
            return stats.isWorkDay
        case TaskType.Weekly:
            const daySet = getWeekDaySet(task.WeeklyDays);
            return daySet.has(stats.weekday);
        default:
            console.error(`Task type '${task.Type}' is not supported yet`);
            return false;
    }
}