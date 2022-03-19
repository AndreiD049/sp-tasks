import { PropertyPaneDynamicFieldSet } from '@microsoft/sp-property-pane';
import { DateTime } from 'luxon';
import {
    Dropdown,
    IconButton,
    IDropdownOption,
    Persona,
    PersonaSize,
    Separator,
    Text,
} from 'office-ui-fabric-react';
import * as React from 'react';
import { FC } from 'react';
import ITask from '../../models/ITask';
import ITaskLog, { TaskStatus } from '../../models/ITaskLog';
import { ITaskInfo } from '../../models/ITaskProperties';
import GlobalContext from '../../utils/GlobalContext';
import styles from './Task.module.scss';

const CLOSED_ICON = 'ChevronDown';
const OPEN_ICON = 'ChevronUp';
const DROPDOWN_STYLES = {
    caretDownWrapper: {
        display: 'none',
    },
    title: {
        border: 'none',
        height: '1.5em',
        lineHeight: '1.5em',
        minWidth: '80px',
    },
    dropdownItemSelected: {
        minHeight: '1.7em',
        lineHeight: '1.7em',
    },
    dropdownItem: {
        minHeight: '1.7em',
        lineHeight: '1.7em',
    },
    dropdown: {
        fontSize: '.8em',
    },
    dropdownOptionText: {
        fontSize: '.8em',
    },
};
const DROPDOWN_KEYS: { key: TaskStatus; text: string }[] = [
    {
        key: 'Open',
        text: 'Open',
    },
    {
        key: 'Pending',
        text: 'In progress',
    },
    {
        key: 'Finished',
        text: 'Finished',
    },
    {
        key: 'Cancelled',
        text: 'Cancelled',
    },
];

export interface ITaskProps {
    task: ITaskLog | ITask;
    handleTaskUpdated: (task: ITaskLog) => void;
}

const Task: FC<ITaskProps> = (props) => {
    const { TaskLogsService, canEditOthers, currentUser } =
        React.useContext(GlobalContext);
    const [open, setOpen] = React.useState<boolean>(false);

    let info: ITaskInfo = React.useMemo(() => {
        if ('Description' in props.task) {
            return {
                description: props.task.Description,
                title: props.task.Title,
                user: props.task.AssignedTo,
                date: DateTime.fromJSDate(new Date()).toLocaleString(
                    DateTime.DATE_SHORT
                ),
                time: DateTime.fromISO(props.task.Time).toLocaleString(
                    DateTime.TIME_24_SIMPLE
                ),
                status: 'Open',
            };
        }
        return {
            description: props.task.Task.Description,
            title: props.task.Task.Title,
            user: props.task.User,
            date: DateTime.fromISO(props.task.Date).toLocaleString(
                DateTime.DATE_SHORT
            ),
            time: DateTime.fromISO(props.task.Task.Time).toLocaleString(
                DateTime.TIME_24_SIMPLE
            ),
            status: props.task.Status,
        };
    }, [props.task]);

    const body = React.useMemo(() => {
        if (!open) return null;
        return (
            <>
                <Separator className={styles.separator} />
                <div className={styles.description}>{info.description}</div>
            </>
        );
    }, [open]);

    const toggleOpen = React.useCallback(() => {
        setOpen((prev) => !prev);
    }, []);

    const handleChange = async (_: any, option: IDropdownOption) => {
        const log: ITaskLog = 'Date' in props.task ? props.task : null; // TODO: create a tasklog from task
        const update: Partial<ITaskLog> = {
            Status: option.key as TaskStatus,
        };
        switch (update.Status) {
            case 'Pending':
                update.DateTimeStarted = log.DateTimeStarted ?? new Date();
                break;
            case 'Finished':
                update.DateTimeFinished = log.DateTimeFinished ?? new Date();
        }
        const updated = await TaskLogsService.updateTaskLog(log.ID, update);
        props.handleTaskUpdated(updated);
    };

    return (
        <div className={`${styles.task} ${info.status.toLowerCase()}`}>
            <div className={styles.header}>
                <Text variant="mediumPlus">{info.title}</Text>
                <Persona
                    className={styles.person}
                    text={info.user.Title}
                    size={PersonaSize.size24}
                    title={info.user.EMail}
                    hidePersonaDetails
                />
            </div>
            <div className={styles.subheader}>
                <Text variant="medium">{info.date}</Text>
                <Text variant="medium" className={styles.hours}>
                    {' '}
                    {info.time}{' '}
                </Text>
            </div>
            <div className={styles.status}>
                <Text variant="medium">Status:</Text>
                <Dropdown
                    options={DROPDOWN_KEYS}
                    styles={DROPDOWN_STYLES}
                    selectedKey={info.status}
                    onChange={
                        info.user.ID === currentUser.User.ID || canEditOthers
                            ? handleChange
                            : null
                    }
                    disabled={
                        info.user.ID === currentUser.User.ID
                            ? false
                            : !canEditOthers
                    }
                />
            </div>
            {info.description ? (
                <div className={styles.body}>
                    <IconButton
                        onClick={toggleOpen}
                        iconProps={{ iconName: open ? OPEN_ICON : CLOSED_ICON }}
                    />
                    {body}
                </div>
            ) : null}
        </div>
    );
};

export default Task;
