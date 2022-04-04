declare interface ITasksWebPartStrings {
    DataSource: string;
    RootFieldLabel: string;
    TasksFieldLabel: string;
    TaskLogsFieldLabel: string;
    StaffListLabel: string;
    StaffGroupName: string;
    UserColumnNameLabel: string;
    TeamColumnNameLabel: string;
    RoleColumnNameLabel: string;
    NoTasksLabel: string;
}

declare module 'TasksWebPartStrings' {
    const strings: ITasksWebPartStrings;
    export = strings;
}
