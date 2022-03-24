import * as React from "react";
import { IVisibilityState, useVisibility } from "react-visibility-hook";
import { MINUTE } from "../utils/constants";
import GlobalContext from "../utils/GlobalContext";

export default function useSyncTasks(date: Date, userIds: number[]) {
    const {TaskLogsService, TaskService} = React.useContext(GlobalContext);
    const visibility = useVisibility();
    const [update, setUpdate] = React.useState(false);

    React.useEffect(() => {
        TaskLogsService.didTaskLogsChanged(date, userIds);
        TaskService.didTasksChanged(userIds);
        const timer = setInterval(async () => {
            const logsChanged = await TaskLogsService.didTaskLogsChanged(
                date,
                userIds
            );
            const tasksChanged = await TaskService.didTasksChanged(userIds);
            tasksChanged && TaskService.clearCache();
            console.log(visibility, visibility.sinceLastVisible());
            if (logsChanged || tasksChanged) {
                setUpdate((prev) => !prev);
            }
        }, MINUTE / 6);
        return () => clearInterval(timer);
    }, []);

    return update;
}