import * as React from 'react'
import TaskLogsService from '../services/tasklogs'
import TaskService from '../services/tasks'

export interface IGlobalContext {
    TaskService: TaskService
    TaskLogsService: TaskLogsService
}

const GlobalContext = React.createContext<IGlobalContext>({
    TaskService: null,
    TaskLogsService: null,
})

export default GlobalContext
