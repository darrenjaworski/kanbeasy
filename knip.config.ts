import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["tests-e2e/**/*.spec.ts"],
  ignore: ["src/constants/featureFlags.ts"],
};

export default config;
