import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Vitest config scoped to the deterministic planner core (pure TS, no UI).
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["lib/planner/**/*.test.ts"],
  },
});
