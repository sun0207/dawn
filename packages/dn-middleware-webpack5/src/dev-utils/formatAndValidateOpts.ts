import * as fs from "fs";
import * as path from "path";
import * as Dawn from "@dawnjs/types";
import * as assert from "assert";
import { Env, IGetWebpackConfigOpts, IOpts } from "../types";
import { getExistFile, formatReglikeObject, formatNullStringToList } from "./utils";

// Validate and format input opts
export const formatAndValidateOpts = (opts: Partial<IOpts>, ctx: Dawn.Context) => {
    const options = Object.assign({}, opts);
  
    // cwd
    options.cwd = options.cwd || ctx.cwd;
  
    // env
    const isLegalEnv = (e?: Env) => ["development", "production"].includes(e);
    if (!isLegalEnv(options.env)) {
      let envMessage = "[webpack5] None `env` development|production is configured";
      if (isLegalEnv(process.env?.DN_ENV as Env)) {
        options.env = process.env.DN_ENV as Env;
        envMessage += `, auto set to ${options.env} by using DN_ENV`;
      } else if (isLegalEnv(process.env?.NODE_ENV as Env)) {
        options.env = process.env.NODE_ENV as Env;
        envMessage += `, auto set to ${options.env} by using NODE_ENV`;
      } else {
        // ctx.command == current pipe full-name: init/dev/build/publish/..
        options.env = ctx.command.includes("dev") ? "development" : "production";
        envMessage += `, auto set to \`${options.env}\` by using DN_CMD`;
      }
      ctx.console.warn(envMessage);
    }
  
    // entry
    if (
      !options.entry ||
      (Array.isArray(options.entry) && !options.entry?.length) ||
      (typeof options.entry === "object" && !Object.keys(options.entry)?.length)
    ) {
      options.entry = getExistFile({
        cwd: options.cwd,
        files: ["src/index.tsx", "src/index.ts", "src/index.jsx", "src/index.js"],
        returnRelative: true,
      });
    }
    assert.ok(options.entry, "[webpack5] No `entry` found, checkout guide for usage details.");
    options.entry = formatReglikeObject(options.entry as any);
  
    // useTypeScript judge by entry file ext
    ctx.useTypeScript = options.entry?.some?.(({ file }) => file.endsWith(".ts") || file.endsWith(".tsx"));
    assert.ok(
      // if entry is dot ts(x), but not found tsconfig.json, exist
      !(ctx.useTypeScript && !fs.existsSync(path.join(ctx.cwd, "tsconfig.json"))),
      "[webpack5] Your entry is typescript but missing tsconfig.json file.",
    );
  
    // template
    if (
      !options.template ||
      (Array.isArray(options.template) && !options.template?.length) ||
      (typeof options.template === "object" && !Object.keys(options.template)?.length)
    ) {
      options.template = getExistFile({
        cwd: options.cwd,
        // `src/assets/index.html` is not recommanded and will be removed soon
        files: ["public/index.html", "src/assets/index.html"],
        returnRelative: true,
      });
    }
    assert.ok(options.template, "[webpack5] No `template` found, checkout guide for usage details.");
    options.template = formatReglikeObject(options.template as any);
  
    // injectCss
    // default: only inject when dev, not inject when build
    ctx.injectCSS = options.injectCSS === undefined ? options.env === "development" : !!options.injectCSS;
  
    // devtool/sourceMap
    options.devtool = options.devtool ?? options.sourceMap;

    // inject & append
    options.inject = formatNullStringToList(options.inject);
    options.append = formatNullStringToList(options.append);
  
    // output
    options.output = options.output ?? "./build";
    if (typeof options.output === "string") {
      options.output = { path: options.output };
    }
  
    // performance
    // default is false
    // true means warning
    options.performance = options.performance === true ? "warning" : options.performance ?? false;
    (options as IGetWebpackConfigOpts).performanceConfig = { hints: options.performance };
  
    // target
    // browser means web
    // default is web
    options.target = options.target === "browser" ? "web" : options.target ?? "web";
  
    // alias
    if (ctx.useTypeScript && options.alias) {
      ctx.console.warn("[webpack5] `alias` is not recommanded in ts project, please use paths in tsconfig.json");
    }

    // profiling
    // TODO: change default to true?
    options.profiling = options.profiling ?? false;

    // cssLoader 
    options.cssLoader = options.cssLoader ?? {};
    if (options.cssModules) {
      options.cssLoader = {
        modules: opts.cssModules,
        camelCase: opts.cssModules //只要启用就采用「小驼峰」
      };
    }
    // tscCompileOnError
    // default is true
    // If `true`, errors in TypeScript type checking will not prevent start script from running app,
    // and will not cause build script to exit unsuccessfully.
    // Also downgrades all TypeScript type checking error messages to warning messages.
    options.tscCompileOnError = options.tscCompileOnError ?? true;
  
    return options as IOpts;
  };
  
  export default formatAndValidateOpts;
  