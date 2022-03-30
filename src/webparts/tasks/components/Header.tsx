import * as React from 'react';
import { FC } from 'react';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';
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
    const { maxPeople } = React.useContext(GlobalContext);

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
            {maxPeople > 0 ? (
                <UserSelctor
                    users={props.selectedUsers}
                    setUsers={props.setSelectedUsers}
                    className={styles.userSelector}
                />
            ) : null}
        </div>
    );
};

export default Header;
