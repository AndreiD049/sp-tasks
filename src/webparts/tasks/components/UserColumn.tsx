import { Persona } from 'office-ui-fabric-react';
import * as React from 'react';
import { FC } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { ITasksPerUser } from '../hooks/useTasksPerUser';
import ITaskLog from '../models/ITaskLog';
import GlobalContext from '../utils/GlobalContext';
import { getTaskUniqueId } from '../utils/utils';
import NoTasks from './NoTasks';
import Task from './Task';
import styles from './Tasks.module.scss';

export interface IUserColumnsProps {
    tasksPerUser: ITasksPerUser;
    id: number;
    handleTaskUpdated: (t: ITaskLog) => void;
    date: Date;
}

const UserColumn: FC<IUserColumnsProps> = ({ tasksPerUser, id, handleTaskUpdated, date }) => {
    const { canEditOthers } = React.useContext(GlobalContext);

    let body;

    if (tasksPerUser[id]?.result && tasksPerUser[id]?.result.length > 0) {
        body = tasksPerUser[id]?.result.map((task, index) => (
            <Task
                task={task}
                index={index}
                date={date}
                handleTaskUpdated={handleTaskUpdated}
                key={getTaskUniqueId(task)}
            />
        ));
    } else {
        body = <NoTasks />
    }

    return (
        <Droppable droppableId={id.toString()} type={canEditOthers ? 'any' : id.toString()}>
            {(provided) => (
                <div
                    className={styles.taskContainer}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    <Persona
                        text={tasksPerUser[id]?.user.User.Title}
                        imageUrl={`/_layouts/15/userphoto.aspx?AccountName=${tasksPerUser[id]?.user.User.EMail}&Size=M`}
                    />
                    {body}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default UserColumn;
