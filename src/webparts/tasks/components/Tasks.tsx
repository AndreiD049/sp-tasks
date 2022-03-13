import * as React from 'react';
import styles from './Tasks.module.scss';
import { useContext } from 'react';
import GlobalContext from '../utils/GlobalContext';
import ITask from '../models/ITask';

const Tasks: React.FC = (props) => {
  const { TaskService, TaskLogsService } = useContext(GlobalContext);

  React.useEffect(() => {
    TaskService.getTasksByUserTitle('Megan Bowen').then((t: ITask[]) => {
      TaskLogsService.createTaskLog(t[0], 'Megan Bowen')
    });
  }, [])

  return (
      <div className={ styles.tasks }>
        <div className={ styles.container }>
          <div className={ styles.row }>
            <div className={ styles.column }>
              <span className={ styles.title }>Welcome to SharePoint!</span>
              <p className={ styles.subTitle }>Customize SharePoint experiences using Web Parts.</p>
              <a href="https://aka.ms/spfx" className={ styles.button }>
                <span className={ styles.label }>Learn more</span>
              </a>
            </div>
          </div>
        </div>
      </div>
  );
} 

export default Tasks;