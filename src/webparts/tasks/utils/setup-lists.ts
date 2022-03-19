import {
    ChoiceFieldFormatType,
    DateTimeFieldFormatType,
    DateTimeFieldFriendlyFormatType,
} from '@pnp/sp/fields';
import { getSP } from '../../../pnpjs-presets';
import { ITasksWebPartProps } from '../TasksWebPart';

export const setupLists = async (properties: ITasksWebPartProps) => {
    const sp = getSP('Data');

    // make sure 'Task' list exists
    const taskExists = await sp.web.lists.ensure(properties.tasksListTitle);

    if (taskExists.created) {
        await taskExists.list.update({
            EnableAttachments: false,
            NoCrawl: true,
        });
        // Create fields for the list
        await taskExists.list.fields.addText('Description', {
            Required: false,
            Hidden: false,
            Description: 'Description of the task',
        });

        await taskExists.list.fields.addUser('AssignedTo', {
            Title: 'Assigned To',
            Required: true,
            Hidden: false,
            Indexed: true,
            Description: 'Users or groups to which the task is assigned',
        });

        await taskExists.list.fields.addChoice('Type', {
            Choices: ['Daily', 'Weekly', 'Monthly', 'One time'],
            Required: true,
            EditFormat: ChoiceFieldFormatType.Dropdown,
            FillInChoice: false,
            Description: 'Describes how often the task needs to be performed',
        });

        await taskExists.list.fields.addDateTime('Time', {
            DisplayFormat: DateTimeFieldFormatType.DateTime,
            Description: 'Time when task needs to be performed',
            Required: true,
        });
    }

    let taskList = await sp.web.lists.getByTitle(properties.tasksListTitle)();

    // make sure 'Task logs' list exists
    const taskLogsExists = await sp.web.lists.ensure(
        properties.taskLogsListTitle
    );

    if (taskLogsExists.created) {
        // create fields for the list
        await taskLogsExists.list.update({
            EnableAttachments: false,
            NoCrawl: true,
        });

        await taskLogsExists.list.fields.getByTitle('Title').update({
            Required: false,
        });

        await taskLogsExists.list.fields.addLookup('Task', {
            LookupListId: taskList.Id,
            LookupFieldName: 'Title',
            Required: true,
        });

        await taskLogsExists.list.fields.addDateTime('Date', {
            DisplayFormat: DateTimeFieldFormatType.DateOnly,
            Required: true,
            Description: 'Date of the task',
            Indexed: true,
        });

        await taskLogsExists.list.fields.addDateTime('DateTimeStarted', {
            DisplayFormat: DateTimeFieldFormatType.DateTime,
            Required: false,
            Title: 'Date Time Started',
            Description: 'Date and time when task was started',
        });

        await taskLogsExists.list.fields.addDateTime('DateTimeFinished', {
            DisplayFormat: DateTimeFieldFormatType.DateTime,
            Required: false,
            Title: 'Date Time Finished',
            Description: 'Date and time when task was completed',
        });

        await taskLogsExists.list.fields.addChoice('Status', {
            Choices: ['Open', 'Pending', 'Finished', 'Cancelled'],
            Required: true,
            Description: 'Status of the task',
        });

        await taskLogsExists.list.fields.addUser('User', {
            Description: 'User related to the task',
            Required: true,
            Indexed: true,
        });

        await taskLogsExists.list.fields.addText('Remark', {
            Required: false,
            Description: 'Any additional remark',
        });

        await taskLogsExists.list.fields.addText('UniqueValidation', {
            Required: false,
            Description: 'Enforce unique values',
            EnforceUniqueValues: true,
            Indexed: true,
        });
    }
};
