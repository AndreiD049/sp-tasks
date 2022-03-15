import * as React from 'react'
import styles from './Tasks.module.scss'
import { useContext } from 'react'
import GlobalContext from '../utils/GlobalContext'
import Task from './Task/Task'
import ITaskLog from '../models/ITaskLog'
import ITask from '../models/ITask'
import { DateTime } from 'luxon'
import DateSelector from './DateSelector'
import { Spinner, SpinnerSize, Text } from 'office-ui-fabric-react'

const Tasks: React.FC = (props) => {
    const { TaskService, TaskLogsService, currentUser } =
        useContext(GlobalContext)
    const [date, setDate] = React.useState<Date>(new Date())
    const [loading, setLoading] = React.useState(true)
    const [taskLogs, setTaskLogs] = React.useState<ITaskLog[]>([])
    const [tasks, setTasks] = React.useState<ITask[]>([])
    const isSameDay = React.useMemo(
        () => DateTime.fromJSDate(date).hasSame(DateTime.now(), 'day'),
        [date]
    )

    const checkTasksAndCreateTaskLogs = async (
        tasks: ITask[],
        logs: ITaskLog[]
    ) => {
        let missing: ITask[] = []
        let logSet = new Set(logs.map((log) => log.Task.ID))
        tasks.forEach((task) => {
            if (!logSet.has(task.ID)) {
                missing.push(task)
            }
        })
        const results = await TaskLogsService.createTaskLogs(missing, date)
        let newLogs =
            results.length === 0
                ? []
                : await TaskLogsService.getTaskLogsFromAddResult(results)
        return newLogs
    }

    React.useEffect(() => {
        async function run() {
            const tasks = await TaskService.getTasksByUserId(currentUser.Id)
            setTasks(tasks)
            if (isSameDay) {
                const logs = await TaskLogsService.getTaskLogs(date)
                setTaskLogs(
                    logs.concat(await checkTasksAndCreateTaskLogs(tasks, logs))
                )
            } else {
                const logs = await TaskLogsService.getTaskLogs(date)
                setTaskLogs(logs)
            }
            setLoading(false)
        }
        setLoading(true)
        run()
    }, [date])

    const handleTaskUpdate = (t: ITaskLog) => {
        setTasks((prev) => prev.filter((p) => p.ID !== t.ID))
        setTaskLogs((prev) => prev.map((p) => (p.ID === t.ID ? t : p)))
    }

    const body = loading ? (
        <Spinner size={SpinnerSize.large} />
    ) : (
        <div className={styles.container}>
            <div className={styles.taskContainer}>
                <Text variant='mediumPlus' block style={{textAlign: 'center'}}>Username</Text>
                {taskLogs.map((log) => (
                    <Task
                        task={log}
                        handleTaskUpdated={handleTaskUpdate}
                        key={`log-${log.ID}`}
                    />
                ))}
                {/* if not the same day, show also the tasks */}
                {!isSameDay
                    ? tasks.map((task) => (
                          <Task
                              task={task}
                              handleTaskUpdated={handleTaskUpdate}
                              key={`task-${task.ID}`}
                          />
                      ))
                    : null}
            </div>
            <div className={styles.taskContainer}>
                <Text variant='mediumPlus' block style={{textAlign: 'center'}}>Username</Text>
                {taskLogs.map((log) => (
                    <Task
                        task={log}
                        handleTaskUpdated={handleTaskUpdate}
                        key={`log-${log.ID}`}
                    />
                ))}
                {/* if not the same day, show also the tasks */}
                {!isSameDay
                    ? tasks.map((task) => (
                          <Task
                              task={task}
                              handleTaskUpdated={handleTaskUpdate}
                              key={`task-${task.ID}`}
                          />
                      ))
                    : null}
            </div>
        </div>
    )

    return (
        <div className={styles.tasks}>
            <div className={styles.commandbar}>
                <DateSelector
                    date={date}
                    setDate={setDate}
                    className={styles.selector}
                />
                {body}
            </div>
        </div>
    )
}

export default Tasks
