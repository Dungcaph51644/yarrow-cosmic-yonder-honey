import { createFileRoute } from "@tanstack/react-router";
import { GiftExperience } from "@/components/gift/gift-experience";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GiftExperience />;
}
