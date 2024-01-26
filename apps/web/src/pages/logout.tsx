import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { cryptoStore } from "src/services/localForage";
import { clearKey } from "src/services/crypto";
import { useSession } from "next-auth/react";

export default function Logout() {
  const user = useSession().data?.user;

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
