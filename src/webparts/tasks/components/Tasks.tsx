import * as React from 'react';
import styles from './Tasks.module.scss';
import { useContext } from 'react';
import GlobalContext from '../utils/GlobalContext';
import ITask from '../models/ITask';
import Task from './Task/Task';

const Tasks: React.FC = (props) => {
  const { TaskService, TaskLogsService } = useContext(GlobalContext);

  React.useEffect(() => {
    TaskService.getTasksByUserTitle('Megan Bowen').then((t: ITask[]) => {
      TaskLogsService.createTaskLog(t[0], 'Megan Bowen')
    });
  }, [])

  return (
      <div className={ styles.tasks }>
        <div className={styles.container}>
          <Task />
        </div>
      </div>
  );
} 

export default Tasks;