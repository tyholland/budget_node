import { Request, Response } from "express";
import client from "../utils/postgres";
import { Budget, User } from "../utils/types";

const checkForExistingUser = async (auth_id: string | undefined) => {
  const user = await client.query<User>(
    "SELECT * FROM users WHERE auth_id = $1",
    [auth_id],
  );

  return {
    exists: user.rowCount ? user.rowCount > 0 : false,
    id: user.rows[0].id,
  };
};

export const createUser = (req: Request, res: Response) => {
  (async () => {
    const { email } = req.body;
    const auth_id = req.auth?.payload.sub;
    const insert =
      "INSERT into users(auth_id, email, active) VALUES ($1, $2, $3)";
    const values = [auth_id, email, true];
    let user;
    let budgetInfo;
    let hasBudget: boolean;

    try {
      user = await checkForExistingUser(auth_id);

      budgetInfo = await client.query<Budget>(
        "SELECT * FROM budget WHERE user_id = $1",
        [user.id],
      );

      hasBudget = budgetInfo.rowCount ? budgetInfo.rowCount > 0 : false;

      if (user.exists) {
        return res.status(206).json({
          action: "User already exists",
          hasBudget,
        });
      }
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id and check for budget data",
      });
    }

    try {
      await client.query<User>(insert, values);

      return res.status(200).json({
        success: true,
        hasBudget,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Create user",
      });
    }
  })();
};

export const deleteUser = (req: Request, res: Response) => {
  (async () => {
    const auth_id = req.auth?.payload.sub;
    const update = "UPDATE users SET active = $1 WHERE auth_id = $2";
    const values = [false, auth_id];

    // Add code to delete user from auth0

    try {
      await client.query(update, values);

      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Delete user",
      });
    }
  })();
};
