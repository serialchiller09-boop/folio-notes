import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/notes/home-screen";

export const Route = createFileRoute("/")({ component: HomeScreen });
