export type TaskStatus = 'Open' | 'Pending' | 'Finished' | 'Cancelled'

export default interface ITaskLog {
    ID: number
    Task: {
        ID: number
        Title: string
        Description: string;
        Time: string;
    }
    TaskId?: number
    Date: string
    DateTimeStarted: Date
    DateTimeFinished: Date
    Status: TaskStatus
    User: {
        ID: number
        Title: string,
        Email: string
    }
    UserId?: number
    Remark: string
}
