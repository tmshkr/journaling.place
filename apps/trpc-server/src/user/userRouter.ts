import { router } from "..";
import { updatePassword } from "./updatePassword";
import { setSalt } from "./setSalt";

export const userRouter = router({ updatePassword, setSalt });
