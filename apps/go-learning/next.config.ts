import type { NextConfig } from "next";
import path from "node:path";

const workspaceRoot = path.join(process.cwd(), "../..");
const config: NextConfig = {
  transpilePackages: [
    "@platform/ui",
    "@platform/learning-engine",
    "@platform/diagrams",
    "@platform/code-editor",
    "@platform/content-schema",
    "@platform/curriculum",
  ],
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
  poweredByHeader: false,
};
export default config;
