import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import pkg from "../package.json" with { type: "json" }

/** The capabilities manifest from `package.json`; the build inlines only this value and the version. */
export const manifest = pkg.capabilities as unknown as Manifest

/** The installed package's version, from `package.json`. */
export const VERSION: string = pkg.version
