import * as React from 'react';
import { FC } from 'react';
import { IUser } from '../models/IUser';
import DateSelector from './DateSelector';
import styles from './Tasks.module.scss';
import UserSelctor from './UserSelector';

export interface IHeaderProps {
    date: Date;
    loading: boolean;
    setLoading: (value: boolean) => void;
    setDate: (value: Date) => void;
    selectedUsers: IUser[];
    setSelectedUsers: any;
}

const Header: FC<IHeaderProps> = (props) => {
    return (
        <div className={styles.commandbar}>
            <DateSelector
                date={props.date}
                setDate={(val) => {
                    props.setLoading(true);
                    props.setDate(val);
                }}
                loading={props.loading}
                className={styles.selector}
            />
            <UserSelctor
                users={props.selectedUsers}
                setUsers={props.setSelectedUsers}
                className={styles.userSelector}
            />
        </div>
    );
};

export default Header;
