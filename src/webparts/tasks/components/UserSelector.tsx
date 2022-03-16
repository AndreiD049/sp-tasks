import { ComboBox, IComboBoxOption } from 'office-ui-fabric-react';
import * as React from 'react';
import { IUser } from '../models/IUser';
import GlobalContext from '../utils/GlobalContext';

export interface IUserSelectorProps
    extends React.HTMLAttributes<HTMLDivElement> {
    users: IUser[];
    setUsers: (users: IUser[]) => void;
}

const UserSelctor: React.FC<IUserSelectorProps> = (props) => {
    const { teamMembers } = React.useContext(GlobalContext);

    const options = React.useMemo(
        () =>
            teamMembers.map((member) => ({
                key: member.User.ID,
                text: member.User.Title,
                data: member,
            })),
        [teamMembers]
    );

    const selectedKeys = React.useMemo(
        () => props.users.map((u) => u.User.ID),
        [props.users]
    );

    const handleChange = (_ev: any, option: IComboBoxOption) => {
        console.log(option, [...props.users, option.data]);
        if (option.selected) {
            props.setUsers([...props.users, option.data]);
        } else {
            props.setUsers(props.users.filter((u) => u.User.ID !== option.data.User.ID))
        }
    }

    return (
        <div className={props.className}>
            <ComboBox
                multiSelect
                options={options}
                selectedKey={selectedKeys}
                onChange={handleChange}
                useComboBoxAsMenuWidth
            />
        </div>
    );
};

export default UserSelctor;
