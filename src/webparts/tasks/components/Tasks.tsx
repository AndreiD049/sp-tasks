import {
    MessageBarType,
    Spinner,
    SpinnerSize,
} from 'office-ui-fabric-react';
import * as React from 'react';
import { useContext } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { SPnotify } from 'sp-react-notifications';
import createState from 'use-persisted-state';
import useSyncTasks from '../hooks/useSyncTasks';
import { useTasks } from '../hooks/useTasks';
import { useTasksPerUser } from '../hooks/useTasksPerUser';
import ITaskLog from '../models/ITaskLog';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';
import { getTaskId, ICustomSorting, reorder } from '../utils/utils';
import DateSelector from './DateSelector';
import Header from './Header';
import styles from './Tasks.module.scss';
import UserColumn from './UserColumn';
import UserSelctor from './UserSelector';

const useSelectedUsers = createState('selectedUsers');
const useCustomSorting = createState('customTaskSorting');
const useSelectedDate = createState('selectedDate', sessionStorage);

const Tasks: React.FC = () => {
    const { currentUser, canEditOthers } = useContext(GlobalContext);

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

    const handleTaskDropped = ({ destination, source }: DropResult) => {
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

    const body = React.useMemo(() => {
        if (loading) return <Spinner size={SpinnerSize.large} />;

        return (
            <div className={styles.container}>
                {userIds.map((id) => {
                    const item = tasksPerUser[id];
                    // If user has no tasks assigned to him, do not show
                    if (!item || item.result.length === 0) return null;

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
