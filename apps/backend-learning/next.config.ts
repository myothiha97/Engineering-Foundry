import type { NextConfig } from "next";
import path from "node:path";

const workspaceRoot = path.join(process.cwd(), "../..");
const config: NextConfig = {
  transpilePackages: [
    "@platform/ui",
    "@platform/learning-engine",
    "@platform/diagrams",
    "@platform/content-schema",
  ],
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
  poweredByHeader: false,
};
export default config;
