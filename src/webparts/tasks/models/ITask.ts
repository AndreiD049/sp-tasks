export enum TaskType {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    OneTime = 'One time',
}

export enum WeekDay {
    Mon = 'Monday',
    Tue = 'Tuesday',
    Wed = 'Wednesday',
    Thu = 'Thursday',
    Fri = 'Friday',
    Sat = 'Saturday',
    Sun = 'Sunday',
}

export const WeekDayMap = {
    [WeekDay.Mon]: 1,
    [WeekDay.Tue]: 2,
    [WeekDay.Wed]: 3,
    [WeekDay.Thu]: 4,
    [WeekDay.Fri]: 5,
    [WeekDay.Sat]: 6,
    [WeekDay.Sun]: 7,
};

export default interface ITask {
    ID: number;
    Title: string;
    Description: string;
    AssignedTo: {
        ID: number;
        Title: string;
        EMail: string;
    };
    Time: string;
    Type: TaskType;
    WeeklyDays: WeekDay[];
    MonthlyDay?: number;
}
