import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import * as React from 'react'
import TaskLogsService from '../services/tasklogs'
import TaskService from '../services/tasks'
import UserService from '../services/users';

export interface IGlobalContext {
    TaskService: TaskService;
    TaskLogsService: TaskLogsService;
    UserService: UserService;
    currentUser: ISiteUserInfo;
}

const GlobalContext = React.createContext<IGlobalContext>({
    TaskService: null,
    TaskLogsService: null,
    UserService: null,
    currentUser: null,
})

export default GlobalContext
