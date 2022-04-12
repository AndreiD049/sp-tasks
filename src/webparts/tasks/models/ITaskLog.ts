export type TaskStatus = 'Open' | 'Pending' | 'Finished' | 'Cancelled';

export default interface ITaskLog {
    ID: number;
    Title: string,
    Task: {
        ID: number;
        Title: string;
        Description: string;
        Time: string;
        Transferable: "0" | "1";
    };
    TaskId?: number;
    Date: string;
    DateTimeStarted: Date;
    DateTimeFinished: Date;
    Status: TaskStatus;
    User: {
        ID: number;
        Title: string;
        EMail: string;
    };
    UserId?: number;
    Remark: string;
    UniqueValidation?: string;
    OriginalUserId?: number;
    OriginalUser: {
        ID: number;
    };
    Completed: boolean;
    Transferable: boolean;
}
