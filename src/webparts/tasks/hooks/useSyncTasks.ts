import * as React from 'react';
import { useVisibility } from 'react-visibility-hook';
import { MINUTE } from '../utils/constants';
import GlobalContext from '../utils/GlobalContext';

export default function useSyncTasks(date: Date, userIds: number[]) {
    const { TaskLogsService, TaskService } = React.useContext(GlobalContext);
    const visibility = useVisibility();
    const [update, setUpdate] = React.useState(false);
    const timeout = MINUTE * 2;

    React.useEffect(() => {
        // aquire the change token on start
        TaskLogsService.didTaskLogsChanged(date, userIds);
        TaskService.didTasksChanged(userIds);
    }, []);

    const checkSync = React.useCallback(async () => {
        if (visibility.visible) {
            const logsChanged = await TaskLogsService.didTaskLogsChanged(
                date,
                userIds
            );
            const tasksChanged = await TaskService.didTasksChanged(userIds);
            tasksChanged && TaskService.clearCache();
            if (logsChanged || tasksChanged) {
                setUpdate((prev) => !prev);
            }
        }
    }, [visibility, date, userIds]);

    React.useEffect(() => {
        if (visibility.visible && visibility.sinceLastVisible() >= timeout) {
            checkSync();
        }
        const timer = setInterval(checkSync, timeout);
        return () => clearInterval(timer);
    }, [visibility]);

    return update;
}
