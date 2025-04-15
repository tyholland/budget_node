import { Client } from "pg";
import { BudgetItem, User } from "./types";

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
