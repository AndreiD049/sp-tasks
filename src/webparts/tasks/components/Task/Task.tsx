import { DateTime } from 'luxon'
import {
    Dropdown,
    IconButton,
    IDropdownOption,
    Persona,
    PersonaSize,
    Separator,
    Text,
} from 'office-ui-fabric-react'
import * as React from 'react'
import { FC } from 'react'
import ITask from '../../models/ITask'
import ITaskLog, { TaskStatus } from '../../models/ITaskLog'
import GlobalContext from '../../utils/GlobalContext'
import styles from './Task.module.scss'

const CLOSED_ICON = 'ChevronDown'
const OPEN_ICON = 'ChevronUp'
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
}
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
]

export interface ITaskProps {
    task: ITaskLog | ITask
    handleTaskUpdated: (task: ITaskLog) => void
}

const Task: FC<ITaskProps> = (props) => {
    const { TaskLogsService } = React.useContext(GlobalContext)
    const [open, setOpen] = React.useState<boolean>(false)

    let description = ''
    let title = ''
    let username = ''
    let email = ''
    let date = React.useMemo(() => {
        if ('Description' in props.task) {
            return DateTime.fromJSDate(new Date()).toLocaleString(
                DateTime.DATE_SHORT
            )
        } else {
            return DateTime.fromISO(props.task.Date).toLocaleString(
                DateTime.DATE_SHORT
            )
        }
    }, [props.task])
    let time = React.useMemo(() => {
        if ('Description' in props.task) {
            return DateTime.fromISO(props.task.Time).toLocaleString(
                DateTime.TIME_24_SIMPLE
            )
        } else {
            return DateTime.fromISO(props.task.Task.Time).toLocaleString(
                DateTime.TIME_24_SIMPLE
            )
        }
    }, [props.task])
    let status: TaskStatus = React.useMemo(() => {
        if ('Description' in props.task) {
            return 'Open'
        } else {
            return props.task.Status
        }
    }, [props.task])
    if ('Description' in props.task) {
        description = props.task.Description
        title = props.task.Title
        username = props.task.AssignedTo.Title
        email = props.task.AssignedTo.EMail
    } else {
        description = props.task.Task.Description
        title = props.task.Task.Title
        username = props.task.User.Title
        email = props.task.User.EMail
    }

    const body = React.useMemo(() => {
        if (!open) return null
        return (
            <>
                <Separator className={styles.separator} />
                <div className={styles.description}>{description}</div>
            </>
        )
    }, [open])

    const toggleOpen = React.useCallback(() => {
        setOpen((prev) => !prev)
    }, [])

    const handleChange = async (_: any, option: IDropdownOption) => {
        const log: ITaskLog = 'Date' in props.task ? props.task : null; // TODO: create a tasklog from task
        const update: Partial<ITaskLog> = {
            Status: option.key as TaskStatus,
        }
        switch (update.Status) {
            case 'Pending':
                update.DateTimeStarted = log.DateTimeStarted ?? new Date();
                break;
            case 'Finished':
                update.DateTimeFinished = log.DateTimeFinished ?? new Date();
        }
        const updated = await TaskLogsService.updateTaskLog(log.ID, update)
        props.handleTaskUpdated(updated);
    }

    return (
        <div className={styles.task}>
            <div className={styles.header}>
                <Text variant="mediumPlus">{title}</Text>
                <Persona
                    className={styles.person}
                    text={username}
                    size={PersonaSize.size24}
                    title={email}
                    hidePersonaDetails
                />
            </div>
            <div className={styles.subheader}>
                <Text variant="medium">{date}</Text>
                <Text variant="medium" className={styles.hours}>
                    {time}
                </Text>
            </div>
            <div className={styles.status}>
                <Text variant="medium">Status:</Text>
                <Dropdown
                    options={DROPDOWN_KEYS}
                    styles={DROPDOWN_STYLES}
                    selectedKey={status}
                    onChange={handleChange}
                />
            </div>
            {description ? (
                <div className={styles.body}>
                    <IconButton
                        onClick={toggleOpen}
                        iconProps={{ iconName: open ? OPEN_ICON : CLOSED_ICON }}
                    />
                    {body}
                </div>
            ) : null}
        </div>
    )
}

export default Task
