declare interface ITasksWebPartStrings {
    DataSource: string
    RootFieldLabel: string
    TasksFieldLabel: string
    TaskLogsFieldLabel: string
}

declare module 'TasksWebPartStrings' {
    const strings: ITasksWebPartStrings
    export = strings
}
