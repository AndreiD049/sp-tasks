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
import { Draggable } from 'react-beautiful-dnd';
import ITask, { TaskType } from '../models/ITask';
import ITaskLog, { TaskStatus } from '../models/ITaskLog';
import { ITaskInfo } from '../models/ITaskProperties';
import { MINUTE } from '../utils/constants';
import GlobalContext from '../utils/GlobalContext';
import { getTaskUniqueId, isTask } from '../utils/utils';
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
    index: number;
    handleTaskUpdated: (task: ITaskLog) => void;
    date: Date;
}

const Task: FC<ITaskProps> = (props) => {
    const { TaskLogsService, canEditOthers, currentUser } =
        React.useContext(GlobalContext);
    const [open, setOpen] = React.useState<boolean>(false);
    const [expired, setExpired] = React.useState<boolean>(false);

    let info: ITaskInfo = React.useMemo(() => {
        if ('Description' in props.task) {
            return {
                description: props.task.Description,
                title: props.task.Title,
                user: props.task.AssignedTo,
                date: DateTime.fromJSDate(props.date).toLocaleString(
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
            title: props.task.Title,
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


    React.useEffect(() => {
        function checkExpired() {
            const time = DateTime.fromISO(info.time);
            if (info.status !== 'Open') {
                return setExpired(false);
            }
            if (time <= DateTime.now()) {
                setExpired(true);
            }
        }
        checkExpired();
        const timer = setInterval(checkExpired, MINUTE);
        return () => clearInterval(timer);
    }, [info]);

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
        const log: ITaskLog = !isTask(props.task)
                ? props.task
                : await TaskLogsService.createTaskLogFromTask(props.task, props.date);

        const update: Partial<ITaskLog> = {
            Status: option.key as TaskStatus,
        };
        switch (update.Status) {
            case 'Open':
                update.PickupDate = null;
                break;
            case 'Pending':
                update.PickupDate = DateTime.now().toISODate();
                update.DateTimeStarted = log.DateTimeStarted ?? new Date();
                break;
            case 'Finished':
                update.DateTimeFinished = log.DateTimeFinished ?? new Date();
                update.PickupDate = DateTime.now().toISODate();
                break;
            case 'Cancelled':
                update.PickupDate = null;
                break;
        }
        const updated = await TaskLogsService.updateTaskLog(log.ID, update);
        props.handleTaskUpdated(updated);
    };

    return (
        <Draggable
            key={getTaskUniqueId(props.task)}
            draggableId={getTaskUniqueId(props.task)}
            index={props.index}
        >
            {(provided) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${styles.task} ${info.status.toLowerCase()}`}
                >
                    <div className={styles.header}>
                        <Text className={expired && styles.expired} variant="mediumPlus">{info.title}</Text>
                        <Persona
                            data-testid='task-person'
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
                                info.user.ID === currentUser.User.ID ||
                                canEditOthers
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
                                iconProps={{
                                    iconName: open ? OPEN_ICON : CLOSED_ICON,
                                }}
                            />
                            {body}
                        </div>
                    ) : null}
                </div>
            )}
        </Draggable>
    );
};

export default Task;
