import {
    ChoiceFieldFormatType,
    DateTimeFieldFormatType,
    DateTimeFieldFriendlyFormatType,
    FieldTypes,
} from '@pnp/sp/fields';
import { MessageBarType } from 'office-ui-fabric-react';
import { getSP } from 'sp-preset';
import { SPnotify } from 'sp-react-notifications';
import { ITasksWebPartProps } from '../TasksWebPart';

export const setupLists = async (properties: ITasksWebPartProps) => {
    const sp = getSP('Data');

    // make sure 'Task' list exists
    const taskExists = await sp.web.lists.ensure(properties.tasksListTitle);

    SPnotify({
        message: 'Please wait. Creating lists',
        messageType: MessageBarType.warning,
    });

    if (taskExists.created) {
        await taskExists.list.update({
            EnableAttachments: false,
            NoCrawl: true,
        });
        // Create fields for the list
        await taskExists.list.fields.addText('Description', {
            Required: false,
            Description: 'Description of the task',
        });

        await taskExists.list.fields.addUser('AssignedTo', {
            Title: 'Assigned To',
            Required: true,
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

        await taskExists.list.fields.addMultiChoice('WeeklyDays', {
            Choices: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            Required: false,
            FillInChoice: false,
            Description: 'Choose the week days when the task should be performed. Only valid when Type is Weekly.',
        });

        await taskExists.list.fields.addNumber('MonthlyDay', {
            Description: 'Valid only when Type is \'Monthly\'. Working day on which the task should be done.',
            Required: false,
        });

        await taskExists.list.fields.addDateTime('Time', {
            DisplayFormat: DateTimeFieldFormatType.DateTime,
            Description: 'Time when task needs to be performed',
            Required: true,
        });

        await taskExists.list.fields.addBoolean('Transferable', {
            Description: 'Whether task should be transferred to next day if it was not completed',
            Indexed: true,
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
            Indexed: true,
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

        // Who was the original user of the task.
        // Will be filled in if the task was reassigned to another user
        await taskLogsExists.list.fields.addUser('OriginalUser', {
            Description: 'Original User related to the task',
            Required: false,
            Indexed: true,
        });

        await taskLogsExists.list.fields.addBoolean('Completed', {
            Description: 'Whether task was completed',
            Indexed: true,
        });

        await taskLogsExists.list.fields.addBoolean('Transferable', {
            Description: 'Whether task should be transferred to next day if it was not completed',
            Indexed: true,
        });
    }
    
    SPnotify({
        message: 'All lists were created successfully.',
        messageType: MessageBarType.success,
    });
};
