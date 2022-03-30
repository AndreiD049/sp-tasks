import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
    IPropertyPaneConfiguration,
    PropertyPaneTextField,
    PropertyPaneButton,
    PropertyPaneButtonType,
    PropertyPaneSlider,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'TasksWebPartStrings';
import Tasks from './components/Tasks';
import { setupLists } from './utils/setup-lists';
import TaskService from './services/tasks';
import GlobalContext from './utils/GlobalContext';
import TaskLogsService from './services/tasklogs';
import UserService from './services/users';
import TeamService from './services/teams';
import { ACCESS_EDIT_OTHERS, USER_WEB_RE } from './utils/constants';
import { setupSP } from 'sp-preset';
import PropertyPaneAccessControl, { canCurrentUser, IUserGroupPermissions, setupAccessControl } from 'property-pane-access-control';
import { InjectHeaders } from '@pnp/queryable';
import { MessageBarType } from 'office-ui-fabric-react';
import { useVisibility } from 'react-visibility-hook';

export interface ITasksWebPartProps {
    dataSourceRoot: string;
    tasksListTitle: string;
    taskLogsListTitle: string;
    staffListUrl: string;
    maxPeople: number;
    userColumn: string;
    teamColumn: string;
    roleColumn: string;
    permissions: IUserGroupPermissions;
}

export default class TasksWebPart extends BaseClientSideWebPart<ITasksWebPartProps> {
    public async render(): Promise<void> {
        let userServeice = new UserService();
        const teamService = new TeamService(
            this.properties.staffListUrl,
            this.properties.userColumn,
            this.properties.teamColumn,
            this.properties.roleColumn
        );
        const element: React.ReactElement = React.createElement(
            GlobalContext.Provider,
            {
                value: {
                    TaskService: new TaskService(this.properties),
                    TaskLogsService: new TaskLogsService(this.properties),
                    UserService: userServeice,
                    TeamService: teamService,
                    currentUser: await teamService.getCurrentUser(),
                    teamMembers: await teamService.getCurrentUserTeamMembers(),
                    canEditOthers: await canCurrentUser(ACCESS_EDIT_OTHERS, this.properties.permissions),
                    maxPeople: this.properties.maxPeople,
                },
            },
            React.createElement(Tasks)
        );

        ReactDom.render(element, this.domElement);
    }

    protected async onInit(): Promise<void> {
        super.onInit();

        const userWebUrl = this.properties.staffListUrl?.match(USER_WEB_RE)[1];

        setupAccessControl(this.context);

        setupSP({
            context: this.context,
            tennants: {
                Data: this.properties.dataSourceRoot,
                Users: userWebUrl,
            },
            useRPM: true,
            rpmTreshold: 800,
            rpmTracing: false,
            rpmAlerting: true,
            additionalTimelinePipes: [
                InjectHeaders({
                    "Accept": "application/json;odata=nometadata"
                }),
            ],
        });
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement);
    }

    protected get dataVersion(): Version {
        return Version.parse('1.0');
    }

    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
        return {
            pages: [
                {
                    groups: [
                        {
                            groupName: strings.DataSource,
                            groupFields: [
                                PropertyPaneTextField('dataSourceRoot', {
                                    label: strings.RootFieldLabel,
                                }),
                                PropertyPaneTextField('tasksListTitle', {
                                    label: strings.TasksFieldLabel,
                                }),
                                PropertyPaneTextField('taskLogsListTitle', {
                                    label: strings.TaskLogsFieldLabel,
                                }),
                                PropertyPaneButton('', {
                                    onClick: () => setupLists(this.properties),
                                    text: 'Create lists',
                                    buttonType: PropertyPaneButtonType.Primary,
                                    icon: 'Add',
                                }),
                            ],
                        },
                        {
                            groupName: strings.StaffGroupName,
                            groupFields: [
                                PropertyPaneTextField('staffListUrl', {
                                    label: strings.StaffListLabel,
                                }),
                                PropertyPaneSlider('maxPeople', {
                                    label: 'Maximum # of users',
                                    min: 0,
                                    max: 15,
                                    value: this.properties.maxPeople || 0,
                                }),
                                PropertyPaneTextField('userColumn', {
                                    label: strings.UserColumnNameLabel,
                                }),
                                PropertyPaneTextField('teamColumn', {
                                    label: strings.TeamColumnNameLabel,
                                }),
                                PropertyPaneTextField('roleColumn', {
                                    label: strings.RoleColumnNameLabel,
                                }),
                            ],
                        },
                        {
                            groupName: 'Access',
                            groupFields: [
                                PropertyPaneAccessControl('permissions', {
                                    key: 'access',
                                    context: this.context,
                                    permissions: [ACCESS_EDIT_OTHERS],
                                    selectedUserGroups: this.properties.permissions
                                })
                            ]
                        }
                    ],
                },
            ],
        };
    }
}
