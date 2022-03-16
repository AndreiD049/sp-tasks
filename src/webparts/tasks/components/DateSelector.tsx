import { DateTime } from 'luxon';
import { IconButton, Text } from 'office-ui-fabric-react';
import * as React from 'react';

export interface IDateSelectorProps
    extends React.HTMLAttributes<HTMLDivElement> {
    date: Date;
    setDate: (d: Date) => void;
}

const DateSelector: React.FC<IDateSelectorProps> = (props) => {
    const dateString = DateTime.fromJSDate(props.date).toLocaleString(
        DateTime.DATE_HUGE
    );

    const changeDate = React.useCallback(
        (amount: number) =>
            props.setDate(
                DateTime.fromJSDate(props.date)
                    .plus({ days: amount })
                    .toJSDate()
            ),
        [props.date]
    );

    return (
        <div className={props.className}>
            <IconButton
                iconProps={{ iconName: 'ChevronLeft' }}
                onClick={changeDate.bind({}, -1)}
            />
            <Text
                style={{
                    minWidth: '300px',
                    display: 'inline-block',
                    textAlign: 'center',
                }}
                variant="large"
            >
                {dateString}
            </Text>
            <IconButton
                iconProps={{ iconName: 'ChevronRight' }}
                onClick={changeDate.bind({}, 1)}
            />
        </div>
    );
};

export default DateSelector;
