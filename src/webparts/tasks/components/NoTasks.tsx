import { Text } from "office-ui-fabric-react";
import * as React from "react";
import { FC } from "react";
import styles from './Tasks.module.scss';
import * as strings from 'TasksWebPartStrings';

const NoTasks: FC = () => {
    return (
        <div className={styles.noTasks}>
            <Text variant="medium">
                {strings.NoTasksLabel}
            </Text>
        </div>
    );
};

export default NoTasks;
