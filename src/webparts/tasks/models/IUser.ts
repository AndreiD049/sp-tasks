export interface IUser {
    User: {
        ID: number;
        Title: string;
        EMail: string;
    };
    Teams: string[];
    Role: string;
}