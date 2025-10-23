/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as http from "../http.js";
import type * as memes from "../memes.js";
import type * as migrations from "../migrations.js";
import type * as reports from "../reports.js";
import type * as roles from "../roles.js";
import type * as router from "../router.js";
import type * as usernameGenerator from "../usernameGenerator.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  comments: typeof comments;
  http: typeof http;
  memes: typeof memes;
  migrations: typeof migrations;
  reports: typeof reports;
  roles: typeof roles;
  router: typeof router;
  usernameGenerator: typeof usernameGenerator;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
