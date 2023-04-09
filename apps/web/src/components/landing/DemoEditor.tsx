import { useEffect, useRef } from "react";
import { setLoading } from "src/store/loading";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

export default function DemoEditor({ dispatch, loading }) {
  const easyMDEref: any = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mdeMounted = document.querySelector(".EasyMDEContainer");
    if (!mdeMounted) {
      easyMDEref.current = new EasyMDE({
        element: document.getElementById("editor") as HTMLElement,
        spellChecker: false,
      });
      easyMDEref.current.codemirror.on(
        "beforeChange",
        (instance, changeObj) => {
          const { cancel, origin } = changeObj;
          if (origin !== "setValue") {
            cancel();
          }
        }
      );
    }
    dispatch(setLoading({ ...loading, editor: false }));
    typeString(easyMDEref);
  }, []);

  return <textarea id="editor" className="hidden"></textarea>;
}

async function typeString(easyMDEref) {
  let str = "";
  for (const char of copy) {
    str += char;
    easyMDEref.current.value(str);
    await new Promise((resolve) => setTimeout(resolve, 42));
  }
}

const copy = `Want to start journaling but don't know where to start?

You're in the right place.

Journaling is a healthy habit, but a blank page can be intimidating.

What do you even write about?

That's why journaling.place exists.

Get some help on your journaling journey with a growing library of thoughtful and inspiring prompts, or write freestyle with no prompt.

It all gets encrypted on your device, and only **you** hold the key, so nobody else can read your journal.

Sign in now to get started!`;
