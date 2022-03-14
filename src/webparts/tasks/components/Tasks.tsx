import * as React from 'react'
import styles from './Tasks.module.scss'
import { useContext } from 'react'
import GlobalContext from '../utils/GlobalContext'
import ITask from '../models/ITask'
import Task from './Task/Task'
import ITaskLog from '../models/ITaskLog'

const Tasks: React.FC = (props) => {
    const { TaskService, TaskLogsService } = useContext(GlobalContext)
    const [date, setDate] = React.useState<Date>(new Date());
    const [taskLogs, setTaskLogs] = React.useState<ITaskLog[]>([]);

    React.useEffect(() => {
        async function run() {
            const logs = await TaskLogsService.getTaskLogs(date);
            setTaskLogs(logs);
        }
        run();
    }, [])

    return (
        <div className={styles.tasks}>
            <div className={styles.container}>
                {
                    taskLogs.map((log) => (
                        <Task task={log} />
                    ))
                }
            </div>
        </div>
    )
}

export default Tasks
