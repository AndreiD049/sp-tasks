import { cloneDeep } from '@microsoft/sp-lodash-subset';
import { MessageBarType, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import * as React from 'react';
import { useContext } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import createState from 'use-persisted-state';
import useSyncTasks from '../hooks/useSyncTasks';
import { useTasks } from '../hooks/useTasks';
import { useTasksPerUser } from '../hooks/useTasksPerUser';
import ITaskLog from '../models/ITaskLog';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';
import {
    getTaskId,
    ICustomSorting,
    getReassignedTaskLog,
    reorder,
    move,
} from '../utils/utils';
import Header from './Header';
import styles from './Tasks.module.scss';
import UserColumn from './UserColumn';
import { SPnotify } from 'sp-react-notifications';
import { List } from 'sp-preset';

const useSelectedUsers = createState('selectedUsers');
const useCustomSorting = createState('customTaskSorting');
const useSelectedDate = createState('selectedDate', sessionStorage);

const Tasks: React.FC = () => {
    const { currentUser, TaskLogsService } = useContext(GlobalContext);

    const [dateStr, setDate]: [Date, any] = useSelectedDate(new Date());
    const date = React.useMemo(() => new Date(dateStr), [dateStr]);

    const [selectedUsers, setSelectedUsers]: [IUser[], any] = useSelectedUsers(
        []
    );
    const userIds = React.useMemo(
        () => [currentUser.User.ID, ...selectedUsers.map((u) => u.User.ID)],
        [selectedUsers]
    );

    const [loading, setLoading] = React.useState(true);

    /**
     * Custom sorting of tasks.
     * Applied when user changes task order manually (drag & drop)
     */
    const [customSorting, setCustomSorting]: [ICustomSorting, any] =
        useCustomSorting({});

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
    const tasksPerUser = useTasksPerUser(
        tasks,
        taskLogs,
        userIds,
        selectedUsers,
        customSorting
    );

    /**
     * When a task is updated, it needs to be replaced within task logs and removed from tasks if present
     * @param t - updated task
     */
    const handleTaskUpdated = (t: ITaskLog) => {
        setTasks((prev) => prev.filter((p) => p.ID !== t.ID));
        setTaskLogs((prev) => prev.map((p) => (p.ID === t.ID ? t : p)));
    };

    /**
     * TODO: Refactor. This function is pretty long and chaotic
     */
    const handleTaskDropped = async ({
        destination,
        source,
        draggableId,
    }: DropResult) => {
        if (!source || !destination) return;
        /**
         * Reassign to another user.
         * When reassigning to another user, the field user is updated
         * But original user is still mentioned in OriginalUser field
         * Unique validation field is also not updated,
         * to prevent task log being recreated upon refresh or sync
         */
        if (destination.droppableId !== source.droppableId) {
            const originalLogs = cloneDeep(taskLogs);
            const originalLog = originalLogs.find((l) => l.ID === +draggableId);
            // Prerender updated collumns
            setTaskLogs((prev) =>
                prev.map((log) =>
                    log.ID === +draggableId
                        ? getReassignedTaskLog(log, +destination.droppableId)
                        : log
                )
            );
            const moveResults = move(
                tasksPerUser[source.droppableId].result,
                tasksPerUser[destination.droppableId].result,
                source.index,
                destination.index
            );
            setCustomSorting((prev) => ({
                ...prev,
                [source.droppableId]: moveResults.from.map((i) => getTaskId(i)),
                [destination.droppableId]: moveResults.to.map((i) => getTaskId(i)),
            }));
            try {
                const updated = await TaskLogsService.updateTaskLog(
                    +draggableId,
                    {
                        UserId: +destination.droppableId,
                        OriginalUserId:
                            originalLog.OriginalUser?.ID ?? +source.droppableId,
                    }
                );
                setTaskLogs((prev) =>
                    prev.map((log) => (log.ID === updated.ID ? updated : log))
                );
            } catch (e) {
                // Update failed, return state back
                SPnotify({
                    message: e.message,
                    messageType: MessageBarType.error,
                    timeout: 10000,
                });
                setTaskLogs(originalLogs);
            }
        } else {
            let list = tasksPerUser[source.droppableId].result;
            list = reorder(list, source.index, destination.index);
            setCustomSorting((prev) => ({
                ...prev,
                [source.droppableId]: list.map((i) => getTaskId(i)),
            }));
        }
    };

    const body = React.useMemo(() => {
        if (loading) return <Spinner size={SpinnerSize.large} />;

        return (
            <div className={styles.container}>
                {userIds.map((id) => {
                    const item = tasksPerUser[id];
                    // If user has no tasks assigned to him, do not show
                    if (!item) return null;
                    return (
                        <UserColumn
                            tasksPerUser={tasksPerUser}
                            id={id}
                            handleTaskUpdated={handleTaskUpdated}
                        />
                    );
                })}
            </div>
        );
    }, [userIds, tasksPerUser, loading]);

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
