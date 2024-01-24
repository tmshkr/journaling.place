import { router } from "..";
import { updatePassword } from "./updatePassword";
import { setSalt } from "./setSalt";
import { updateNotifications } from "./updateNotifications";

export const userRouter = router({
  updatePassword,
  setSalt,
  updateNotifications,
});
