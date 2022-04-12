import { DateTime } from "luxon";
import ITask, { TaskType } from "../models/ITask";
import { selectTasks } from "./select-tasks";

const tasks: ITask[] = [
    {
        ID: 1,
        AssignedTo: {
            EMail: 'user@gmail.com',
            ID: 1,
            Title: 'User 1',
        },
        Description: 'Hello',
        Time: '2022-03-26T07:00:00Z',
        Title: 'Task title',
        Type: TaskType.Monthly,
        WeeklyDays: [],
        MonthlyDay: 1,
        Transferable: false,
    },
    {
        ID: 3,
        AssignedTo: {
            EMail: 'user@gmail.com',
            ID: 1,
            Title: 'User 1',
        },
        Description: 'Hello',
        Time: '2022-03-26T07:00:00Z',
        Title: 'Task title',
        Type: TaskType.Monthly,
        WeeklyDays: [],
        MonthlyDay: 5,
        Transferable: false,
    },
    {
        ID: 2,
        AssignedTo: {
            EMail: 'user@gmail.com',
            ID: 1,
            Title: 'User 1',
        },
        Description: 'Hello',
        Time: '2022-03-26T07:00:00Z',
        Title: 'Task title',
        Type: TaskType.Monthly,
        WeeklyDays: [],
        MonthlyDay: 31,
        Transferable: false,
    }
]

describe('Selecting tasks', () => {

    it('Should work with monthly tasks', () => {
        let result = selectTasks(tasks, DateTime.fromISO('2022-03-01').toJSDate());
        expect(result.length).toBe(1);
        result = selectTasks(tasks, DateTime.fromISO('2022-03-02').toJSDate());
        expect(result.length).toBe(0);
        result = selectTasks(tasks, DateTime.fromISO('2022-03-04').toJSDate());
        expect(result.length).toBe(0);
        result = selectTasks(tasks, DateTime.fromISO('2022-03-07').toJSDate());
        expect(result.length).toBe(1);
    });

    it('should work with last day of the month', () => {
        let result = selectTasks(tasks, DateTime.fromISO('2022-02-28').toJSDate());
        expect(result.length).toBe(1);
    });
});