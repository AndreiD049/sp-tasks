import * as React from 'react'
import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import {
    IPropertyPaneConfiguration,
    PropertyPaneTextField,
    PropertyPaneButton,
    PropertyPaneButtonType,
} from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'

import * as strings from 'TasksWebPartStrings'
import Tasks from './components/Tasks'
import { setupSP } from '../../pnpjs-presets'
import { setupLists } from './utils/setup-lists'
import TaskService from './services/tasks'
import GlobalContext from './utils/GlobalContext'
import TaskLogsService from './services/tasklogs'
import { spfi, SPFx } from '@pnp/sp'

export interface ITasksWebPartProps {
    dataSourceRoot: string
    tasksListTitle: string
    taskLogsListTitle: string
}

export default class TasksWebPart extends BaseClientSideWebPart<ITasksWebPartProps> {
    public render(): void {
        const element: React.ReactElement = React.createElement(
            GlobalContext.Provider,
            {
                value: {
                    TaskService: new TaskService(this.properties),
                    TaskLogsService: new TaskLogsService(this.properties),
                },
            },
            React.createElement(Tasks)
        )

        ReactDom.render(element, this.domElement)
    }

    protected async onInit(): Promise<void> {
        super.onInit()

        let sp = spfi().using(SPFx(this.context))

        setupSP(this.context, {
            Data: this.properties.dataSourceRoot,
        })
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement)
    }

    protected get dataVersion(): Version {
        return Version.parse('1.0')
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
                    ],
                },
            ],
        }
    }
}
