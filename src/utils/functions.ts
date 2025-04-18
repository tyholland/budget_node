import { Client, QueryResult } from "pg";
import { AddedBudgetItem, BudgetItem, User } from "./types";
import { listOfMonths } from "./constants";

export const sortBudget = (a: BudgetItem, b: BudgetItem) => {
  return a.label.toLowerCase() > b.label.toLowerCase()
    ? 1
    : a.label.toLowerCase() < b.label.toLowerCase()
      ? -1
      : 0;
};

export const getUserId = async (
  auth_id: string | undefined,
  client: Client,
) => {
  const user = await client.query<User>(
    "SELECT * FROM users WHERE auth_id = $1 AND active = $2",
    [auth_id, true],
  );

  return user.rows[0].id;
};

export const checkForExistingUser = async (
  auth_id: string | undefined,
  client: Client,
) => {
  const user = await client.query<User>(
    "SELECT * FROM users WHERE auth_id = $1",
    [auth_id],
  );

  return {
    exists: user.rowCount ? user.rowCount > 0 : false,
    id: user.rows.length > 0 ? user.rows[0].id : undefined,
    subscription_id:
      user.rows.length > 0 ? user.rows[0].subscription_id : undefined,
  };
};

const getFrequencyValue = (value: number, frequency?: string) => {
  if (!frequency) {
    return value;
  }

  switch (frequency) {
    case "Daily":
      return value * 30; // npm package to get business days in month
    case "Weekly":
      return value * 4;
    case "Bi-Weekly":
      return value * 2;
    case "Monthly":
      return value;
    default:
      return value;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateBasedOnCadence = async (
  client: Client,
  responseBody: BudgetItem,
  budgetData: QueryResult<any>,
  queryString: string,
) => {
  const { label, value, paid, budget_id, budget_date_id, frequency, cadence } =
    responseBody;
  const currentDate = new Date(Date.now()).toISOString();
  const freqValue = getFrequencyValue(value, frequency);

  if (cadence === "Current Month") {
    const values = [label, freqValue, paid, currentDate, frequency, budget_id];

    await client.query(queryString, values);
  }

  if (cadence === "Future Months") {
    let startingMonth: number;

    try {
      const selectedMonth = await client.query(
        "SELECT month FROM budget_date WHERE id = ?",
        [budget_date_id],
      );
      startingMonth = listOfMonths.indexOf(selectedMonth.rows[0].month);
    } catch (err) {
      console.error(err);
      startingMonth = 0;
    }

    for (let i = startingMonth; i <= 11; i++) {
      const values = [
        label,
        freqValue,
        paid,
        currentDate,
        frequency,
        budgetData.rows[i].id,
      ];

      await client.query(queryString, values);
    }
  }

  if (cadence === "All Months") {
    if (frequency === "Quarterly") {
      for (let i = 0; i <= 11; i++) {
        const values = [
          label,
          freqValue,
          paid,
          currentDate,
          frequency,
          budgetData.rows[i].id,
        ];

        if (i === 2 || i === 5 || i === 8 || i === 11) {
          await client.query(queryString, values);
        }
      }
    }

    for (let i = 0; i <= 11; i++) {
      const values = [
        label,
        freqValue,
        paid,
        currentDate,
        frequency,
        budgetData.rows[i].id,
      ];

      await client.query(queryString, values);
    }
  }
};

export const insertBasedOnCadence = async (
  client: Client,
  responseBody: AddedBudgetItem,
  queryString: string,
  user_id: number,
) => {
  const { type, label, value, paid, budget_date_id, frequency, cadence } =
    responseBody;
  const currentDate = new Date(Date.now()).toISOString();
  const freqValue = getFrequencyValue(value, frequency);
  const values = [
    type,
    label,
    freqValue,
    paid,
    user_id,
    budget_date_id,
    currentDate,
    frequency,
  ];

  if (cadence === "Future Months") {
    let startingMonth: number;
    const budgetArray: number[] = [];

    try {
      const selectedMonth = await client.query(
        "SELECT month FROM budget_date WHERE id = ?",
        [budget_date_id],
      );
      startingMonth = listOfMonths.indexOf(selectedMonth.rows[0].month);
    } catch (err) {
      console.error(err);
      startingMonth = 0;
    }

    for (let i = startingMonth; i <= 11; i++) {
      const budgetId = await client.query(queryString, values);
      budgetArray.push(budgetId.rows[0].id);
    }

    return budgetArray;
  }

  if (cadence === "All Months") {
    const budgetArray: number[] = [];

    if (frequency === "Quarterly") {
      for (let i = 0; i <= 11; i++) {
        if (i === 2 || i === 5 || i === 8 || i === 11) {
          const budgetId = await client.query(queryString, values);
          budgetArray.push(budgetId.rows[0].id);
        }
      }

      return budgetArray;
    }

    for (let i = 0; i <= 11; i++) {
      const budgetId = await client.query(queryString, values);
      budgetArray.push(budgetId.rows[0].id);
    }

    return budgetArray;
  }

  const budgetId = await client.query(queryString, values);
  return budgetId.rows[0].id;
};
