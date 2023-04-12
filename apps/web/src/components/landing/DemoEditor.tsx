import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import { setLoading } from "src/store/loading";

import { signIn } from "next-auth/react";

export default function DemoEditor({ dispatch, loading }) {
  const quillRef: any = useRef(null);

  useEffect(() => {
    if (!quillRef.current) {
      quillRef.current = new Quill("#editor", {
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            ["code-block"],
          ],
        },
        placeholder: "Compose an epic...",
        theme: "snow", // or 'bubble'
      });

      dispatch(setLoading({ ...loading, editor: false }));
      typeString(quillRef);
    }
  }, []);

  return (
    <>
      <div id="editor" style={{ fontSize: "15px" }} className="min-h-[60vh]" />
      <div className="text-center my-3">
        <a
          role="button"
          className="btn-primary my-3"
          data-test="sign-in-button"
          href={`/api/auth/signin`}
          onClick={(e) => {
            e.preventDefault();
            signIn();
          }}
        >
          Sign In
        </a>
        <p>
          Sign in to save your journal to the cloud <br />
          with end-to-end encryption.
        </p>
      </div>
    </>
  );
}

async function typeString(quillRef) {
  let str = "";
  for (let i = 0; i < copy.length; i++) {
    str += copy[i];
    quillRef.current.setText(str);
    quillRef.current.formatText(407, 409, "bold", true);
    quillRef.current.formatText(410, copy.length, "bold", false);
    await new Promise((resolve) => setTimeout(resolve, 42));
  }
}

const copy = `Want to start journaling but don't know where to start?

You're in the right place.

Journaling is a healthy habit, but a blank page can be intimidating.

What do you even write about?

That's why journaling.place exists.

Get some help on your journaling journey with a growing library of thoughtful and inspiring prompts, or write freestyle with no prompt.

It all gets encrypted on your device, and only you hold the key, so nobody else can read your journal.

Sign in now to get started!`;
