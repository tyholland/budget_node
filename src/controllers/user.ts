import { Request, Response } from "express";
import { client } from "../utils/postgres";
import { User } from "../utils/types";

export const createUser = (req: Request, res: Response) => {
  (async () => {
    const { auth_id, email } = req.body;
    const insert = "INSERT into user(auth_id, email, active) VALUES (?, ?, ?)";
    const values = [auth_id, email, true];

    try {
      await client.query<User>(insert, values);

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

export const deleteUser = (req: Request, res: Response) => {
  (async () => {
    const { user_id } = req.body;
    const update = "UPDATE user SET active = ? WHERE id = ?";
    const values = [false, user_id];

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
