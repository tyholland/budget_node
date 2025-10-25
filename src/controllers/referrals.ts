import { Request, Response } from "express";
import { instance } from "../utils/postgres";

export const updateReferralName = (req: Request, res: Response) => {
  (async () => {
    const client = instance();
    const { first_name, last_name, user_id, referral_code } = req.body;
    const auth_id = req.auth?.payload.sub;
    const update =
      "UPDATE referred_by SET first_name = $1, last_name = $2 WHERE user_id = $3 AND referred_by = $4";
    const values = [first_name, last_name, user_id, referral_code];

    try {
      const correctUser = await client.query(
        "SELECT * FROM referrals r, users u WHERE u.auth_id = $1 AND u.id = r.user_id AND r.referral_code = $2",
        [auth_id, referral_code],
      );

      if (correctUser.rowCount) {
        try {
          await client.query(update, values);

          return res.status(200).json({
            success: true,
          });
        } catch (err) {
          return res.status(500).json({
            err,
            action: "Update user with referral sub",
          });
        }
      } else {
        return res.status(404).json({
          action: "You don't have access to update this account",
        });
      }
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Update referral with display name",
      });
    }
  })();
};
