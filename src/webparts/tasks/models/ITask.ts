export enum TaskType {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    OneTime = 'One time',
}

export default interface ITask {
    ID: number
    Title: string
    Description: string
    AssignedTo: {
        ID: number
        Title: string,
        EMail: string,
    }
    Time: string
    Type: TaskType
}
