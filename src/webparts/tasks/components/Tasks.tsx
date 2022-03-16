import * as React from 'react';
import styles from './Tasks.module.scss';
import { useContext } from 'react';
import GlobalContext from '../utils/GlobalContext';
import Task from './Task/Task';
import ITaskLog from '../models/ITaskLog';
import ITask from '../models/ITask';
import { DateTime } from 'luxon';
import DateSelector from './DateSelector';
import { Persona, Spinner, SpinnerSize, Text } from 'office-ui-fabric-react';
import UserSelctor from './UserSelector';
import createState from 'use-persisted-state';
import { IUser } from '../models/IUser';

const useLocalStorage = createState('selectedUsers');
const useSessionStorage = createState('selectedDate', sessionStorage);

interface ITasksPerUser {
    [user: string]: {
        user: IUser;
        tasks: ITask[];
        logs: ITaskLog[];
    };
}

const Tasks: React.FC = () => {
    const { TaskService, TaskLogsService, currentUser } =
        useContext(GlobalContext);
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
     * Get tasks for current date
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
                setTaskLogs(
                    logs.concat(await checkTasksAndCreateTaskLogs(tasks, logs))
                );
            } else {
                const logs = await TaskLogsService.getTaskLogsByUserIds(
                    date,
                    userIds
                );
                setTaskLogs(logs);
            }
            setLoading(false);
        }
        setLoading(true);
        run();
    }, [date, userIds]);

    const tasksPerUser = React.useMemo(() => {
        const result: ITasksPerUser = {};

        userIds.forEach((id) => {
            const user =
                id === currentUser.User.ID
                    ? currentUser
                    : selectedUsers.find((u) => u.User.ID === id);
            result[id] = {
                user,
                tasks: tasks.filter((t) => t.AssignedTo.ID === id),
                logs: taskLogs.filter((l) => l.User.ID === id),
            };
        });

        return result;
    }, [tasks, taskLogs]);

    const handleTaskUpdate = (t: ITaskLog) => {
        setTasks((prev) => prev.filter((p) => p.ID !== t.ID));
        setTaskLogs((prev) => prev.map((p) => (p.ID === t.ID ? t : p)));
    };

    console.log(tasksPerUser);

    const body = loading ? (
        <Spinner size={SpinnerSize.large} />
    ) : (
        <div className={styles.container}>
            {userIds.map((id) => {
                const item = tasksPerUser[id];
                if (
                    !item ||
                    (item.logs.length === 0 && item.tasks.length === 0)
                )
                    return null;
                return (
                    <div className={styles.taskContainer}>
                        <Persona text={tasksPerUser[id]?.user.User.Title} />
                        {tasksPerUser[id]?.logs.map((log) => (
                            <Task
                                task={log}
                                handleTaskUpdated={handleTaskUpdate}
                                key={`log-${log.ID}`}
                            />
                        ))}
                        {/* if not the same day, show also the tasks */}
                        {!isSameDay
                            ? tasksPerUser[id]?.tasks.map((task) => (
                                  <Task
                                      task={task}
                                      handleTaskUpdated={handleTaskUpdate}
                                      key={`task-${task.ID}`}
                                  />
                              ))
                            : null}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className={styles.tasks}>
            <div className={styles.commandbar}>
                <DateSelector
                    date={date}
                    setDate={setDate}
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
    );
};

export default Tasks;
