import * as React from 'react';
import { shallow } from 'enzyme';
import ITask, { TaskType } from '../models/ITask';
import Task from './Task';

const task: ITask = {
    ID: 1,
    Description: 'Hello world',
    Time: "2022-03-26T07:00:00Z",
    Title: "Hello task",
    AssignedTo: {
        ID: 1,
        EMail: "user@company.com",
        Title: "Username Usernamovich"
    },
    Type: TaskType.Daily,
    WeeklyDays: null,
}

test('Task renders correctly', () => {
    const component = shallow(
        <Task 
            date={new Date()}
            handleTaskUpdated={() => null}
            index={0}
            task={task}
        />
    );
    expect(component.find('*[data-testid=\'task-person\']').text()).toBe(task.Title);
});