import type { Manifest } from "@we-the-rebel-alliance/plugin-contract/manifest"
import type { HandlerTable } from "@we-the-rebel-alliance/plugin-contract/register"
import type { Options } from "../options.js"
import type { Provider } from "../provider/create.js"
import { doctorHandler } from "./doctor.js"
import { statusHandler } from "./status.js"
import { speakHandler } from "./speak.js"

export interface HandlerInput {
  readonly provider: Provider
  readonly manifest: Manifest
  readonly version: string
  readonly options: Options
  readonly keybind: string
  readonly hostVersion: string
}

/** The one handler table: every method in `capabilities.methods`, by name. */
export function createHandlers(input: HandlerInput): HandlerTable {
  return {
    status: statusHandler(input),
    doctor: doctorHandler(input),
    speak: speakHandler(input),
  }
}
