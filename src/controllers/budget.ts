import { Request, Response } from "express";
import { listOfMonths } from "../utils";
import client from "../utils/postgres";
import {
  Budget,
  BudgetDate,
  BudgetItem,
  BudgetParam,
  BudgetResponse,
  User,
} from "../utils/types";

const getUserId = async (auth_id: string | undefined) => {
  const user = await client.query<User>(
    "SELECT * FROM users WHERE auth_id = $1 AND active = $2",
    [auth_id, true],
  );

  return user.rows[0].id;
};

export const createBudget = (req: Request, res: Response) => {
  (async () => {
    const { budgetData, auth_id } = req.body;
    const count = listOfMonths.length - 1;
    const date = new Date();
    const insertIds: number[] = [];
    let user_id: number;

    try {
      user_id = await getUserId(auth_id);
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id",
      });
    }

    try {
      for (let i = 0; i <= count; i++) {
        const insertMonth = listOfMonths[i];
        const insertYear = date.getFullYear();
        const insert =
          "INSERT into budget_date(month, year, user_id) VALUES ($1, $2, $3) RETURNING id";
        const values = [insertMonth, insertYear, user_id];

        try {
          const budgetDateId = await client.query(insert, values);

          budgetData.forEach(async (item: BudgetParam) => {
            const { type, label, amount, paid, month, year } = item;
            if (month === insertMonth && year === insertYear) {
              const insert =
                "INSERT into budget(type, label, amount, paid, user_id, budget_date_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";
              const values = [
                type,
                label,
                amount,
                paid,
                user_id,
                budgetDateId.rows[0].id,
              ];

              try {
                const budgetId = await client.query(insert, values);
                insertIds.push(budgetId.rows[0].id);
              } catch (err) {
                return res.status(500).json({
                  err,
                  action: "Insert into budget table",
                });
              }
            }
          });
        } catch (err) {
          return res.status(500).json({
            err,
            action: "Insert into budget_date table",
          });
        }
      }

      return res.status(200).json({
        budget_ids: insertIds,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id from user table",
      });
    }
  })();
};

export const updateBudgetItem = (req: Request, res: Response) => {
  (async () => {
    const { label, value, paid, budget_id } = req.body;
    const update =
      "UPDATE budget SET label = $1, amount = $2, paid = $3 WHERE id = $4";
    const values = [label, value, paid, budget_id];

    try {
      await client.query(update, values);

      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Update budget item",
      });
    }
  })();
};

export const getBudget = (req: Request, res: Response) => {
  (async () => {
    const auth_id = req.auth?.payload.sub;
    let user_id: number;

    try {
      user_id = await getUserId(auth_id);
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id",
      });
    }

    try {
      const budgetDate = await client.query<BudgetDate>(
        "SELECT * FROM budget_date WHERE user_id = $1",
        [user_id],
      );
      const fullBudget: BudgetResponse[] = [];
      const income: BudgetItem[] = [];
      const expense: BudgetItem[] = [];

      budgetDate.rows.forEach(async (item: BudgetDate) => {
        try {
          const budgetIncome = await client.query<Budget>(
            "SELECT * FROM budget WHERE budget_date_id = $1 AND type = $2",
            [item.id, "income"],
          );
          const budgetExpense = await client.query<Budget>(
            "SELECT * FROM budget WHERE budget_date_id = $1 AND type = $2",
            [item.id, "expense"],
          );

          budgetIncome.rows.forEach((response: Budget) => {
            income.push({
              label: response.label,
              value: response.amount,
              paid: response.paid,
              budget_id: item.id,
            });
          });

          budgetExpense.rows.forEach((response: Budget) => {
            expense.push({
              label: response.label,
              value: response.amount,
              paid: response.paid,
              budget_id: item.id,
            });
          });

          fullBudget.push({
            year: item.year,
            month: item.month,
            income,
            expense,
          });
        } catch (err) {
          return res.status(500).json({
            err,
            action: "Get budget info",
          });
        }
      });

      return res.status(200).json({
        budget: fullBudget,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get budget_date info",
      });
    }
  })();
};

export const deleteBudgetItem = (req: Request, res: Response) => {
  (async () => {
    const { budget_id } = req.body;

    try {
      await client.query("DELETE FROM budget WHERE id = $1", [budget_id]);

      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Delete budget item",
      });
    }
  })();
};
