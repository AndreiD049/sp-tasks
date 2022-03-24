import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import * as React from 'react';
import styles from './Tasks.module.scss';
import { useContext } from 'react';
import GlobalContext from '../utils/GlobalContext';
import Task from './Task/Task';
import ITaskLog from '../models/ITaskLog';
import ITask from '../models/ITask';
import { DateTime } from 'luxon';
import DateSelector from './DateSelector';
import { MessageBarType, Persona, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import UserSelctor from './UserSelector';
import createState from 'use-persisted-state';
import { IUser } from '../models/IUser';
import { MINUTE } from '../utils/constants';
import {
    getSortedTaskList,
    getTaskId,
    ICustomSorting,
    reorder,
} from '../utils/utils';
import {SPnotify} from 'sp-react-notifications';
import { useVisibility } from 'react-visibility-hook';
import useSyncTasks from '../hooks/useSyncTasks';

const useLocalStorage = createState('selectedUsers');
const useLocalStorageSorting = createState('customTaskSorting');
const useSessionStorage = createState('selectedDate', sessionStorage);

interface ITasksPerUser {
    [user: string]: {
        user: IUser;
        result: (ITask | ITaskLog)[];
    };
}

const Tasks: React.FC = () => {
    const { TaskService, TaskLogsService, currentUser } =
        useContext(GlobalContext);
    const visiblity = useVisibility();
    const [dateStr, setDate]: [Date, any] = useSessionStorage(new Date());
    const date = React.useMemo(() => new Date(dateStr), [dateStr]);
    const [selectedUsers, setSelectedUsers]: [IUser[], any] = useLocalStorage(
        []
    );
    const [loading, setLoading] = React.useState(true);
    const [taskLogs, setTaskLogs] = React.useState<ITaskLog[]>([]);
    const [tasks, setTasks] = React.useState<ITask[]>([]);
    const isSameDay = React.useMemo(
        () => DateTime.fromJSDate(date).hasSame(DateTime.now(), 'day'),
        [date]
    );
    const userIds = React.useMemo(
        () => [currentUser.User.ID, ...selectedUsers.map((u) => u.User.ID)],
        [selectedUsers]
    );
    const [customSorting, setCustomSorting]: [ICustomSorting, any] =
        useLocalStorageSorting({});
    const [forceUpdate, setForceUpdate] = React.useState(false);

    /**
     * Matches the tasks with the task logs.
     * If there are tasks without match, a task log is created from them.
     * Then, the newly created tasks are retrieved from the list and returned to the client
     *
     * @param tasks - the list of tasks assigned to current user
     * @param logs - the list of concrete task logs currently created from assigned tasks
     * @returns newly created logs
     */
    const checkTasksAndCreateTaskLogs = async (
        tasks: ITask[],
        logs: ITaskLog[]
    ) => {
        let missing: ITask[] = [];
        let logSet = new Set(logs.map((log) => log.Task.ID));
        tasks.forEach((task) => {
            if (!logSet.has(task.ID)) {
                missing.push(task);
            }
        });
        const results = await TaskLogsService.createTaskLogs(missing, date);
        let newLogs =
            results.length === 0
                ? []
                : await TaskLogsService.getTaskLogsFromAddResult(results);
        return newLogs;
    };

    /**
     * Check with the list every few minutes
     * if any changes occured to the tasks currently shown.
     * If any tasks or logs changed, make a force update of info and retrieve everything again.
     */
    React.useEffect(() => {
        TaskLogsService.didTaskLogsChanged(date, userIds);
        TaskService.didTasksChanged(userIds);
        console.log("outside", visiblity);
        const timer = setInterval(async () => {
            const logsChanged = await TaskLogsService.didTaskLogsChanged(
                date,
                userIds
            );
            const tasksChanged = await TaskService.didTasksChanged(userIds);
            tasksChanged && TaskService.clearCache();
            console.log(visiblity, visiblity.sinceLastVisible());
            if (logsChanged || tasksChanged) {
                setForceUpdate((prev) => !prev);
            }
        }, MINUTE / 6);
        return () => clearInterval(timer);
    }, [visiblity]);
    const sync = useSyncTasks(date, userIds);

    /**
     * Retrieve information from the lists
     */
    React.useEffect(() => {
        async function run() {
            const tasks = await TaskService.getTasksByMultipleUserIds(userIds);
            setTasks(tasks);
            if (isSameDay) {
                const logs = await TaskLogsService.getTaskLogsByUserIds(
                    date,
                    userIds
                );
                const newTasks = await checkTasksAndCreateTaskLogs(tasks, logs);
                setTaskLogs(logs.concat(newTasks));
            } else {
                const logs = await TaskLogsService.getTaskLogsByUserIds(
                    date,
                    userIds
                );
                setTaskLogs(logs);
            }
            setLoading(false);
        }
        run();
    }, [date, userIds, forceUpdate]);

    /**
     * Data structures showing tasks and logs per user
     */
    const tasksPerUser = React.useMemo(() => {
        const result: ITasksPerUser = {};

        userIds.forEach((id) => {
            const user =
                id === currentUser.User.ID
                    ? currentUser
                    : selectedUsers.find((u) => u.User.ID === id);
            const userTasks = tasks.filter((t) => t.AssignedTo.ID === id);
            const userTaskLogs = taskLogs.filter((l) => l.User.ID === id);
            const userResult = getSortedTaskList(
                userTasks,
                userTaskLogs,
                id,
                customSorting
            );
            result[id] = {
                user,
                result: userResult,
            };
        });

        return result;
    }, [tasks, taskLogs, customSorting]);

    /**
     * When a task is updated, it needs to be replaced within task logs and removed from tasks if present
     * @param t - updated task
     */
    const handleTaskUpdate = (t: ITaskLog) => {
        setTasks((prev) => prev.filter((p) => p.ID !== t.ID));
        setTaskLogs((prev) => prev.map((p) => (p.ID === t.ID ? t : p)));
    };

    const handleTaskDropped = ({
        destination,
        source,
    }: DropResult) => {
        if (!source || !destination) return;
        if (destination.droppableId !== source.droppableId) {
            return SPnotify({
                message: 'Reassigning tasks is not yet possible!',
                messageType: MessageBarType.error,
            });
        }
        if (destination.index !== source.index) {
            let list = tasksPerUser[source.droppableId].result;
            list = reorder(list, source.index, destination.index);
            setCustomSorting((prev) => ({
                ...prev,
                [source.droppableId]: list.map((i) => getTaskId(i)),
            }));
        }
    };

    const body = React.useMemo(
        () =>
            loading ? (
                <Spinner size={SpinnerSize.large} />
            ) : (
                <div className={styles.container}>
                    {userIds.map((id) => {
                        const item = tasksPerUser[id];
                        if (!item || item.result.length === 0) return null;
                        return (
                            <Droppable droppableId={id.toString()}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={styles.taskContainer}
                                    >
                                        <Persona
                                            text={
                                                tasksPerUser[id]?.user.User
                                                    .Title
                                            }
                                            imageUrl={`/_layouts/15/userphoto.aspx?AccountName=${tasksPerUser[id]?.user.User.EMail}&Size=M`}
                                        />
                                        {tasksPerUser[id]?.result.map(
                                            (log, index) => (
                                                <Task
                                                    task={log}
                                                    index={index}
                                                    handleTaskUpdated={
                                                        handleTaskUpdate
                                                    }
                                                    key={`log-${log.ID}`}
                                                />
                                            )
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            ),
        [userIds, tasksPerUser, loading]
    );

    return (
        <DragDropContext onDragEnd={handleTaskDropped}>
            <div className={styles.tasks}>
                <div className={styles.commandbar}>
                    <DateSelector
                        date={date}
                        setDate={(val) => {
                            setLoading(true);
                            setDate(val);
                        }}
                        loading={loading}
                        className={styles.selector}
                    />
                    <UserSelctor
                        users={selectedUsers}
                        setUsers={setSelectedUsers}
                        className={styles.userSelector}
                    />
                </div>
                {body}
            </div>
        </DragDropContext>
    );
};

export default Tasks;
