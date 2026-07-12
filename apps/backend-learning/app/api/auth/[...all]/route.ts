import { createAuth } from "@platform/authentication";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(createAuth());
