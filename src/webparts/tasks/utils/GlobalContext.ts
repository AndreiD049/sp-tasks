import { ISiteUserInfo } from '@pnp/sp/site-users/types';
import * as React from 'react';
import { IUser } from '../models/IUser';
import TaskLogsService from '../services/tasklogs';
import TaskService from '../services/tasks';
import TeamService from '../services/teams';
import UserService from '../services/users';

export interface IGlobalContext {
    TaskService: TaskService;
    TaskLogsService: TaskLogsService;
    UserService: UserService;
    TeamService: TeamService;
    currentUser: IUser;
    teamMembers: IUser[];
}

const GlobalContext = React.createContext<IGlobalContext>({
    TaskService: null,
    TaskLogsService: null,
    UserService: null,
    TeamService: null,
    currentUser: null,
    teamMembers: null,
});

export default GlobalContext;
