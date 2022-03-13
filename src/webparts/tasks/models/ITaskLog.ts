export type TaskStatus = "Open" | "Pending" | "Finished" | "Cancelled";

export default interface ITaskLog {
    ID: number;
    Task: {
        ID: number;
        Title: string;
    };
    TaskId?: number;
    Date: Date;
    DateTimeStarted: Date;
    DateTimeFinished: Date;
    Status: TaskStatus;
    User: {
        ID: number;
        Title: string;
    };
    UserId?: number;
    Remark: string;
}