import { IconButton, Text } from "office-ui-fabric-react";
import * as React from "react";
import { FC } from "react";
import styles from "./Task.module.scss";

const Task: FC = () => {
  return (
    <div className={styles.task}>
        <div className={styles.header}>
            <Text variant="mediumPlus">Task header</Text>
        </div>
        <div className={styles.subheader}>
            <Text variant="smallPlus">13/03/2022</Text>
            <Text variant="smallPlus" className={styles.hours}>12:00</Text>
            <div className={styles.person}>Andrei</div>
        </div>
        <IconButton
            iconProps={{ iconName: "ChevronDown" }}
            styles={{
            icon: {
                fontSize: "1em",
            },
            }}
        />
    </div>
  );
};

export default Task;
