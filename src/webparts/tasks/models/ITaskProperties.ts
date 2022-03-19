export interface ITaskInfo {
    description: string;
    title: string;
    user: {
        Title: string;
        EMail: string;
        ID: number;
    }
    date: string;
    time: string;
    status: string;
}