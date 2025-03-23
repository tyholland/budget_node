import { Request, Response } from "express";
import client from "../utils/postgres";
import { User } from "../utils/types";

const checkForExistingUser = async (auth_id: string | undefined) => {
  const user = await client.query<User>(
    "SELECT * FROM users WHERE auth_id = $1",
    [auth_id],
  );

  return user.rowCount ? user.rowCount > 0 : false;
};

export const createUser = (req: Request, res: Response) => {
  (async () => {
    console.log(req.body);
    const { email } = req.body;
    const auth_id = req.auth?.payload.sub;
    const insert =
      "INSERT into users(auth_id, email, active) VALUES ($1, $2, $3)";
    const values = [auth_id, email, true];

    try {
      const user = await checkForExistingUser(auth_id);

      if (user) {
        return res.status(204).json({
          action: "User already exists",
        });
      }
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id",
      });
    }

    try {
      await client.query<User>(insert, values);

      return res.status(200).json({
        success: true,
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
    const update = "UPDATE users SET active = ? WHERE auth_id = ?";
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
