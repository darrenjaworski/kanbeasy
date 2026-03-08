import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["tests-e2e/**/*.spec.ts"],
  ignore: [],
  ignoreBinaries: ["open"],
};

export default config;
