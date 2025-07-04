import { Request, Response } from "express";
import { instance } from "../utils/postgres";
import { getUserId } from "../utils/functions";

export const addCategory = (req: Request, res: Response) => {
  (async () => {
    const client = instance();
    const { category } = req.body;
    const auth_id = req.auth?.payload.sub;
    const currentDate = new Date(Date.now()).toISOString();
    let user_id: number | undefined;

    try {
      user_id = await getUserId(auth_id, client);

      if (!user_id) {
        return res.status(500).json({
          action: "User doesn't exist",
        });
      }
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id",
      });
    }

    const insert =
      "INSERT into category(user_id, name, modified_at) VALUES ($1, $2, $3)";
    const values = [user_id, category, currentDate];

    try {
      await client.query(insert, values);

      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Create category",
      });
    }
  })();
};

export const getCategory = (req: Request, res: Response) => {
  (async () => {
    const client = instance();
    const auth_id = req.auth?.payload.sub;
    let user_id: number | undefined;

    try {
      user_id = await getUserId(auth_id, client);

      if (!user_id) {
        return res.status(500).json({
          action: "User doesn't exist",
        });
      }
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id",
      });
    }

    try {
      const category = await client.query(
        "SELECT * FROM category WHERE user_id = $1",
        [user_id],
      );

      return res.status(200).json({
        categories: category.rows,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get all categories",
      });
    }
  })();
};

export const deleteCategory = (req: Request, res: Response) => {
  (async () => {
    const client = instance();
    const auth_id = req.auth?.payload.sub;
    const { category_id } = req.body;

    try {
      const user_id = await getUserId(auth_id, client);

      if (!user_id) {
        return res.status(500).json({
          action: "User doesn't exist",
        });
      }
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Get user_id",
      });
    }

    try {
      await client.query("DELETE FROM category WHERE id = $1", [category_id]);

      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Delete category item",
      });
    }
  })();
};
