import { Persona } from 'office-ui-fabric-react';
import * as React from 'react';
import { FC } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { ITasksPerUser } from '../hooks/useTasksPerUser';
import ITaskLog from '../models/ITaskLog';
import GlobalContext from '../utils/GlobalContext';
import { getTaskId } from '../utils/utils';
import Task from './Task';
import styles from './Tasks.module.scss';

export interface IUserColumnsProps {
    tasksPerUser: ITasksPerUser;
    id: number;
    handleTaskUpdated: (t: ITaskLog) => void;
}

const UserColumn: FC<IUserColumnsProps> = ({
    tasksPerUser,
    id,
    handleTaskUpdated,
}) => {
    const { canEditOthers } = React.useContext(GlobalContext);
    return (
        <Droppable
            droppableId={id.toString()}
            type={canEditOthers ? 'any' : id.toString()}
        > 
            {(provided) => (
                <div 
                    className={styles.taskContainer}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    <Persona
                        text={
                            tasksPerUser[id]?.user.User
                                .Title
                        }
                        imageUrl={`/_layouts/15/userphoto.aspx?AccountName=${tasksPerUser[id]?.user.User.EMail}&Size=M`}
                    />
                    {tasksPerUser[id]?.result.map(
                        (task, index) => (
                            <Task
                                task={task}
                                index={index}
                                handleTaskUpdated={ handleTaskUpdated }
                                key={getTaskId(task)}
                            />
                        )
                    )}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default UserColumn;
