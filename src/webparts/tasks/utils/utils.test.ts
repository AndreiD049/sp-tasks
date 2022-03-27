import { DateTime } from "luxon";
import { WeekDay } from "../models/ITask";
import { getNthWorkday, getNumberOfWorkdaysInMonth, getWeekDaySet } from "./utils";

test('Able to get number of workdays in month', () => {
    const dt = DateTime.fromISO('2022-03-22');
    expect(getNumberOfWorkdaysInMonth(dt)).toBe(23);
});

test('Able to get number of workdays in june', () => {
    const dt = DateTime.fromISO('2022-06-22');
    expect(getNumberOfWorkdaysInMonth(dt)).toBe(22);
});

test('Get nth workday from the first week', () => {
    let dt = DateTime.fromISO('2022-03-01');
    expect(getNthWorkday(dt)).toBe(1);
    dt = DateTime.fromISO('2022-03-02');
    expect(getNthWorkday(dt)).toBe(2);
    dt = DateTime.fromISO('2022-03-03');
    expect(getNthWorkday(dt)).toBe(3);
    dt = DateTime.fromISO('2022-03-04');
    expect(getNthWorkday(dt)).toBe(4);
});

test('Get nth workday weekend', () => {
    const dt = DateTime.fromISO('2022-03-27');
    expect(getNthWorkday(dt)).toBe(0);
});

test('Get nth workday from second week', () => {
    let dt = DateTime.fromISO('2022-03-07');
    expect(getNthWorkday(dt)).toBe(5);
    dt = DateTime.fromISO('2022-03-08');
    expect(getNthWorkday(dt)).toBe(6);
    dt = DateTime.fromISO('2022-03-09');
    expect(getNthWorkday(dt)).toBe(7);
    dt = DateTime.fromISO('2022-03-10');
    expect(getNthWorkday(dt)).toBe(8);
    dt = DateTime.fromISO('2022-03-11');
    expect(getNthWorkday(dt)).toBe(9);
});

test('Get nth workday in the last week', () => {
    let dt = DateTime.fromISO('2022-03-22');
    expect(getNthWorkday(dt)).toBe(16);
    dt = DateTime.fromISO('2022-03-29');
    expect(getNthWorkday(dt)).toBe(21);
    expect(getNthWorkday(dt.endOf('month')))
        .toBe(getNumberOfWorkdaysInMonth(dt));
});

test('Get weekday set when empty', () => {
    expect(getWeekDaySet([]).size).toBe(0);
});

test('Get weekday set whole week', () => {
    const set = getWeekDaySet([
        WeekDay.Mon,
        WeekDay.Tue,
        WeekDay.Wed,
        WeekDay.Thu,
        WeekDay.Fri,
        WeekDay.Sat,
        WeekDay.Sun,
    ]);
    expect(set.has(1)).toBeTruthy();
    expect(set.has(2)).toBeTruthy();
    expect(set.has(3)).toBeTruthy();
    expect(set.has(4)).toBeTruthy();
    expect(set.has(5)).toBeTruthy();
    expect(set.has(6)).toBeTruthy();
    expect(set.has(7)).toBeTruthy();
});

test('Get weekday set missing day', () => {
    const set = getWeekDaySet([
        WeekDay.Mon,
        WeekDay.Tue,
        WeekDay.Thu,
        WeekDay.Fri,
        WeekDay.Sat,
        WeekDay.Sun,
    ]);
    expect(set.has(3)).toBeFalsy();
});