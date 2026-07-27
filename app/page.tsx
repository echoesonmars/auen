"use client";

// The homepage now leads with the Event Budget Planner (the product), rendered
// in Auen's existing UI. The music-rental hero remains available as a component
// (app/components/HeroSection) if you want to restore or reuse it.
import PlannerPage from "./planner/page";

export default function Home() {
  return <PlannerPage />;
}
