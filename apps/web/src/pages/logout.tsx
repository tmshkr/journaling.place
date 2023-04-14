import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { cryptoStore } from "src/lib/localForage";
import { clearKey } from "src/lib/crypto";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";

export default function Logout() {
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (user) {
      cryptoStore.removeItem("key", () => {
        console.log("Removed key");
        clearKey();
        signOut();
        console.log("Signed out");
      });
    }
  }, []);

  return (
    <h1>
      {user
        ? "Logging out..."
        : "You have been logged out. You'll need to re-enter your password to access your data."}
    </h1>
  );
}
