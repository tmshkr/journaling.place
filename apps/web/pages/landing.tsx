import { useEffect } from "react";
import { prisma } from "src/lib/prisma";
import { useAppSelector, useAppDispatch } from "src/store";
import { currentPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";

import dynamic from "next/dynamic";

const DemoEditor = dynamic(() => import("src/components/landing/DemoEditor"), {
  ssr: false,
});

export default function LandingPage({ prompt }) {
  return <DemoEditor />;
}

export async function getServerSideProps(context) {
  const count = await prisma.prompt.count();
  const [randomPrompt] = await prisma.prompt.findMany({
    take: 1,
    select: { id: true, text: true },
    skip: Math.floor(Math.random() * count),
  });

  return {
    props: {
      prompt: randomPrompt,
    },
  };
}
