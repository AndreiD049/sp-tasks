import { DateTime } from 'luxon';
import { IconButton, Text } from 'office-ui-fabric-react';
import * as React from 'react';

export interface IDateSelectorProps
    extends React.HTMLAttributes<HTMLDivElement> {
    date: Date;
    loading: boolean;
    setDate: (d: Date) => void;
}

const DateSelector: React.FC<IDateSelectorProps> = (props) => {
    const dateString = DateTime.fromJSDate(props.date).toLocaleString(
        DateTime.DATE_HUGE
    );
    const dt = React.useMemo(() => DateTime.fromJSDate(props.date), [props.date]).toISODate();
    const minDate = React.useMemo(() => DateTime.now().minus({ 'weeks': 1 }).toISODate(), []);
    const maxDate = React.useMemo(() => DateTime.now().plus({ 'weeks': 1 }).toISODate(), []);

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
                disabled={props.loading || dt <= minDate}
            />
            <Text
                style={{
                    minWidth: '250px',
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
                disabled={props.loading || dt >= maxDate}
            />
        </div>
    );
};

export default DateSelector;
