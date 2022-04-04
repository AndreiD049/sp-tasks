import * as React from 'react';
import { useContext } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import useSyncTasks from '../hooks/useSyncTasks';
import { useTasks } from '../hooks/useTasks';
import { useTasksPerUser } from '../hooks/useTasksPerUser';
import ITaskLog from '../models/ITaskLog';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';
import { getTaskUniqueId, ICustomSorting, isTask } from '../utils/utils';
import Header from './Header';
import styles from './Tasks.module.scss';
import UserColumn from './UserColumn';
import { SPnotify } from 'sp-react-notifications';
import { MessageBarType, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import useWebStorage from 'use-web-storage-api';
import { HOUR } from '../utils/constants';

const Tasks: React.FC = () => {
    const { currentUser, TaskLogsService, maxPeople } = useContext(GlobalContext);

    const [date, setDate] = useWebStorage<Date>(new Date(), {
        key: 'selectedDate',
        serialize: (val) => val.toISOString(),
        deserialize: (val) => new Date(val),
        expiresIn: HOUR * 8,
    });

    const [selectedUsers, setSelectedUsers] = useWebStorage<IUser[]>([], {
        key: 'selectedUsers',
    });
    const userIds = React.useMemo(
        () => [currentUser.User.ID, ...selectedUsers.map((u) => u.User.ID)].slice(0, maxPeople + 1),
        [selectedUsers]
    );

    const [loading, setLoading] = React.useState(true);

    /**
     * Custom sorting of tasks.
     * Applied when user changes task order manually (drag & drop)
     */
    const [customSorting, setCustomSorting]: [ICustomSorting, any] = useWebStorage<ICustomSorting>({}, {
        key: 'customTaskSorting'
    });

    /**
     * Check with the list every few minutes
     * if any changes occured to the tasks currently shown.
     * If any tasks or logs changed, make a force update of info and retrieve everything again.
     * Do not poll the list if page is not visible!
     */
    const sync = useSyncTasks(date, userIds);

    /**
     * Get tasks from the list
     */
    const taskItems = useTasks(date, userIds, setLoading, sync);
    const [taskLogs, setTaskLogs] = taskItems.taskLogs;
    const [tasks, setTasks] = taskItems.tasks;

    /**
     * Data structures showing tasks and logs per user
     */
    const tasksPerUser = useTasksPerUser(tasks, taskLogs, userIds, selectedUsers, customSorting);

    /**
     * When a task is updated, it needs to be replaced within task logs and removed from tasks if present
     * @param t - updated task
     */
    const handleTaskUpdated = (t: ITaskLog) => {
        setTasks((prev) => prev.filter((p) => p.ID !== t.Task.ID));
        setTaskLogs((prev) => {
            let copy;
            const created = prev.find((p) => p.ID === t.ID) === undefined;
            if (created) {
                copy = [...prev].concat(t);
            } else {
                copy = prev.map((p) => (p.ID === t.ID ? t : p));
            }

            return copy;
        });
    };

    /**
     * Handle dragging tasks
     */
    const handleTaskDropped = async ({ destination, source, draggableId }: DropResult) => {
        if (!source || !destination) return;
        /**
         * Reassign to another user.
         * When reassigning to another user, the field user is updated
         * But original user is still mentioned in OriginalUser field
         * Unique validation field is also not updated,
         * to prevent task log being recreated upon refresh or sync
         */
        if (destination.droppableId !== source.droppableId) {
            const moveResults = tasksPerUser.move(
                +source.droppableId,
                +destination.droppableId,
                source.index,
                destination.index
            );
            try {
                let originalLog = moveResults.to.result.find(
                    (log) => getTaskUniqueId(log) === draggableId
                );
                if (isTask(originalLog)) {
                    originalLog = await TaskLogsService.createTaskLogFromTask(originalLog, date);
                    moveResults.to.result = moveResults.to.result.map((t) =>
                        getTaskUniqueId(t) === draggableId ? originalLog : t
                    );
                }
                const updated = await TaskLogsService.updateTaskLog(originalLog.ID, {
                    UserId: +destination.droppableId,
                    OriginalUserId: originalLog.OriginalUser?.ID ?? +source.droppableId,
                });
                handleTaskUpdated(updated);
                setCustomSorting((prev) => ({
                    ...prev,
                    [source.droppableId]: moveResults.from.result.map((i) => getTaskUniqueId(i)),
                    [destination.droppableId]: moveResults.to.result.map((i) => getTaskUniqueId(i)),
                }));
            } catch (e) {
                // Update failed, return state back
                SPnotify({
                    message: e.message + e.stack,
                    messageType: MessageBarType.error,
                    timeout: 10000,
                });
                setTaskLogs((prev) => [...prev]);
            }
        } else {
            let list = tasksPerUser.reorder(+source.droppableId, source.index, destination.index);
            setCustomSorting((prev) => ({
                ...prev,
                [source.droppableId]: list.result.map((i) => getTaskUniqueId(i)),
            }));
        }
    };

    const body = React.useMemo(() => {
        if (loading) return <Spinner size={SpinnerSize.large} />;

        return (
            <div className={styles.container}>
                {userIds.map((id) => {
                    const item = tasksPerUser.tasks[id];
                    // If user has no tasks assigned to him, do not show
                    if (!item) return null;
                    return (
                        <UserColumn
                            tasksPerUser={tasksPerUser.tasks}
                            id={id}
                            handleTaskUpdated={handleTaskUpdated}
                            date={date}
                        />
                    );
                })}
            </div>
        );
    }, [userIds, tasksPerUser.tasks, loading]);

    return (
        <DragDropContext onDragEnd={handleTaskDropped}>
            <div className={styles.tasks}>
                <Header
                    date={date}
                    setDate={setDate}
                    loading={loading}
                    setLoading={setLoading}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                />
                {body}
            </div>
        </DragDropContext>
    );
};

export default Tasks;
