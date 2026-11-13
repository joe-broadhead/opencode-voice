var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/constants.ts
var PLUGIN_ID, TUI_ID, COMMAND_STEM, ENGINE_RPC_ID, SUPPORTED_HOST, DEFAULT_KEYBIND_MAC, DEFAULT_KEYBIND_OTHER, errorText, NEXT_STEPS;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    PLUGIN_ID = "voice.dictation";
    TUI_ID = "voice.dictation.tui";
    COMMAND_STEM = "voice";
    ENGINE_RPC_ID = `${PLUGIN_ID}.engine`;
    SUPPORTED_HOST = ">=2.2.3 <2.3.0";
    DEFAULT_KEYBIND_MAC = "ctrl+shift+space";
    DEFAULT_KEYBIND_OTHER = "ctrl+space";
    errorText = (code, message, nextStep) => `${code}: ${message} Next step: ${nextStep}`;
    NEXT_STEPS = {
      ENGINE_MISSING: "Run /voice-install to download the pinned speech engine, then run /voice-status.",
      ENGINE_UNVERIFIED: "Run /voice-install to replace the engine; if it persists, report it.",
      ENGINE_INCOMPATIBLE: "Install the Aurum version that /voice-status names.",
      UNSUPPORTED_PLATFORM: "Use macOS on Apple silicon or Linux, or set the aurumPath option to a local engine.",
      MODEL_MISSING: "Run /voice-install to download the speech model.",
      MODEL_DOWNLOAD_FAILED: "Retry /voice-install; if it persists, check the network or proxy.",
      INTEGRITY_MISMATCH: "Retry /voice-install; if it persists, report it.",
      MIC_DENIED: "Grant microphone access in System Settings \u2192 Privacy & Security \u2192 Microphone.",
      MIC_UNAVAILABLE: "Connect a microphone, then run /voice-dictate again.",
      AUDIO_DEVICE_MISSING: "Connect an output device, then try again.",
      NO_SPEECH: "Speak again, a little closer to the microphone.",
      AUDIO_TOO_LONG: "Shorten the recording or the text.",
      BAD_AUDIO: "Send a WAV file, 16 kHz, mono, 16-bit PCM.",
      BUSY: "Wait for the current dictation to finish, or press escape to cancel it.",
      TIMEOUT: "Try again, then run the doctor in /voice.",
      CANCELLED: "Nothing to do.",
      SIDECAR_FAILED: "Run the doctor in /voice, then try again.",
      PROVIDER_AUTH_REQUIRED: "Add the provider key, or choose a local model in /voice.",
      PROVIDER_FAILED: "Try again, or choose a local model in /voice.",
      HOST_UNTESTED: "Use OpenCode >=2.2.3 <2.3.0, or set the allowUntestedHost option to run anyway.",
      OPTIONS_INVALID: "Fix the named option in opencode.json.",
      STATUS_UNAVAILABLE: "Try again, then run the doctor in /voice.",
      SKILLS_INVALID: "Reinstall the plugin from github:joe-broadhead/opencode-voice#v0.0.1.",
      ENGINE_EXITED: "Run the doctor in /voice, then try again.",
      UNSUPPORTED: "Use a supported platform and engine.",
      UNCHECKED: "Call it from a session, where its approval can be answered; never from a script.",
      INPUT_INVALID: "Fix the call's input as the message says, then call it again."
    };
  }
});

// src/redact.ts
function cut(text, limit) {
  const characters = Array.from(text);
  return characters.length > limit ? `${characters.slice(0, limit - 1).join("")}\u2026` : text;
}
function shortReason(text) {
  const reason = oneLine(SECRETS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), withoutUrlSecrets(text))).replace(/[.\s]+$/, "");
  if (reason === "") return void 0;
  return cut(reason, REASON_LIMIT);
}
var SECRETS, REASON_LIMIT, CONTROLS, BIDI, withoutUrlSecrets, oneLine;
var init_redact = __esm({
  "src/redact.ts"() {
    "use strict";
    SECRETS = [
      [/\b(bearer|basic|token)\s+[\w.~+/=-]{8,}/gi, "$1 [redacted]"],
      [/\b([\w-]*(?:api[_-]?key|access[_-]?key|private[_-]?key|token|secret|password|signature|credential)["']?\s*[:=]\s*)["']?[^\s"'&,;]+["']?/gi, "$1[redacted]"],
      [/\beyJ[\w-]{4,}\.[\w-]{4,}\.[\w-]{4,}/g, "[redacted]"],
      [/\b(?:tvly|sk|pk|rk|ghp|gho|ghu|ghs|ghr|github_pat|glpat|xox[abposr]|lin_api|lin_oauth)[-_][\w-]{8,}/gi, "[redacted]"],
      [/[\w+=-]{40,}/g, "[redacted]"]
    ];
    REASON_LIMIT = 160;
    CONTROLS = /[\u0000-\u001f\u007f-\u009f]+/g;
    BIDI = /[‎‏‪-‮⁦-⁩]/g;
    withoutUrlSecrets = (text) => text.replace(/\bhttps?:\/\/[^\s"'<>]+/gi, (url) => url.replace(/^(https?:\/\/)[^/?#@]*@/i, "$1").replace(/[?#].*$/s, ""));
    oneLine = (text) => text.replace(BIDI, "").replace(CONTROLS, " ").replace(/\s+/g, " ").trim();
  }
});

// src/engine/errors.ts
function asEngineError(error) {
  if (error instanceof EngineError) return error;
  return new EngineError("SIDECAR_FAILED", "The speech engine failed unexpectedly.");
}
function fromSidecarCategory(category, message) {
  const text = shortReason(message) ?? "The speech engine reported an error.";
  switch (category) {
    case "user":
      return new EngineError("BAD_AUDIO", text);
    case "environment":
      return new EngineError("SIDECAR_FAILED", text);
    case "provider":
      return new EngineError("PROVIDER_FAILED", text);
    default:
      return new EngineError("SIDECAR_FAILED", text);
  }
}
var EngineError, isCancel;
var init_errors = __esm({
  "src/engine/errors.ts"() {
    "use strict";
    init_constants();
    init_redact();
    EngineError = class extends Error {
      code;
      next;
      constructor(code, message, next = NEXT_STEPS[code] ?? "Try again.") {
        super(errorText(code, message, next));
        this.name = "EngineError";
        this.code = code;
        this.next = next;
      }
    };
    isCancel = (error) => error instanceof EngineError && error.code === "CANCELLED";
  }
});

// src/native/install.ts
import { createHash, randomUUID } from "node:crypto";
import { constants, createReadStream, createWriteStream } from "node:fs";
import { chmod, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createGunzip } from "node:zlib";
function parseNativeManifest(raw) {
  if (!isRecord(raw)) invalid("is not an object");
  const { schema, plugin, repository, tag: tag2, built, modules } = raw;
  if (schema !== 1) invalid("has an unknown schema");
  if (typeof plugin !== "string" || typeof tag2 !== "string" || typeof repository !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    invalid("names no repository or tag");
  }
  if (!isRecord(built) || typeof built.commit !== "string" || !HEX40.test(built.commit) || !Number.isInteger(built.run) || typeof built.workflow !== "string") {
    invalid("has a bad build record");
  }
  if (!isRecord(modules)) invalid("has no modules");
  const out = {};
  for (const [module, platformsValue] of Object.entries(modules)) {
    if (!isRecord(platformsValue)) invalid(`has a bad module ${module}`);
    const platforms = {};
    out[module] = platforms;
    for (const [key, value] of Object.entries(platformsValue)) {
      if (!isRecord(value) || !isRecord(value.executable)) invalid(`has a bad entry for ${module} ${key}`);
      const asset = value;
      const exe = asset.executable;
      const name = plain(asset.name, `${module} ${key}`);
      const url = asset.url;
      const expected = `https://github.com/${repository}/releases/download/${tag2}/${name}`;
      if (url !== expected) invalid(`names a URL other than the release asset for ${module} ${key}`);
      platforms[key] = {
        name,
        url,
        bytes: positive(asset.bytes, `${module} ${key}`),
        sha256: digest(asset.sha256, `${module} ${key}`),
        executable: {
          name: plain(exe.name, `${module} ${key} executable`),
          bytes: positive(exe.bytes, `${module} ${key} executable`),
          sha256: digest(exe.sha256, `${module} ${key} executable`)
        }
      };
    }
  }
  const build = built;
  return { schema: 1, plugin, repository, tag: tag2, built: { commit: build.commit, run: build.run, workflow: build.workflow }, modules: out };
}
function entryFor(options) {
  const entry = options.manifest.modules[options.module]?.[options.key];
  if (entry === void 0) {
    throw new NativeError(
      "NATIVE_UNSUPPORTED_PLATFORM",
      `the release has no ${options.module} for ${options.key}`,
      "Set the plugin's binary path option to an executable of the pinned version, or use a supported platform."
    );
  }
  return entry;
}
function cachePath(options) {
  const entry = entryFor(options);
  return join(options.cacheRoot, "native", options.manifest.tag, options.module, options.key, entry.executable.name);
}
async function sha256File(path) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.byteLength;
    hash.update(chunk);
  }
  return { bytes, sha256: hash.digest("hex") };
}
async function verifiedFile(path, expected) {
  try {
    const info = await stat(path);
    if (!info.isFile() || info.size !== expected.bytes) return false;
    return (await sha256File(path)).sha256 === expected.sha256;
  } catch {
    return false;
  }
}
function fail(code, what, options) {
  const next = {
    NATIVE_MANIFEST_MISSING: "Set the plugin's binary path option to an executable of the pinned version, or install a release of the plugin.",
    NATIVE_MANIFEST_INVALID: "Reinstall the plugin from a release whose manifest is valid.",
    NATIVE_UNSUPPORTED_PLATFORM: "Set the plugin's binary path option to an executable of the pinned version, or use a supported platform.",
    NATIVE_NOT_INSTALLED: `Run ${options.installCommand}, which downloads and verifies it.`,
    NATIVE_NETWORK: "Check the network or proxy, then call the tool again.",
    NATIVE_NOT_FOUND: "The release is missing this file. Report it; do not retry.",
    NATIVE_HASH_MISMATCH: "The download was discarded. Call the tool again; if it persists, report that the release does not match its manifest.",
    NATIVE_SIZE_MISMATCH: "Call the tool again; if it persists, report that the release does not match its manifest.",
    NATIVE_STALLED: "Call the tool again.",
    NATIVE_CANCELLED: "Call the tool again if you still need the result.",
    NATIVE_WRITE_FAILED: "Check that the plugin's cache folder is writable, then call the tool again."
  };
  throw new NativeError(code, what, next[code]);
}
async function installNative(options) {
  const entry = entryFor(options);
  const target = cachePath(options);
  if (await verifiedFile(target, { bytes: entry.executable.bytes, sha256: entry.executable.sha256 })) return { path: target, downloaded: false };
  if (options.signal?.aborted) fail("NATIVE_CANCELLED", `the download of ${entry.name} was cancelled before it started`, options);
  const dir = dirname(target);
  try {
    await mkdir(dir, { recursive: true, mode: 448 });
  } catch {
    fail("NATIVE_WRITE_FAILED", `the cache folder ${dir} cannot be created`, options);
  }
  const id = randomUUID();
  const asset = `${target}.${id}.gz`;
  const exe = `${target}.${id}.part`;
  try {
    await download(options, entry, asset);
    await decompress(options, entry, asset, exe);
    await chmod(exe, 493);
    await rename(exe, target);
    options.log?.(`installed ${entry.name} (${entry.bytes} bytes) for ${options.module}`);
    return { path: target, downloaded: true };
  } finally {
    await rm(asset, { force: true });
    await rm(exe, { force: true });
  }
}
async function download(options, entry, path) {
  const stall = new AbortController();
  const request = options.signal ? AbortSignal.any([options.signal, stall.signal]) : stall.signal;
  const limit = options.stallMs ?? DEFAULT_STALL_MS;
  let watchdog = setTimeout(() => stall.abort(), limit);
  const reset = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => stall.abort(), limit);
  };
  const failure = (error) => {
    if (error instanceof NativeError) throw error;
    if (stall.signal.aborted) fail("NATIVE_STALLED", `the download of ${entry.name} stopped for ${Math.round(limit / 1e3)} seconds`, options);
    if (options.signal?.aborted) fail("NATIVE_CANCELLED", `the download of ${entry.name} was cancelled`, options);
    fail("NATIVE_NETWORK", `the download of ${entry.name} failed (${error.message})`, options);
  };
  let handle;
  try {
    const response = await (options.fetchImpl ?? fetch)(entry.url, { signal: request, redirect: "follow" }).catch(failure);
    if (response.status === 404) fail("NATIVE_NOT_FOUND", `${entry.name} is not in the release`, options);
    if (!response.ok || response.body === null) fail("NATIVE_NETWORK", `the download of ${entry.name} returned HTTP ${response.status}`, options);
    handle = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
    const hash = createHash("sha256");
    let received = 0;
    for await (const chunk of response.body) {
      reset();
      received += chunk.byteLength;
      if (received > entry.bytes) fail("NATIVE_SIZE_MISMATCH", `${entry.name} is larger than its pinned ${entry.bytes} bytes`, options);
      hash.update(chunk);
      await handle.write(chunk);
    }
    if (received !== entry.bytes) fail("NATIVE_SIZE_MISMATCH", `${entry.name} is ${received} bytes, not the pinned ${entry.bytes}`, options);
    if (hash.digest("hex") !== entry.sha256) fail("NATIVE_HASH_MISMATCH", `${entry.name} does not match its pinned sha256, so it was discarded`, options);
    await handle.sync();
  } catch (error) {
    failure(error);
  } finally {
    clearTimeout(watchdog);
    await handle?.close().catch(() => void 0);
  }
}
async function decompress(options, entry, source, target) {
  const write = createWriteStream(target, { flags: "wx", mode: 384 });
  write.on("error", () => void 0);
  const gunzip = createGunzip();
  const hash = createHash("sha256");
  let bytes = 0;
  try {
    for await (const chunk of createReadStream(source).pipe(gunzip)) {
      bytes += chunk.byteLength;
      if (bytes > entry.executable.bytes) fail("NATIVE_HASH_MISMATCH", `the decompressed ${entry.executable.name} is larger than its pinned size`, options);
      hash.update(chunk);
      if (!write.write(chunk)) await new Promise((resolve2) => write.once("drain", () => resolve2()));
    }
  } catch (error) {
    if (error instanceof NativeError) throw error;
    fail("NATIVE_HASH_MISMATCH", `${nameOf(options)} does not decompress, so it was discarded`, options);
  } finally {
    await new Promise((resolve2, reject) => {
      write.once("error", reject);
      write.end(() => {
        resolve2();
      });
    }).catch(() => fail("NATIVE_WRITE_FAILED", `the cache folder ${dirname(target)} cannot be written`, options));
  }
  if (bytes !== entry.executable.bytes || hash.digest("hex") !== entry.executable.sha256) {
    fail("NATIVE_HASH_MISMATCH", `${entry.executable.name} does not match its pinned sha256, so it was discarded`, options);
  }
}
var NativeError, HEX64, HEX40, DEFAULT_STALL_MS, isRecord, invalid, plain, positive, digest, nameOf;
var init_install = __esm({
  "src/native/install.ts"() {
    "use strict";
    NativeError = class extends Error {
      code;
      next;
      constructor(code, what, next) {
        super(`${code}: ${what}`);
        this.name = "NativeError";
        this.code = code;
        this.next = next;
      }
    };
    HEX64 = /^[a-f0-9]{64}$/;
    HEX40 = /^[a-f0-9]{40}$/;
    DEFAULT_STALL_MS = 12e4;
    isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
    invalid = (what) => {
      throw new NativeError("NATIVE_MANIFEST_INVALID", `the release manifest ${what}`, "Reinstall the plugin from a release whose manifest is valid.");
    };
    plain = (value, field) => {
      if (typeof value !== "string" || value === "" || value.includes("/") || value.includes("\\") || value === "." || value === "..") invalid(`has a bad file name in ${field}`);
      return value;
    };
    positive = (value, field) => {
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) invalid(`has a bad size in ${field}`);
      return value;
    };
    digest = (value, field) => {
      if (typeof value !== "string" || !HEX64.test(value)) invalid(`has a bad sha256 in ${field}`);
      return value;
    };
    nameOf = (options) => entryFor(options).name;
  }
});

// src/engine/platform.ts
function platformKey(platform = process.platform, arch = process.arch) {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "linux" && arch === "x64") return "linux-x64-gnu";
  if (platform === "linux" && arch === "arm64") return "linux-arm64-gnu";
  return void 0;
}
var MINIMUM_ENGINE, MODULE, platformLabel;
var init_platform = __esm({
  "src/engine/platform.ts"() {
    "use strict";
    MINIMUM_ENGINE = "0.0.24";
    MODULE = "aurum";
    platformLabel = (platform = process.platform, arch = process.arch) => `${platform}-${arch}`;
  }
});

// src/engine/release.ts
import { createHash as createHash2 } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join as join2 } from "node:path";
function toEngineError(error) {
  if (!(error instanceof NativeError)) return error;
  return new EngineError(CODE_FOR[error.code] ?? "MODEL_DOWNLOAD_FAILED", error.message.replace(/^NATIVE_[A-Z_]+: /, ""), error.next);
}
function digestMatches(path, expected) {
  try {
    return createHash2("sha256").update(readFileSync(path)).digest("hex") === expected;
  } catch {
    return false;
  }
}
function readRelease(packageRoot) {
  let text;
  try {
    text = readFileSync(join2(packageRoot, "manifest", "native.json"), "utf8");
  } catch {
    return void 0;
  }
  try {
    return parseNativeManifest(JSON.parse(text));
  } catch {
    throw new EngineError("ENGINE_MISSING", "The release manifest in this copy of Voice is invalid.", "Reinstall the plugin from a release whose manifest is valid.");
  }
}
function pinnedVersion(packageRoot) {
  try {
    const version = JSON.parse(readFileSync(join2(packageRoot, "manifest", "aurum.json"), "utf8")).version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}
function pinnedEngine(packageRoot, platform = process.platform, arch = process.arch) {
  const manifest = readRelease(packageRoot);
  if (manifest === void 0) {
    throw new EngineError(
      "ENGINE_MISSING",
      "This copy of Voice carries no release manifest, so it has no pinned speech engine.",
      "Set the aurumPath option to an Aurum binary, or install a release of the plugin."
    );
  }
  const key = platformKey(platform, arch);
  const entry = key === void 0 ? void 0 : manifest.modules[MODULE]?.[key];
  if (key === void 0 || entry === void 0) {
    throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${platformLabel(platform, arch)}.`);
  }
  return { manifest, key, entry };
}
function engineOptions(cacheRoot, pinned) {
  return { manifest: pinned.manifest, module: MODULE, key: pinned.key, cacheRoot, installCommand: INSTALL_COMMAND };
}
function cachedEngine(cacheRoot, pinned) {
  const path = cachePath(engineOptions(cacheRoot, pinned));
  if (!existsSync(path)) return void 0;
  const current = statSync(path);
  if (!current.isFile() || current.size !== pinned.entry.executable.bytes || !digestMatches(path, pinned.entry.executable.sha256)) {
    throw new EngineError("ENGINE_UNVERIFIED", "The downloaded speech engine does not match its pinned SHA-256 hash, so it was not run.");
  }
  return path;
}
async function installEngine(input) {
  const pinned = pinnedEngine(input.packageRoot, input.platform, input.arch);
  try {
    const installed = await installNative({
      ...engineOptions(input.cacheRoot, pinned),
      signal: input.signal,
      ...input.fetchImpl === void 0 ? {} : { fetchImpl: input.fetchImpl },
      ...input.log === void 0 ? {} : { log: input.log }
    });
    return {
      path: installed.path,
      asset: { name: pinned.entry.name, bytes: pinned.entry.bytes, sha256: pinned.entry.sha256 },
      downloaded: installed.downloaded
    };
  } catch (error) {
    throw toEngineError(error);
  }
}
var INSTALL_COMMAND, CODE_FOR;
var init_release = __esm({
  "src/engine/release.ts"() {
    "use strict";
    init_install();
    init_errors();
    init_platform();
    INSTALL_COMMAND = "/voice-install";
    CODE_FOR = {
      NATIVE_MANIFEST_MISSING: "ENGINE_MISSING",
      NATIVE_MANIFEST_INVALID: "ENGINE_MISSING",
      NATIVE_UNSUPPORTED_PLATFORM: "UNSUPPORTED_PLATFORM",
      NATIVE_NOT_INSTALLED: "ENGINE_MISSING",
      NATIVE_NETWORK: "MODEL_DOWNLOAD_FAILED",
      NATIVE_NOT_FOUND: "MODEL_DOWNLOAD_FAILED",
      NATIVE_STALLED: "MODEL_DOWNLOAD_FAILED",
      NATIVE_WRITE_FAILED: "MODEL_DOWNLOAD_FAILED",
      NATIVE_HASH_MISMATCH: "INTEGRITY_MISMATCH",
      NATIVE_SIZE_MISMATCH: "INTEGRITY_MISMATCH",
      NATIVE_CANCELLED: "CANCELLED"
    };
  }
});

// src/engine/binary.ts
var binary_exports = {};
__export(binary_exports, {
  MINIMUM_ENGINE: () => MINIMUM_ENGINE,
  digestMatches: () => digestMatches,
  isCompatibleEngine: () => isCompatibleEngine,
  parseEngineVersion: () => parseEngineVersion,
  probeEngine: () => probeEngine,
  resolveEngine: () => resolveEngine
});
import { spawn } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { resolve } from "node:path";
function resolveEngine(input) {
  const platform = input.platform ?? process.platform;
  const arch = input.arch ?? process.arch;
  const env = input.env ?? process.env;
  const label2 = platformLabel(platform, arch);
  const version = pinnedVersion(input.packageRoot);
  const candidate = (path, source, verified) => ({
    path,
    version,
    source,
    verified,
    platform: label2,
    supported: true
  });
  if (input.optionPath !== void 0) {
    const path = resolve(input.optionPath);
    if (!existsSync2(path)) throw new EngineError("ENGINE_MISSING", "The aurumPath option points at a file that does not exist.");
    return candidate(path, "option", false);
  }
  const fromEnv = env.VOICE_AURUM_PATH;
  if (fromEnv !== void 0 && fromEnv !== "") {
    const path = resolve(fromEnv);
    if (!existsSync2(path)) throw new EngineError("ENGINE_MISSING", "VOICE_AURUM_PATH points at a file that does not exist.");
    return candidate(path, "environment", false);
  }
  const key = platformKey(platform, arch);
  if (key === void 0) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no speech engine for ${label2}.`);
  const release = (() => {
    try {
      return readRelease(input.packageRoot);
    } catch (error) {
      throw toEngineError(error);
    }
  })();
  if (release === void 0) {
    throw new EngineError(
      "ENGINE_MISSING",
      "This copy of Voice carries no release manifest, so it has no pinned speech engine.",
      "Set the aurumPath option to an Aurum binary, or install a release of the plugin."
    );
  }
  const entry = release.modules[MODULE]?.[key];
  if (entry === void 0) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${label2}.`);
  if (input.cacheRoot !== void 0) {
    const path = cachedEngine(input.cacheRoot, { manifest: release, key, entry });
    if (path !== void 0) return candidate(path, "download", true);
  }
  throw new EngineError("ENGINE_MISSING", "The pinned speech engine is not installed.");
}
function parseEngineVersion(output) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(output);
  return match === null ? void 0 : `${match[1]}.${match[2]}.${match[3]}`;
}
function isCompatibleEngine(version) {
  if (version === void 0) return false;
  const [major = 0, minor = 0, patch = 0] = parts(version);
  const [minMajor = 0, minMinor = 0, minPatch = 0] = parts(MINIMUM_ENGINE);
  if (major !== minMajor) return major > minMajor;
  if (minor !== minMinor) return minor > minMinor;
  return patch >= minPatch;
}
function probeEngine(bin, env) {
  return new Promise((resolveProbe) => {
    let child;
    try {
      child = spawn(bin, ["--version"], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    } catch {
      resolveProbe({ version: null, compatible: false });
      return;
    }
    let output = "";
    let errors = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
      }, 1e3).unref?.();
      resolveProbe({ version: null, compatible: false });
    }, PROBE_TIMEOUT);
    child.stdout?.on("data", (chunk) => output += chunk.toString("utf8"));
    child.stderr?.on("data", (chunk) => errors += chunk.toString("utf8"));
    child.on("error", () => {
      clearTimeout(timer);
      resolveProbe({ version: null, compatible: false });
    });
    child.on("exit", () => {
      clearTimeout(timer);
      const version = parseEngineVersion(output);
      const missing = /error while loading shared libraries: ([^:\s]+)/.exec(errors)?.[1];
      const older = /version `([A-Z][A-Z0-9_.]*)' not found/.exec(errors)?.[1];
      resolveProbe({
        version: version ?? null,
        compatible: isCompatibleEngine(version),
        ...version === void 0 && missing !== void 0 ? { missingLibrary: missing } : {},
        ...version === void 0 && older !== void 0 ? { olderSystem: older } : {}
      });
    });
  });
}
var parts, PROBE_TIMEOUT;
var init_binary = __esm({
  "src/engine/binary.ts"() {
    "use strict";
    init_errors();
    init_platform();
    init_release();
    parts = (version) => version.split(".").map(Number);
    PROBE_TIMEOUT = 5e3;
  }
});

// src/tui.tsx
init_constants();
import { createComponent as _$createComponent } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { homedir } from "node:os";
import { join as join5 } from "node:path";
import { fileURLToPath } from "node:url";
import { Plugin } from "@opencode/plugin/tui";
import { TextAttributes } from "@opentui/core";
import { createSignal } from "solid-js";

// src/commands.ts
init_constants();
init_errors();
init_release();

// src/status.ts
init_constants();

// src/host-version.ts
init_constants();
var RELEASE = /^(\d+)\.(\d+)\.(\d+)$/;
var parse = (version) => RELEASE.exec(version)?.slice(1).map(Number);
var [LOWEST, ABOVE] = SUPPORTED_HOST.split(" ").map((bound) => parse(bound.replace(/^[<>]=?/, "")));

// src/status.ts
init_redact();
var bytesLabel = (bytes) => bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`;
function formatStatus(status) {
  const engine = status.engine.installed ? `${status.engine.version ?? "unknown version"} (${status.engine.verified ? "verified" : "unverified"})` : "not installed";
  const access = `${status.microphone.permission.replace("_", " ")}${status.microphone.input === null ? "" : ` \xB7 ${oneLine(status.microphone.input)}`}`;
  const models = [status.models.stt, status.models.tts].filter((model) => model !== null).map((model) => `${model.name} \xB7 ${bytesLabel(model.bytes)} \xB7 ${model.state}`).join(" \xB7 ");
  const dictation = [
    status.dictation.submit === "send" ? "Send on pause" : "Review before sending",
    status.dictation.keybind,
    ...status.dictation.lastLatencyMs === null ? [] : [`last ${(status.dictation.lastLatencyMs / 1e3).toFixed(1)} s`]
  ].join(" \xB7 ");
  return [
    `Voice ${status.version}`,
    `Connection: Engine ${engine}`,
    `Account: On-device`,
    `Access: Microphone ${access}`,
    `Models: ${models === "" ? "none" : models}`,
    `Dictation: ${dictation}`,
    `Tools: ${status.tools.registered} registered \xB7 ${status.tools.readable} readable`,
    `Agents without default rules: ${status.unguardedAgents.length === 0 ? "none" : status.unguardedAgents.map((agent) => oneLine(agent)).join(", ")}`,
    `OpenCode: ${status.host.version ?? "unknown"} (${status.host.tested ? "tested" : "untested"})`,
    `Next step: ${status.nextStep}`
  ].join("\n");
}

// src/commands.ts
async function installRequest(target) {
  const pinned = pinnedEngine(target.packageRoot, target.platform, target.arch);
  const engineMissing = (() => {
    try {
      return cachedEngine(target.cacheRoot, pinned) === void 0;
    } catch {
      return true;
    }
  })();
  const missing = await target.store.missing();
  return {
    files: [...engineMissing ? [pinned.entry.name] : [], ...missing.map((item) => item.file)],
    bytes: (engineMissing ? pinned.entry.bytes : 0) + missing.reduce((total, item) => total + item.bytes, 0),
    hosts: [.../* @__PURE__ */ new Set([...engineMissing ? [new URL(pinned.entry.url).host] : [], ...missing.map((item) => new URL(item.url).host)])],
    engine: engineMissing
  };
}
async function installModels(store, signal, ask = async () => void 0) {
  const missing = await store.missing();
  if (missing.length === 0) return { downloaded: [], bytes: 0 };
  await ask();
  return store.withInstallLock(signal, async () => {
    const downloaded = [];
    let bytes = 0;
    for (const asset of missing) {
      if (signal.aborted) break;
      await store.download(asset, signal);
      if (!await store.verify(asset)) {
        throw new EngineError("INTEGRITY_MISMATCH", `The downloaded ${asset.file} did not verify after it was written.`);
      }
      downloaded.push(asset.file);
      bytes += asset.bytes;
    }
    return { downloaded, bytes };
  });
}
async function installAll(target, signal, ask) {
  const request = await installRequest(target);
  if (request.files.length === 0) return { downloaded: [], bytes: 0 };
  await ask(request);
  let bytes = 0;
  const downloaded = [];
  if (request.engine) {
    const installed = await installEngine({
      packageRoot: target.packageRoot,
      cacheRoot: target.cacheRoot,
      ...target.platform === void 0 ? {} : { platform: target.platform },
      ...target.arch === void 0 ? {} : { arch: target.arch },
      signal
    });
    downloaded.push(installed.asset.name);
    bytes += installed.asset.bytes;
  }
  const models = await installModels(target.store, signal);
  downloaded.push(...models.downloaded);
  bytes += models.bytes;
  return { downloaded, bytes };
}

// src/engine/endpoint.ts
var DEFAULT_ENDPOINT = {
  frameMs: 20,
  endpointSilenceMs: 700,
  thinkingPauseMs: 1200,
  shortUtteranceMs: 2e3,
  noSpeechTimeoutMs: 8e3,
  floorFall: 0.5,
  // About a 1 s time constant at 20 ms frames.
  floorRise: 0.02,
  speechMarginDb: 10,
  minThresholdDbfs: -45,
  maxThresholdDbfs: -30,
  minSpeechMs: 160,
  resumeSpeechMs: 60,
  pauseMs: 400
};
var FLOOR_MIN_DBFS = -100;
var Endpointer = class {
  options;
  floor;
  threshold;
  elapsedMs = 0;
  voicedRunMs = 0;
  speechStartMs;
  lastVoicedMs = 0;
  silenceMs = 0;
  current = "listening";
  loudest = -Infinity;
  constructor(options = {}) {
    const { initialFloorDbfs, ...rest } = options;
    this.options = { ...DEFAULT_ENDPOINT, ...rest };
    this.floor = this.options.maxThresholdDbfs - this.options.speechMarginDb;
    this.threshold = this.options.maxThresholdDbfs;
    if (initialFloorDbfs !== void 0 && Number.isFinite(initialFloorDbfs)) {
      this.floor = Math.max(FLOOR_MIN_DBFS, initialFloorDbfs);
      this.threshold = this.thresholdFor(this.floor);
    }
  }
  get state() {
    return this.current;
  }
  get noiseFloorDbfs() {
    return this.floor;
  }
  get thresholdDbfs() {
    return this.threshold;
  }
  get loudestDbfs() {
    return this.loudest;
  }
  thresholdFor(floor) {
    return Math.min(this.options.maxThresholdDbfs, Math.max(this.options.minThresholdDbfs, floor + this.options.speechMarginDb));
  }
  /** Feeds one frame and returns the state after it. A finished turn ignores every later frame. */
  push(levelDbfs) {
    if (this.current === "end" || this.current === "no-speech") return this.current;
    const options = this.options;
    this.elapsedMs += options.frameMs;
    this.loudest = Math.max(this.loudest, levelDbfs);
    const voiced = levelDbfs > this.threshold;
    if (!voiced) {
      this.floor = Math.max(FLOOR_MIN_DBFS, this.floor + (levelDbfs - this.floor) * (levelDbfs < this.floor ? options.floorFall : options.floorRise));
      this.threshold = this.thresholdFor(this.floor);
    }
    if (voiced) {
      this.voicedRunMs += options.frameMs;
      this.silenceMs = 0;
      this.lastVoicedMs = this.elapsedMs;
      if (this.current !== "speech") {
        if (this.voicedRunMs >= options.minSpeechMs) {
          this.current = "speech";
          this.speechStartMs ??= this.elapsedMs - this.voicedRunMs;
        }
      }
      return this.current;
    }
    this.voicedRunMs = 0;
    if (this.current !== "speech" && this.current !== "pause") {
      if (this.elapsedMs >= options.noSpeechTimeoutMs) this.current = "no-speech";
      return this.current;
    }
    this.silenceMs += options.frameMs;
    const spokenMs = this.speechStartMs === void 0 ? 0 : this.lastVoicedMs - this.speechStartMs;
    const hangover = spokenMs >= options.shortUtteranceMs ? options.endpointSilenceMs : options.thinkingPauseMs;
    if (this.silenceMs >= hangover) {
      this.current = "end";
    } else if (this.silenceMs >= options.pauseMs) {
      this.current = "pause";
    }
    return this.current;
  }
  /** A key press ends the turn at once, whatever the silence has said. */
  finish() {
    if (this.current === "speech" || this.current === "pause") this.current = "end";
    return this.current;
  }
  /** The silence before the end, for a status line: how much of the hangover has passed. */
  get pauseMs() {
    return this.silenceMs;
  }
};

// src/dictation/flow.ts
init_errors();

// src/dictation/state.ts
function label(phase) {
  switch (phase) {
    case "preparing":
      return "preparing";
    case "listening":
      return "listening";
    case "transcribing":
      return "transcribing";
    case "sending":
      return "sending";
    case "reviewing":
      return "review";
    case "playing":
      return "speaking";
    case "failed":
      return "failed";
    default:
      return "idle";
  }
}

// src/dictation/flow.ts
var DictationFlow = class {
  phase = "idle";
  abort;
  recorder;
  generation = 0;
  finishing = false;
  host;
  constructor(host) {
    this.host = host;
  }
  get state() {
    return this.phase;
  }
  get active() {
    return this.phase === "preparing" || this.phase === "listening" || this.phase === "transcribing" || this.phase === "sending" || this.phase === "reviewing";
  }
  set(phase, text) {
    this.phase = phase;
    this.host.status(phase, text);
  }
  cancelled(generation) {
    return generation !== this.generation || this.abort?.signal.aborted === true;
  }
  fail(error) {
    if (isCancel(error)) {
      this.set("idle");
      return;
    }
    const failure = asEngineError(error);
    this.set("failed");
    this.host.toast(failure.message, "error");
  }
  /** Starts listening. A second call while active ends the turn, like a second press. */
  async start() {
    if (this.active) {
      await this.finish();
      return;
    }
    if (this.phase === "playing") this.host.engine.stopPlayback();
    const generation = ++this.generation;
    const abort = new AbortController();
    this.abort = abort;
    this.finishing = false;
    this.set("preparing");
    let created;
    try {
      created = await this.host.engine.recorder(abort.signal);
    } catch (error) {
      if (!this.cancelled(generation)) this.fail(error);
      else this.set("idle");
      return;
    }
    if (created === void 0) return;
    if (this.cancelled(generation)) {
      await this.host.engine.release(created.path);
      this.set("idle");
      return;
    }
    this.recorder = created;
    const endpointer = new Endpointer();
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      void this.finish();
    };
    this.set("listening");
    this.host.toast("Listening", "info");
    created.recorder.start({
      onLevel: (dbfs) => {
        if (ended || this.cancelled(generation)) return;
        const state = endpointer.push(dbfs);
        if (state === "pause") this.host.status("listening", "pause");
        if (state === "end") end();
        if (state === "no-speech") {
          ended = true;
          created.recorder.cancel();
          this.set("idle");
          this.host.toast("No speech heard", "warning");
          void this.host.engine.release(created.path);
        }
      },
      onExit: (error) => {
        if (ended || this.cancelled(generation)) return;
        ended = true;
        if (error !== void 0) {
          this.fail(error);
          void this.host.engine.release(created.path);
          return;
        }
        void this.finish();
      }
    });
  }
  /** Ends the recording now and transcribes what was said. A cancel during any await stops the turn. */
  async finish() {
    if (this.finishing || this.recorder === void 0) return;
    this.finishing = true;
    const generation = this.generation;
    const current = this.recorder;
    this.recorder = void 0;
    this.set("transcribing");
    let path = current.path;
    try {
      const recording = await current.recorder.stop();
      path = recording.path;
      if (this.cancelled(generation)) return;
      const transcript = await this.host.engine.transcribeFile(recording.path);
      if (this.cancelled(generation)) return;
      if (transcript.silent || transcript.text.trim() === "") {
        this.set("idle");
        this.host.toast("No speech recognized", "warning");
        return;
      }
      const text = transcript.text.trim();
      this.host.record(text);
      const sessionID = this.host.activeSession();
      if (sessionID === void 0) {
        this.set("idle");
        this.host.toast("Open a session to send the transcript", "warning");
        return;
      }
      if (this.host.submitMode() === "review") {
        this.set("reviewing");
        const edited = await this.host.review(text);
        if (this.cancelled(generation) || edited === void 0 || edited.trim() === "") {
          this.set("idle");
          return;
        }
        this.set("sending");
        await this.host.submit(sessionID, edited.trim());
      } else {
        this.set("sending");
        await this.host.submit(sessionID, text);
      }
      if (this.cancelled(generation)) return;
      this.set("idle");
      this.host.toast("Sent", "success");
    } catch (error) {
      if (!this.cancelled(generation)) this.fail(error);
      else this.set("idle");
    } finally {
      if (path !== void 0 && path !== "") await this.host.engine.release(path).catch(() => void 0);
      this.finishing = false;
    }
  }
  /** Cancels at any phase: no recorder starts, nothing is transcribed or sent, and every temp path is released. */
  cancel() {
    if (!this.active && this.phase !== "playing") return;
    this.generation += 1;
    this.abort?.abort();
    this.recorder?.recorder.cancel();
    const path = this.recorder?.path;
    this.recorder = void 0;
    this.host.engine.cancel();
    if (path !== void 0) void this.host.engine.release(path);
    this.set("idle");
    this.host.toast("Cancelled", "info");
  }
  /** Reads text aloud. `markdown` reduces a reply to speakable text first. */
  async speak(text, options = {}) {
    if (this.active) {
      this.host.toast("Finish the dictation first", "warning");
      return;
    }
    if (this.phase === "playing") {
      this.host.toast("A reply is already playing", "warning");
      return;
    }
    this.set("playing");
    try {
      const speech = await this.host.engine.synthesize(text, {
        ...options.markdown === true ? { markdown: true } : {},
        ...options.rate === void 0 ? {} : { rate: options.rate }
      });
      try {
        await this.host.engine.play(speech.path, { ...options.signal === void 0 ? {} : { signal: options.signal }, ...options.rate === void 0 ? {} : { rate: options.rate } });
      } finally {
        await this.host.engine.release(speech.path);
      }
      this.set("idle");
    } catch (error) {
      if (isCancel(error)) this.set("idle");
      else this.fail(error);
    }
  }
  /** Stops playback and returns to idle. */
  stop() {
    if (this.phase === "playing") {
      this.host.engine.stopPlayback();
      this.set("idle");
      return;
    }
    this.cancel();
  }
  /** The status line's text for the current phase. */
  statusText() {
    return this.phase === "idle" ? void 0 : label(this.phase);
  }
};

// src/dictation/history.ts
var HISTORY_LIMIT = 20;
var TranscriptHistory = class {
  store;
  constructor(store) {
    this.store = store;
  }
  list() {
    return this.store.read();
  }
  count() {
    return this.store.read().length;
  }
  /** Adds one transcript at the front, dropping the oldest past the cap. */
  add(text, at = Date.now()) {
    const value = text.trim();
    if (value === "") return Promise.resolve();
    const entries = [{ text: value, at }, ...this.store.read()].slice(0, HISTORY_LIMIT);
    return this.store.write(entries);
  }
  clear() {
    return this.store.write([]);
  }
};

// src/engine/assets.ts
init_errors();
import { createHash as createHash3, randomUUID as randomUUID2 } from "node:crypto";
import { constants as constants2 } from "node:fs";
import { open as open2, mkdir as mkdir2, rename as rename2, rm as rm2, stat as stat2, unlink } from "node:fs/promises";
import { dirname as dirname2, join as join3 } from "node:path";
var ROLES = ["stt", "tts-model", "tts-voices", "tts-config"];
var HASH = /^[a-f0-9]{64}$/;
var STALL_MS = 6e4;
var LOCK_WAIT_MS = 3e4;
var LOCK_STALE_MS = 10 * 6e4;
var REDIRECTS = 3;
var allowedRedirect = (pinned, next) => next.host === pinned || pinned === "huggingface.co" && (next.host.endsWith(".hf.co") || next.host === "hf.co");
var isRecord2 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function parseManifest(raw) {
  if (!isRecord2(raw) || typeof raw.version !== "string" || !Array.isArray(raw.models)) {
    throw new EngineError("MODEL_MISSING", "The model manifest is malformed.");
  }
  const models = raw.models.map((entry) => {
    if (!isRecord2(entry)) throw new EngineError("MODEL_MISSING", "The model manifest is malformed.");
    const { role, name, file, url, sha256, bytes, licence, revision, group } = entry;
    if (typeof role !== "string" || !ROLES.includes(role) || typeof name !== "string" || typeof file !== "string" || typeof url !== "string" || !url.startsWith("https://") || typeof sha256 !== "string" || !HASH.test(sha256) || typeof bytes !== "number" || !Number.isInteger(bytes) || bytes <= 0 || typeof licence !== "string" || typeof revision !== "string" || group !== void 0 && typeof group !== "string") {
      throw new EngineError("MODEL_MISSING", "The model manifest has an entry the plugin cannot use.");
    }
    if ((role === "tts-model" || role === "tts-voices" || role === "tts-config") && typeof group !== "string") {
      throw new EngineError("MODEL_MISSING", "A TTS model entry has no group directory.");
    }
    return { role, name, file, url, sha256, bytes, licence, revision, ...group === void 0 ? {} : { group } };
  });
  if (new Set(models.map((model) => model.role)).size !== models.length) {
    throw new EngineError("MODEL_MISSING", "The model manifest names a role twice.");
  }
  return { version: raw.version, models };
}
function sha256File2(path) {
  return stat2(path).then(async (info) => {
    if (!info.isFile()) throw new EngineError("MODEL_MISSING", "A speech model is not a regular file.");
    const { readFile: readFile3 } = await import("node:fs/promises");
    return createHash3("sha256").update(await readFile3(path)).digest("hex");
  });
}
var ModelStore = class {
  cached;
  input;
  constructor(input) {
    this.input = input;
  }
  get cacheRoot() {
    return this.input.cacheRoot;
  }
  async manifest() {
    if (this.cached !== void 0) return this.cached;
    const { readFile: readFile3 } = await import("node:fs/promises");
    let raw;
    try {
      raw = JSON.parse(await readFile3(this.input.manifestPath, "utf8"));
    } catch {
      throw new EngineError("MODEL_MISSING", "The model manifest is missing from the package.");
    }
    this.cached = parseManifest(raw);
    return this.cached;
  }
  /**
   * The Aurum-compatible engine cache root: `<cache>/engine`, with `models/` and `tts/` below it. It is passed to the
   * engine as `--cache-dir`, so the file the plugin downloads is the file the engine reads.
   */
  get engineRoot() {
    return join3(this.input.cacheRoot, "engine");
  }
  /** Where a pinned asset lives: the pre-seeded folder when configured, else the engine's own cache layout. */
  pathOf(asset) {
    if (this.input.assetsDir !== void 0) return join3(this.input.assetsDir, asset.file);
    if (asset.role === "stt") return join3(this.engineRoot, "models", asset.file);
    return join3(this.engineRoot, "tts", asset.group ?? "custom", asset.file);
  }
  /** Each asset, its path and whether a file of the pinned size is there. Status never hashes a model. */
  async inspect() {
    const manifest = await this.manifest();
    return Promise.all(
      manifest.models.map(async (asset) => {
        const path = this.pathOf(asset);
        const state = await stat2(path).then((info) => info.isFile() && info.size === asset.bytes ? this.input.assetsDir !== void 0 ? "pre-seeded" : "cached" : "missing").catch(() => "missing");
        return { ...asset, path, state };
      })
    );
  }
  /** The missing assets, by role, for the install action. */
  async missing() {
    return (await this.inspect()).filter((asset) => asset.state === "missing");
  }
  /** True when the model's role is present at the pinned size. */
  async ready(role) {
    const found = (await this.inspect()).find((asset) => asset.role === role);
    return found !== void 0 && found.state !== "missing";
  }
  /**
   * Downloads one missing asset: bytes to a private temporary file in the same directory, never above the pinned size,
   * a SHA-256 check, then a rename. A pre-seeded install never downloads.
   */
  async download(asset, signal) {
    if (this.input.assetsDir !== void 0) {
      throw new EngineError(
        "MODEL_MISSING",
        `The model ${asset.file} is missing from assetsDir, or does not match its pinned size.`
      );
    }
    const target = this.pathOf(asset);
    await mkdir2(dirname2(target), { recursive: true, mode: 448 });
    const temp = join3(dirname2(target), `.download-${randomUUID2()}`);
    const stall = new AbortController();
    const request = AbortSignal.any([signal, stall.signal]);
    let watchdog = setTimeout(() => stall.abort(), STALL_MS);
    const handle = await open2(temp, constants2.O_WRONLY | constants2.O_CREAT | constants2.O_EXCL | constants2.O_NOFOLLOW, 384);
    let renamed = false;
    try {
      const response = await this.fetchPinned(asset, request);
      if (!response.ok || response.body === null) {
        throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} failed with HTTP status ${response.status}.`);
      }
      const hash = createHash3("sha256");
      let received = 0;
      for await (const chunk of response.body) {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => stall.abort(), STALL_MS);
        received += chunk.byteLength;
        if (received > asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", `The download of ${asset.file} is larger than its pinned size.`);
        hash.update(chunk);
        await handle.write(chunk);
      }
      if (received !== asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", `The download of ${asset.file} has the wrong size.`);
      if (hash.digest("hex") !== asset.sha256) {
        throw new EngineError("INTEGRITY_MISMATCH", `The downloaded ${asset.file} does not match its pinned SHA-256 hash, so it was discarded.`);
      }
      await handle.sync();
      await handle.close();
      if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.");
      await rename2(temp, target);
      renamed = true;
      return { ...asset, path: target, state: "cached" };
    } catch (error) {
      if (error instanceof EngineError) throw error;
      if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.");
      throw new EngineError("MODEL_DOWNLOAD_FAILED", stall.signal.aborted ? `Downloading ${asset.file} stalled.` : `Downloading ${asset.file} was interrupted.`);
    } finally {
      clearTimeout(watchdog);
      await handle.close().catch(() => void 0);
      if (!renamed) await rm2(temp, { force: true });
    }
  }
  /**
   * Follows at most three redirects, each to `https` on the asset's pinned host. A redirect elsewhere is refused: the
   * manifest names the host, and the SHA-256 alone is not a reason to fetch from anywhere.
   */
  async fetchPinned(asset, signal) {
    const pinned = new URL(asset.url);
    let url = pinned;
    for (let hop = 0; hop <= REDIRECTS; hop += 1) {
      const response = await (this.input.fetchImpl ?? fetch)(url, { signal, redirect: "manual" });
      if (![301, 302, 303, 307, 308].includes(response.status)) return response;
      const location = response.headers.get("location");
      if (location === null) throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} was redirected without a location.`);
      const next = new URL(location, url);
      if (next.protocol !== "https:" || !allowedRedirect(pinned.host, next)) {
        throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} was redirected away from ${pinned.host}, so it was refused.`);
      }
      url = next;
    }
    throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} was redirected too many times.`);
  }
  /** One install at a time across processes: a lock file in the cache root, stale after ten minutes. */
  async withInstallLock(signal, work) {
    await mkdir2(this.input.cacheRoot, { recursive: true, mode: 448 });
    const path = join3(this.input.cacheRoot, ".install.lock");
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (; ; ) {
      try {
        const handle = await open2(path, constants2.O_WRONLY | constants2.O_CREAT | constants2.O_EXCL | constants2.O_NOFOLLOW, 384);
        await handle.write(`${process.pid}
`);
        await handle.close();
        break;
      } catch (error) {
        const code = error.code;
        if (code !== "EEXIST") throw error;
        const info = await stat2(path).catch(() => void 0);
        if (info === void 0) continue;
        if (Date.now() - info.mtimeMs > LOCK_STALE_MS) {
          await unlink(path).catch(() => void 0);
          continue;
        }
        if (Date.now() > deadline) throw new EngineError("MODEL_DOWNLOAD_FAILED", "Another install is still running; try again when it finishes.");
        if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.");
        await new Promise((resolve2) => setTimeout(resolve2, 100));
      }
    }
    try {
      return await work();
    } finally {
      await unlink(path).catch(() => void 0);
    }
  }
  /** Fully verifies a model before the engine reads it; used after a download, on first use and by the doctor. */
  async verify(asset) {
    const path = this.pathOf(asset);
    const info = await stat2(path).catch(() => void 0);
    if (info === void 0 || !info.isFile() || info.size !== asset.bytes) return false;
    return await sha256File2(path) === asset.sha256;
  }
  /** Verifies every asset of these roles, and refuses with INTEGRITY_MISMATCH when one does not match. */
  async verifyRoles(roles) {
    const manifest = await this.manifest();
    for (const asset of manifest.models.filter((model) => roles.includes(model.role))) {
      if (!await this.verify(asset)) {
        throw new EngineError("INTEGRITY_MISMATCH", `The model ${asset.file} does not match its pinned SHA-256 hash, so it was not used.`);
      }
    }
  }
};
function defaultCacheRoot(home, platform = process.platform, env = process.env) {
  if (platform === "darwin") return join3(home, "Library", "Caches", "opencode-voice");
  return join3(env.XDG_CACHE_HOME ?? join3(home, ".cache"), "opencode-voice");
}

// src/tui.tsx
init_binary();

// src/engine/doctor.ts
init_errors();
import { spawn as spawn2 } from "node:child_process";
var TIMEOUT_MS = 2e4;
var KILL_MS = 1e3;
var isRecord3 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function runDoctor(bin, options = {}) {
  return new Promise((resolve2, reject) => {
    let child;
    const args = ["doctor", "--json", ...options.cacheDir === void 0 ? [] : ["--cache-dir", options.cacheDir]];
    try {
      child = spawn2(bin, args, { env: { ...process.env, ...options.env }, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`));
      return;
    }
    let stdout = "";
    let stderr = "";
    const kill = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, TIMEOUT_MS + KILL_MS);
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
      }, KILL_MS).unref?.();
      reject(new EngineError("TIMEOUT", "The speech engine's doctor did not finish in time."));
    }, TIMEOUT_MS);
    child.stdout?.on("data", (chunk) => stdout += chunk.toString("utf8"));
    child.stderr?.on("data", (chunk) => stderr += chunk.toString("utf8"));
    child.on("error", (error) => {
      clearTimeout(timer);
      clearTimeout(kill);
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${error.message}`));
    });
    child.on("exit", () => {
      clearTimeout(timer);
      clearTimeout(kill);
      const parsed = parseDoctor(stdout);
      if (parsed === void 0) {
        reject(new EngineError("SIDECAR_FAILED", stderr.trim() === "" ? "The speech engine's doctor returned no checks." : "The speech engine's doctor failed."));
        return;
      }
      resolve2(parsed);
    });
  });
}
function parseDoctor(stdout) {
  let value;
  try {
    value = JSON.parse(stdout);
  } catch {
    return void 0;
  }
  const list = Array.isArray(value) ? value : isRecord3(value) && Array.isArray(value.checks) ? value.checks : void 0;
  if (list === void 0) return void 0;
  const checks = list.flatMap((entry) => {
    if (!isRecord3(entry) || typeof entry.id !== "string" || typeof entry.ok !== "boolean") return [];
    const detail = typeof entry.summary === "string" ? entry.summary : typeof entry.detail === "string" ? entry.detail : "";
    const next = typeof entry.hint === "string" ? entry.hint : typeof entry.next === "string" ? entry.next : void 0;
    return [{ id: entry.id, ok: entry.ok, detail, ...next === void 0 ? {} : { next } }];
  });
  if (isRecord3(value) && isRecord3(value.microphone)) {
    const mic = value.microphone;
    const available = mic.available === true;
    const name = typeof mic.name === "string" ? mic.name : "";
    checks.push({
      id: "microphone",
      ok: available,
      detail: available ? name === "" ? "available" : name : typeof mic.reason === "string" ? mic.reason : "unavailable",
      ...available ? {} : { next: "Grant microphone access in System Settings \u2192 Privacy & Security \u2192 Microphone." }
    });
    if (available && name !== "") checks.push({ id: "input", ok: true, detail: name });
  }
  if (isRecord3(value) && isRecord3(value.models)) {
    const stt = typeof value.models.stt === "string" ? value.models.stt : "the STT model";
    if (value.models.stt_cached === false) checks.push({ id: "models", ok: false, detail: `${stt} is not cached`, next: "Run /voice-install." });
    else if (value.models.stt_cached === true) checks.push({ id: "models", ok: true, detail: `${stt} cached` });
  }
  return checks;
}

// src/engine/index.ts
init_errors();
init_binary();
import { randomUUID as randomUUID3 } from "node:crypto";
import { mkdir as mkdir3, readFile as readFile2, rm as rm3, writeFile } from "node:fs/promises";
import { join as join4 } from "node:path";

// src/engine/play.ts
init_errors();
import { spawn as spawn3 } from "node:child_process";
var Player = class {
  child;
  resolveExit;
  options;
  constructor(options) {
    this.options = options;
  }
  get playing() {
    return this.child !== void 0 && this.child.exitCode === null;
  }
  play(path, options = {}) {
    const { signal } = options;
    if (this.playing) return Promise.reject(new EngineError("BUSY", "A reply is already playing."));
    const args = ["play", path];
    const rate = options.rate ?? this.options.rate;
    if (rate !== void 0 && rate !== 1) args.push("--rate", String(rate));
    let child;
    try {
      child = spawn3(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["ignore", "ignore", "pipe"] });
    } catch (error) {
      return Promise.reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`));
    }
    this.child = child;
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    return new Promise((resolve2, reject) => {
      this.resolveExit = resolve2;
      const abort = () => this.stop();
      signal?.addEventListener("abort", abort, { once: true });
      child.on("error", (error) => {
        this.child = void 0;
        reject(new EngineError("ENGINE_MISSING", `The speech engine could not play audio: ${error.message}`));
      });
      child.on("exit", (code) => {
        this.child = void 0;
        signal?.removeEventListener("abort", abort);
        if (signal?.aborted === true) return reject(new EngineError("CANCELLED", "Playback was stopped."));
        if (code === 0) return resolve2();
        reject(
          /no (?:default )?(?:output|speaker)|device not found/i.test(stderr) ? new EngineError("AUDIO_DEVICE_MISSING", "No output device is available.") : new EngineError("SIDECAR_FAILED", "The reply could not be played.")
        );
      });
    });
  }
  /** Stops playback at once, escalating SIGTERM to SIGKILL. Only the exact child is signalled. */
  stop() {
    const child = this.child;
    if (child !== void 0 && child.exitCode === null) {
      child.kill("SIGTERM");
      const kill = setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
      }, 1e3);
      kill.unref?.();
    }
    this.resolveExit?.();
    this.resolveExit = void 0;
  }
};

// src/engine/record.ts
init_errors();
import { spawn as spawn4 } from "node:child_process";
import { chmod as chmod2, stat as stat3 } from "node:fs/promises";
import { createInterface } from "node:readline";
var STOP_MS = 3e3;
var KILL_MS2 = 1e3;
function captureFailure(text) {
  if (/permission denied|not authorized|TCC/i.test(text)) {
    return new EngineError("MIC_DENIED", "The operating system refused microphone access.");
  }
  if (/no (?:default )?(?:input|microphone)|device not found|no such device/i.test(text)) {
    return new EngineError("MIC_UNAVAILABLE", "No input device is available.");
  }
  return new EngineError("SIDECAR_FAILED", "The microphone could not be opened.");
}
var Recorder = class {
  child;
  lines;
  stderr = [];
  stopped = false;
  exited = Promise.resolve(null);
  started = false;
  options;
  constructor(options) {
    this.options = options;
  }
  get running() {
    return this.child !== void 0 && this.child.exitCode === null && !this.stopped;
  }
  /**
   * Starts the recorder. `onLevel` receives dBFS for each 20 ms frame; `onExit` fires if the recorder ends on its own,
   * such as at the maximum length.
   */
  start(handlers) {
    if (this.started) throw new EngineError("BUSY", "A recording is already running.");
    this.started = true;
    this.stopped = false;
    const args = ["record", "-O", this.options.path, "--seconds", String(this.options.maxSeconds), "--level-events", ...this.options.cacheDir === void 0 ? [] : ["--cache-dir", this.options.cacheDir]];
    let child;
    try {
      child = spawn4(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      this.started = false;
      throw new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error)}`);
    }
    this.child = child;
    if (child.stdout !== null) {
      this.lines = createInterface({ input: child.stdout });
      let lastT;
      this.lines.on("line", (line) => {
        try {
          const event = JSON.parse(line);
          if (typeof event !== "object" || event === null) return;
          const record = event;
          let dbfs;
          if (typeof record.level_dbfs === "number") dbfs = record.level_dbfs;
          else if (record.type === "level" && typeof record.rms === "number") {
            dbfs = record.rms <= 0 ? Number.NEGATIVE_INFINITY : 20 * Math.log10(record.rms);
          }
          if (dbfs === void 0) return;
          const at = typeof record.t_ms === "number" ? record.t_ms : void 0;
          const delta = at !== void 0 && lastT !== void 0 ? Math.min(1e3, Math.max(20, at - lastT)) : typeof record.level_dbfs === "number" ? 20 : 100;
          if (at !== void 0) lastT = at;
          handlers.onLevel(dbfs, delta);
        } catch {
        }
      });
    }
    if (child.stderr !== null) child.stderr.on("data", (chunk) => this.stderr.push(chunk.toString("utf8")));
    this.exited = new Promise((resolve2) => {
      child.on("error", (error) => {
        this.options.log?.("warn", `recorder error: ${error.message}`);
        handlers.onExit?.(new EngineError("ENGINE_MISSING", "The speech engine could not start."));
        resolve2(null);
      });
      child.on("exit", (code) => {
        this.started = false;
        this.options.onEnd?.();
        if (this.stopped) return resolve2(code);
        const error = code === 0 ? void 0 : captureFailure(this.stderr.join(" "));
        handlers.onExit?.(error);
        resolve2(code);
      });
    });
  }
  /** Ends the recording gracefully, so the WAV is finalised, then makes it private and measures it. */
  async stop() {
    const child = this.child;
    this.stopped = true;
    if (child !== void 0 && child.exitCode === null) {
      child.kill("SIGINT");
      const grace = this.options.stopMs ?? STOP_MS;
      const terminate = setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGTERM");
      }, grace);
      const kill = setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
      }, grace + KILL_MS2);
      await Promise.race([this.exited, new Promise((resolve2) => setTimeout(resolve2, grace + KILL_MS2 + 500))]);
      clearTimeout(terminate);
      clearTimeout(kill);
    }
    this.lines?.close();
    this.child = void 0;
    this.started = false;
    this.options.onEnd?.();
    await chmod2(this.options.path, 384).catch(() => void 0);
    const info = await stat3(this.options.path).catch(() => void 0);
    if (info === void 0 || !info.isFile() || info.size <= 44) {
      throw new EngineError("NO_SPEECH", "No audio was recorded.");
    }
    return { path: this.options.path, bytes: info.size, seconds: (info.size - 44) / 32e3 };
  }
  /** Stops at once, escalating SIGTERM to SIGKILL; the caller deletes the file. */
  cancel() {
    this.stopped = true;
    const child = this.child;
    if (child !== void 0 && child.exitCode === null) {
      child.kill("SIGTERM");
      const kill = setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
      }, KILL_MS2);
      kill.unref?.();
    }
    this.lines?.close();
    this.child = void 0;
    this.started = false;
    this.options.onEnd?.();
  }
};

// src/engine/sidecar.ts
init_errors();
import { spawn as spawn5 } from "node:child_process";
import { createInterface as createInterface2 } from "node:readline";
var READY_TIMEOUT = 6e4;
var TRANSCRIBE_TIMEOUT = 12e4;
var SYNTHESIZE_TIMEOUT = 3e4;
var STOP_GRACE = 2e3;
var KILL_GRACE = 1e3;
var STDERR_TAIL = 3;
var isRecord4 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function sidecarArgs(options) {
  return [
    "converse",
    "--stdio",
    "--local-only",
    "--model",
    options.model,
    "--language",
    options.language,
    "--voice",
    options.voice,
    "--preload",
    "--cache-dir",
    options.cacheDir
  ];
}
var AurumSidecar = class {
  options;
  child;
  stdout;
  stderr;
  pending;
  chain = Promise.resolve();
  cancelEpoch = 0;
  ready;
  state = "idle";
  stderrTail = [];
  restarts = 0;
  stopping = false;
  waiters = [];
  failure;
  readyTimer;
  constructor(options) {
    this.options = options;
  }
  get current() {
    return this.state;
  }
  get caps() {
    return this.ready?.caps ?? [];
  }
  setState(next) {
    if (next === this.state) return;
    this.state = next;
    try {
      this.options.onState?.(next);
    } catch (error) {
      this.options.log?.("warn", `state listener failed: ${String(error)}`);
    }
  }
  /** Starts the sidecar and waits for `ready`. Safe to call again while ready. */
  start() {
    if (this.ready !== void 0) return Promise.resolve(this.ready);
    if (this.state === "starting") return new Promise((resolve2, reject) => this.waiters.push({ resolve: resolve2, reject }));
    if (this.state === "failed") return Promise.reject(this.failure ?? new EngineError("SIDECAR_FAILED", "The speech engine failed to start."));
    return this.launch();
  }
  launch() {
    this.setState("starting");
    this.failure = void 0;
    this.ready = void 0;
    let child;
    try {
      child = spawn5(this.options.bin, sidecarArgs(this.options), {
        env: { ...process.env, ...this.options.env },
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (error) {
      const failure = new EngineError("SIDECAR_FAILED", `The speech engine could not start: ${String(error)}`);
      this.failure = failure;
      this.setState("failed");
      return Promise.reject(failure);
    }
    this.child = child;
    if (child.stdout === null || child.stderr === null || child.stdin === null) {
      this.failure = new EngineError("SIDECAR_FAILED", "The speech engine's pipes are unavailable.");
      this.setState("failed");
      return Promise.reject(this.failure);
    }
    this.stdout = createInterface2({ input: child.stdout });
    this.stderr = createInterface2({ input: child.stderr });
    this.stderr?.on("line", (line) => {
      this.stderrTail.push(line);
      if (this.stderrTail.length > STDERR_TAIL) this.stderrTail.shift();
      this.options.log?.("debug", line);
    });
    this.stdout.on("line", (line) => this.onLine(line));
    child.on("error", (error) => this.fail(new EngineError("SIDECAR_FAILED", `The speech engine failed: ${error.message}`)));
    child.on("exit", (code) => {
      if (!this.stopping) this.fail(new EngineError("ENGINE_EXITED", `The speech engine exited with code ${code ?? "unknown"}.`));
    });
    const promise = new Promise((resolve2, reject) => this.waiters.push({ resolve: resolve2, reject }));
    this.readyTimer = setTimeout(() => this.fail(new EngineError("TIMEOUT", "The speech engine did not become ready in time.")), this.options.readyMs ?? READY_TIMEOUT);
    return promise;
  }
  onLine(line) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      this.options.log?.("warn", "the speech engine wrote a line that is not JSON");
      return;
    }
    if (!isRecord4(event) || typeof event.type !== "string") return;
    if (event.type === "ready") {
      const caps = Array.isArray(event.caps) ? event.caps.filter((cap) => typeof cap === "string") : [];
      if (!caps.includes("transcribe")) {
        this.fail(new EngineError("ENGINE_INCOMPATIBLE", "This Aurum build does not advertise the transcribe capability."));
        return;
      }
      this.ready = {
        sttProvider: typeof event.stt_provider === "string" ? event.stt_provider : "local",
        ttsProvider: typeof event.tts_provider === "string" ? event.tts_provider : "local",
        caps
      };
      if (this.readyTimer !== void 0) clearTimeout(this.readyTimer);
      this.setState("ready");
      for (const waiter of this.waiters.splice(0)) waiter.resolve(this.ready);
      return;
    }
    if (event.type === "error") {
      const category = typeof event.category === "string" ? event.category : "internal";
      const message = typeof event.message === "string" ? event.message : "The speech engine reported an error.";
      const error = fromSidecarCategory(category, message);
      this.settle(error);
      if (this.state === "starting") this.fail(error);
      return;
    }
    const pending = this.pending;
    if (pending === void 0 || event.type !== pending.expected) return;
    try {
      const value = pending.read(event);
      this.settle(void 0, value);
    } catch (error) {
      this.settle(error instanceof EngineError ? error : new EngineError("SIDECAR_FAILED", "The speech engine sent an unusable event."));
    }
  }
  settle(error, value) {
    const pending = this.pending;
    if (pending === void 0) return;
    this.pending = void 0;
    if (pending.timer !== void 0) clearTimeout(pending.timer);
    this.setState("ready");
    if (error !== void 0) pending.reject(error);
    else pending.resolve(value);
  }
  fail(error) {
    if (this.stopping) return;
    this.failure = error;
    const pending = this.pending;
    this.pending = void 0;
    if (pending?.timer !== void 0) clearTimeout(pending.timer);
    pending?.reject(error);
    if (this.readyTimer !== void 0) clearTimeout(this.readyTimer);
    for (const waiter of this.waiters.splice(0)) waiter.reject(error);
    this.ready = void 0;
    this.setState("failed");
    this.cleanup();
  }
  cleanup() {
    this.stdout?.close();
    this.stderr?.close();
    this.stdout = void 0;
    this.stderr = void 0;
    const child = this.child;
    this.child = void 0;
    if (child !== void 0 && child.exitCode === null) child.kill("SIGTERM");
  }
  /**
   * One request at a time. The second waits for the first to settle before it takes `pending`, so a `user_final` can
   * never resolve the wrong promise. The request is pending at once, so a cancel in the same tick can settle it.
   */
  send(pending, request) {
    const epoch = this.cancelEpoch;
    const task = this.chain.then(
      () => new Promise((resolve2, reject) => {
        if (epoch !== this.cancelEpoch) {
          reject(new EngineError("CANCELLED", "The request was cancelled."));
          return;
        }
        const entry = { ...pending, resolve: resolve2, reject };
        this.pending = entry;
        entry.timer = setTimeout(() => {
          this.settle(new EngineError("TIMEOUT", "The speech engine did not answer in time."));
          this.cancel();
        }, pending.timeoutMs);
        void this.start().then(() => {
          if (this.pending !== entry) return;
          const child = this.child;
          if (child?.stdin === null || child?.stdin === void 0) {
            this.settle(new EngineError("SIDECAR_FAILED", "The speech engine is not running."));
            return;
          }
          this.setState("busy");
          try {
            child.stdin.write(`${JSON.stringify({ v: 1, ...request })}
`);
          } catch (error) {
            this.settle(new EngineError("SIDECAR_FAILED", `The speech engine could not be written to: ${String(error)}`));
          }
        }).catch((error) => this.settle(error instanceof EngineError ? error : new EngineError("SIDECAR_FAILED", "The speech engine did not start.")));
      })
    );
    this.chain = task.catch(() => void 0);
    return task;
  }
  /** Transcribes an absolute WAV path; the engine reads it, so no audio crosses a pipe. */
  transcribe(path) {
    return this.send(
      {
        type: "transcribe",
        expected: "user_final",
        timeoutMs: this.options.transcribeMs ?? TRANSCRIBE_TIMEOUT,
        read: (event) => {
          if (typeof event.text !== "string") throw new EngineError("SIDECAR_FAILED", "The transcript event has no text.");
          return {
            text: event.text,
            provider: typeof event.provider === "string" ? event.provider : "local",
            model: typeof event.model === "string" ? event.model : this.options.model
          };
        }
      },
      { type: "transcribe", path }
    );
  }
  /**
   * Writes a WAV to an absolute path. It does not play it. A speaking rate is sent only when Aurum advertises the
   * capability; otherwise a rate other than 1 is refused with UNSUPPORTED rather than silently ignored.
   */
  async synthesize(text, path, options = {}) {
    const rate = options.rate;
    if (rate !== void 0 && rate !== 1) {
      await this.start();
      if (!this.caps.includes("synthesize_speaking_rate")) {
        throw new EngineError("UNSUPPORTED", "This Aurum build cannot apply a speaking rate.");
      }
    }
    return this.send(
      {
        type: "synthesize",
        expected: "synthesized",
        timeoutMs: this.options.synthesizeMs ?? SYNTHESIZE_TIMEOUT,
        read: (event) => ({
          path: typeof event.path === "string" ? event.path : path,
          durationMs: typeof event.duration_ms === "number" ? event.duration_ms : 0,
          provider: typeof event.provider === "string" ? event.provider : "local",
          model: typeof event.model === "string" ? event.model : "",
          voice: typeof event.voice === "string" ? event.voice : ""
        })
      },
      { type: "synthesize", text, path, ...rate === void 0 || rate === 1 ? {} : { speaking_rate: rate } }
    );
  }
  /** Aborts the in-flight request, and any queued request issued before now, then tells the engine. */
  cancel() {
    this.cancelEpoch += 1;
    if (this.pending !== void 0) this.settle(new EngineError("CANCELLED", "The request was cancelled."));
    const child = this.child;
    if (child?.stdin !== null && child?.stdin !== void 0 && child.stdin.writable) {
      try {
        child.stdin.write(`${JSON.stringify({ v: 1, type: "abort" })}
`);
      } catch {
      }
    }
  }
  /** Asks the engine to exit, then escalates SIGTERM to SIGKILL; the promise is bounded whatever the child does. */
  async stop() {
    const child = this.child;
    if (child === void 0) {
      this.setState("idle");
      return;
    }
    this.stopping = true;
    const exited = new Promise((resolve2) => {
      if (child.exitCode !== null) return resolve2();
      child.once("exit", () => resolve2());
    });
    try {
      child.stdin?.write(`${JSON.stringify({ v: 1, type: "shutdown" })}
`);
    } catch {
    }
    const terminate = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGTERM");
    }, this.options.stopMs ?? STOP_GRACE);
    const kill = setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, (this.options.stopMs ?? STOP_GRACE) + KILL_GRACE);
    const bounded = new Promise((resolve2) => setTimeout(resolve2, (this.options.stopMs ?? STOP_GRACE) + KILL_GRACE + 1e3));
    await Promise.race([exited, bounded]);
    clearTimeout(terminate);
    clearTimeout(kill);
    this.cleanup();
    this.ready = void 0;
    this.stopping = false;
    this.setState("idle");
  }
  /** Restarts once after a crash; a second failure is reported as it is. */
  async restart() {
    if (this.restarts >= 1) throw new EngineError("SIDECAR_FAILED", "The speech engine failed twice; it will not be restarted again.");
    this.restarts += 1;
    await this.stop().catch(() => void 0);
    this.failure = void 0;
    await this.start();
  }
};

// src/engine/wav.ts
init_errors();
var WIRE_RATE = 16e3;
var WIRE_CHANNELS = 1;
var WIRE_BITS = 16;
var SILENCE_PEAK_DBFS = -50;
var MIN_VOICED_MS = 160;
var FRAME_MS = 20;
var tag = (bytes, at) => String.fromCharCode(...bytes.subarray(at, at + 4));
function readWav(bytes) {
  const bad = (message) => new EngineError("BAD_AUDIO", message);
  if (bytes.length < 12 || tag(bytes, 0) !== "RIFF" || tag(bytes, 8) !== "WAVE") throw bad("The audio is not a WAV file.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let format;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = tag(bytes, offset);
    const declared = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === "fmt ") {
      if (declared < 16 || body + 16 > bytes.length) throw bad("The WAV header is damaged.");
      format = {
        code: view.getUint16(body, true),
        channels: view.getUint16(body + 2, true),
        rate: view.getUint32(body + 4, true),
        bits: view.getUint16(body + 14, true)
      };
    } else if (id === "data") {
      if (format === void 0) throw bad("The WAV header is damaged.");
      if (format.code !== 1 || format.bits !== WIRE_BITS) throw bad("The WAV must be 16-bit PCM.");
      if (format.channels !== WIRE_CHANNELS) throw bad("The WAV must be mono.");
      if (format.rate !== WIRE_RATE) throw bad("The WAV must be 16 kHz.");
      const length = Math.min(declared, bytes.length - body);
      if (length < 2) throw bad("The WAV has no audio data.");
      const samples = Math.floor(length / 2);
      let peak = 0;
      const frameSamples = Math.max(1, WIRE_RATE * FRAME_MS / 1e3);
      let voicedFrames = 0;
      for (let index = 0; index < samples; index += 1) {
        const sample = Math.abs(view.getInt16(body + index * 2, true)) / 32768;
        if (sample > peak) peak = sample;
      }
      for (let start = 0; start < samples; start += frameSamples) {
        const end = Math.min(samples, start + frameSamples);
        let sum = 0;
        for (let index = start; index < end; index += 1) {
          const sample = view.getInt16(body + index * 2, true) / 32768;
          sum += sample * sample;
        }
        const dbfs = sum === 0 ? -Infinity : 20 * Math.log10(Math.sqrt(sum / Math.max(1, end - start)));
        if (dbfs > SILENCE_PEAK_DBFS) voicedFrames += 1;
      }
      return {
        sampleRate: format.rate,
        channels: format.channels,
        bits: format.bits,
        dataOffset: body,
        dataBytes: length,
        seconds: length / (WIRE_RATE * 2),
        peakDbfs: peak === 0 ? -Infinity : 20 * Math.log10(peak),
        voicedMs: voicedFrames * FRAME_MS
      };
    }
    offset = body + declared + declared % 2;
  }
  throw bad("The WAV has no audio data.");
}
var isSilent = (info) => info.peakDbfs < SILENCE_PEAK_DBFS || info.voicedMs < MIN_VOICED_MS;

// src/engine/speakable.ts
var DEFAULT_LIMIT = 4e3;
var stripFences = (text) => text.replace(/```[\s\S]*?```/g, " code block ");
var stripInline = (text) => text.replace(/`([^`]+)`/g, "$1");
var stripImages = (text) => text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
var stripLinks = (text) => text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
var stripHtml = (text) => text.replace(/<[^>]+>/g, " ");
var stripHeadings = (text) => text.replace(/^#{1,6}\s+/gm, "");
var stripEmphasis = (text) => text.replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2");
var stripRules = (text) => text.replace(/^\s*([-*_])\1{2,}\s*$/gm, " ");
var stripQuotes = (text) => text.replace(/^\s*>\s?/gm, "");
var stripBullets = (text) => text.replace(/^\s*[-*+]\s+/gm, "");
var stripNumbers = (text) => text.replace(/^\s*\d+[.)]\s+/gm, "");
var stripTable = (text) => text.split("\n").filter((line) => !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line)).map((line) => line.includes("|") ? line.replace(/\s*\|\s*/g, ", ").replace(/^,\s*|,\s*$/g, "") : line).join("\n");
function speakable(text, limit = DEFAULT_LIMIT) {
  let value = text;
  value = stripFences(value);
  value = stripImages(value);
  value = stripLinks(value);
  value = stripTable(value);
  value = stripHtml(value);
  value = stripHeadings(value);
  value = stripRules(value);
  value = stripQuotes(value);
  value = stripBullets(value);
  value = stripNumbers(value);
  value = stripInline(value);
  value = stripEmphasis(value);
  value = value.replace(/\s+/g, " ").trim();
  if (value.length <= limit) return value;
  const cut2 = value.slice(0, limit - 1);
  const at = cut2.lastIndexOf(" ");
  return `${(at > limit / 2 ? cut2.slice(0, at) : cut2).trimEnd()}\u2026`;
}

// src/engine/index.ts
var SIDECAR_UTTERANCE_SECONDS = 30;
var SpeechEngine = class {
  sidecar;
  player;
  options;
  temp;
  checked = /* @__PURE__ */ new Set();
  activeRecorder;
  recorderPath;
  versionChecked = false;
  disposed = false;
  constructor(options) {
    this.options = options;
    this.temp = join4(options.cacheRoot, "tmp", `${process.pid}-${randomUUID3()}`);
    this.player = new Player({ bin: options.bin, ...options.env === void 0 ? {} : { env: options.env }, ...options.log === void 0 ? {} : { log: options.log } });
  }
  /** The engine cache passed to Aurum as `--cache-dir`; it holds the models the plugin downloaded. */
  get cacheDir() {
    return join4(this.options.cacheRoot, "engine");
  }
  get state() {
    return this.sidecar?.current ?? "idle";
  }
  /** The capabilities the running sidecar advertised; empty before it starts. */
  get caps() {
    return this.sidecar?.caps ?? [];
  }
  async preflight(role) {
    if (this.options.preflight === void 0 || this.checked.has(role)) return;
    await this.options.preflight(role);
    this.checked.add(role);
  }
  async checkVersion() {
    if (this.versionChecked) return;
    const probe = await probeEngine(this.options.bin, this.options.env);
    if (!probe.compatible) {
      throw new EngineError(
        "ENGINE_INCOMPATIBLE",
        probe.version === null ? `The speech engine did not report a version; Aurum ${MINIMUM_ENGINE} or later is required.` : `Aurum ${probe.version} is older than the required ${MINIMUM_ENGINE}; record, play and converse --stdio need ${MINIMUM_ENGINE}.`
      );
    }
    this.versionChecked = true;
  }
  async ensureSidecar(role = "stt") {
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    await this.checkVersion();
    await this.preflight(role);
    if (this.sidecar === void 0) {
      this.sidecar = new AurumSidecar({
        bin: this.options.bin,
        model: this.options.model,
        language: this.options.language,
        voice: this.options.voice,
        cacheDir: this.cacheDir,
        ...this.options.env === void 0 ? {} : { env: this.options.env },
        ...this.options.log === void 0 ? {} : { log: this.options.log },
        ...this.options.onState === void 0 ? {} : { onState: this.options.onState },
        ...this.options.timeouts?.readyMs === void 0 ? {} : { readyMs: this.options.timeouts.readyMs },
        ...this.options.timeouts?.transcribeMs === void 0 ? {} : { transcribeMs: this.options.timeouts.transcribeMs },
        ...this.options.timeouts?.synthesizeMs === void 0 ? {} : { synthesizeMs: this.options.timeouts.synthesizeMs },
        ...this.options.timeouts?.stopMs === void 0 ? {} : { stopMs: this.options.timeouts.stopMs }
      });
    }
    return this.sidecar;
  }
  /** Starts the sidecar and loads the model, so the first dictation does not pay the cold start. */
  async warmup() {
    const sidecar = await this.ensureSidecar();
    await sidecar.start();
    return { ready: true, state: sidecar.current };
  }
  async newPath(extension) {
    await mkdir3(this.temp, { recursive: true, mode: 448 });
    return join4(this.temp, `voice-${randomUUID3()}.${extension}`);
  }
  /** A recorder for one utterance. The engine owns it: dispose cancels it, and the caller releases the path. */
  async recorder(signal) {
    if (this.activeRecorder?.running === true) throw new EngineError("BUSY", "A recording is already running.");
    const path = await this.newPath("wav");
    const recorder = new Recorder({
      bin: this.options.bin,
      path,
      maxSeconds: this.options.maxRecordSeconds,
      cacheDir: this.cacheDir,
      ...this.options.env === void 0 ? {} : { env: this.options.env },
      ...this.options.log === void 0 ? {} : { log: this.options.log },
      onEnd: () => {
        if (this.activeRecorder === recorder) this.activeRecorder = void 0;
      }
    });
    this.activeRecorder = recorder;
    this.recorderPath = path;
    signal?.addEventListener("abort", () => recorder.cancel(), { once: true });
    return { recorder, path };
  }
  /** Checks a WAV path without handing it to the engine. */
  async inspectWav(path) {
    let bytes;
    try {
      bytes = await readFile2(path);
    } catch {
      throw new EngineError("BAD_AUDIO", "The recording could not be read.");
    }
    const info = readWav(bytes);
    if (info.seconds > 120) throw new EngineError("AUDIO_TOO_LONG", "The recording is longer than 120 seconds.");
    return { ...info, bytes: bytes.byteLength };
  }
  /** Refuses audio beyond Aurum's live limit unless the build advertises `long_audio`. */
  assertLength(sidecar, seconds) {
    if (seconds > SIDECAR_UTTERANCE_SECONDS && !sidecar.caps.includes("long_audio")) {
      throw new EngineError("AUDIO_TOO_LONG", "This Aurum build accepts at most 30 seconds per utterance.");
    }
  }
  /** Transcribes a WAV path. Silent audio never reaches the model. */
  async transcribeFile(path) {
    const wav = await this.inspectWav(path);
    if (isSilent(wav)) return { text: "", silent: true, provider: "local", model: this.options.model, wav };
    const sidecar = await this.ensureSidecar("stt");
    this.assertLength(sidecar, wav.seconds);
    const result = await sidecar.transcribe(path);
    return { ...result, silent: false, wav };
  }
  /** Transcribes bytes, as the engine RPC receives them: a private temp file, deleted whatever happens. */
  async transcribeBytes(bytes) {
    const wav = readWav(bytes);
    if (wav.seconds > 120) throw new EngineError("AUDIO_TOO_LONG", "The audio is longer than 120 seconds.");
    if (isSilent(wav)) return { text: "", silent: true, provider: "local", model: this.options.model };
    const path = await this.newPath("wav");
    try {
      await writeFile(path, bytes, { mode: 384 });
      const sidecar = await this.ensureSidecar("stt");
      this.assertLength(sidecar, wav.seconds);
      const result = await sidecar.transcribe(path);
      return { ...result, silent: false };
    } finally {
      await rm3(path, { force: true });
    }
  }
  /** Synthesizes text to a temp WAV and returns its path; the caller plays it and calls `release`. */
  async synthesize(text, options = {}) {
    const spoken = options.markdown === true ? speakable(text) : text.trim();
    if (spoken === "") throw new EngineError("BAD_AUDIO", "There is nothing to read aloud.");
    const path = await this.newPath("wav");
    const sidecar = await this.ensureSidecar("tts");
    try {
      const result = await sidecar.synthesize(spoken, path, options.rate === void 0 ? {} : { rate: options.rate });
      return { path, spoken, durationMs: result.durationMs, voice: result.voice || this.options.voice };
    } catch (error) {
      await rm3(path, { force: true });
      throw error;
    }
  }
  /** Plays a WAV, at an optional speaking rate, or rejects with `CANCELLED` when the caller aborts. */
  async play(path, options = {}) {
    await this.player.play(path, { ...options.signal === void 0 ? {} : { signal: options.signal }, ...options.rate === void 0 ? {} : { rate: options.rate } }).catch((error) => {
      if (error instanceof EngineError && error.code === "CANCELLED") return;
      throw error;
    });
  }
  stopPlayback() {
    this.player.stop();
  }
  cancel() {
    this.sidecar?.cancel();
    this.player.stop();
    this.activeRecorder?.cancel();
    this.activeRecorder = void 0;
  }
  async release(path) {
    if (path === "") return;
    await rm3(path, { force: true });
  }
  async dispose() {
    this.disposed = true;
    this.player.stop();
    this.activeRecorder?.cancel();
    this.activeRecorder = void 0;
    if (this.recorderPath !== void 0) await rm3(this.recorderPath, { force: true }).catch(() => void 0);
    await this.sidecar?.stop().catch(() => void 0);
    this.sidecar = void 0;
    await rm3(this.temp, { recursive: true, force: true }).catch(() => void 0);
  }
};

// src/tui.tsx
init_errors();

// src/options.ts
var TOP_KEYS = [
  "aurumPath",
  "assetsDir",
  "submit",
  "keybind",
  "autoSpeak",
  "voice",
  "sttModel",
  "language",
  "maxRecordSeconds",
  "statusIndicator",
  "keepTranscripts",
  "allowUntestedHost",
  "engine",
  "access"
];
var isRecord5 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var fail2 = (field, message, next) => ({
  ok: false,
  error: { code: "OPTIONS_INVALID", field, message, next }
});
var nonEmpty = (value) => typeof value === "string" && value.trim() !== "" && !/\s/.test(value);
function parseOptions(input) {
  const raw = input ?? {};
  if (!isRecord5(raw)) return fail2("options", "Plugin options must be an object.", "Set options to an object, or remove them.");
  const unknown = Object.keys(raw).find((key) => !TOP_KEYS.includes(key));
  if (unknown !== void 0) return fail2(unknown, "This option is not supported.", `Remove it. Supported options: ${TOP_KEYS.join(", ")}.`);
  const aurumPath = raw.aurumPath;
  if (aurumPath !== void 0 && (typeof aurumPath !== "string" || aurumPath.trim() === "")) {
    return fail2("aurumPath", "Must be a non-empty path.", "Set it to the absolute path of an Aurum binary, or remove it.");
  }
  const assetsDir = raw.assetsDir;
  if (assetsDir !== void 0 && (typeof assetsDir !== "string" || assetsDir.trim() === "")) {
    return fail2("assetsDir", "Must be a non-empty path.", "Set it to a folder holding the model files, or remove it.");
  }
  const submit = raw.submit ?? "send";
  if (submit !== "send" && submit !== "review") {
    return fail2("submit", 'Must be "send" or "review".', 'Set it to "send" to submit at once, or "review" to edit first.');
  }
  const keybind = raw.keybind;
  if (keybind !== void 0 && !nonEmpty(keybind)) {
    return fail2("keybind", "Must be a key combination without spaces.", 'Set it to a combination such as "ctrl+shift+space".');
  }
  const autoSpeak = raw.autoSpeak ?? false;
  if (typeof autoSpeak !== "boolean") return fail2("autoSpeak", "Must be true or false.", "Set it to true to read every completed reply aloud.");
  const voice = raw.voice ?? "Luna";
  if (!nonEmpty(voice)) return fail2("voice", "Must be a local voice name.", "Use a name from the status dialog, such as Luna.");
  const sttModel = raw.sttModel ?? "tiny-q5_1";
  if (!nonEmpty(sttModel)) return fail2("sttModel", "Must be a model name.", "Use a name from the status dialog, such as tiny-q5_1.");
  const language = raw.language ?? "auto";
  if (typeof language !== "string" || !/^(?:auto|[a-z]{2,3}(?:-[A-Z]{2})?)$/.test(language)) {
    return fail2("language", "Must be auto or a language code such as en or pt-BR.", "Set it to auto, or an ISO language code.");
  }
  const maxRecordSeconds = raw.maxRecordSeconds ?? 120;
  if (typeof maxRecordSeconds !== "number" || !Number.isInteger(maxRecordSeconds) || maxRecordSeconds < 5 || maxRecordSeconds > 120) {
    return fail2("maxRecordSeconds", "Must be a whole number from 5 to 120.", "Set the longest recording, in seconds.");
  }
  const statusIndicator = raw.statusIndicator ?? "toast";
  if (statusIndicator !== "toast" && statusIndicator !== "footer") {
    return fail2("statusIndicator", 'Must be "toast" or "footer".', 'Leave it "toast", or set "footer" for a listening row above the prompt.');
  }
  const keepTranscripts = raw.keepTranscripts ?? false;
  if (typeof keepTranscripts !== "boolean") {
    return fail2("keepTranscripts", "Must be true or false.", "Set it to true to keep the last 20 transcripts as text.");
  }
  const allowUntestedHost = raw.allowUntestedHost ?? false;
  if (typeof allowUntestedHost !== "boolean") {
    return fail2("allowUntestedHost", "Must be true or false.", "Set it to true only to run on an OpenCode version outside the supported range.");
  }
  const access = raw.access ?? "all";
  if (access !== "all" && access !== "ask-changes" && access !== "read-only") {
    return fail2("access", 'Must be "all", "ask-changes" or "read-only".', 'Set it to "ask-changes" to be asked before each change, or "read-only" to turn changes off.');
  }
  const engine = raw.engine ?? true;
  if (typeof engine !== "boolean") {
    return fail2("engine", "Must be true or false.", "Set it to false to serve no engine RPC to a host such as hey-jelly.");
  }
  return {
    ok: true,
    options: {
      ...aurumPath === void 0 ? {} : { aurumPath },
      ...assetsDir === void 0 ? {} : { assetsDir },
      submit,
      ...keybind === void 0 ? {} : { keybind },
      autoSpeak,
      voice,
      sttModel,
      language,
      maxRecordSeconds,
      statusIndicator,
      keepTranscripts,
      allowUntestedHost,
      engine,
      access
    }
  };
}

// src/tui.tsx
init_redact();
var PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
var STATUS_METHODS = {
  status: {
    input: {
      type: "object"
    },
    output: {
      type: "object"
    }
  }
};
function activeSession(context) {
  const route = context.ui.router.current();
  return typeof route === "object" && route !== null && route.type === "session" ? route.sessionID : void 0;
}
var tui_default = Plugin.define({
  id: TUI_ID,
  async setup(context) {
    const parsed = parseOptions(context.options);
    if (parsed.ok === false) {
      context.ui.toast.show({
        message: `${parsed.error.code}: ${parsed.error.message}`,
        variant: "error"
      });
      return;
    }
    const options = parsed.options;
    const keybind = options.keybind ?? (process.platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER);
    const [stored, updateStored] = context.storage.store("settings", {
      initial: {
        submit: options.submit,
        autoSpeak: options.autoSpeak
      }
    });
    const settings = () => ({
      submit: stored.submit === "review" ? "review" : "send",
      autoSpeak: stored.autoSpeak === true
    });
    const [historyState, updateHistoryState] = context.storage.store("history", {
      initial: {
        entries: []
      }
    });
    const history = new TranscriptHistory({
      read: () => Array.isArray(historyState.entries) ? historyState.entries : [],
      write: async (entries) => updateHistoryState((draft) => void (draft.entries = [...entries]))
    });
    const cacheRoot = defaultCacheRoot(homedir(), process.platform);
    const engineCacheDir = join5(cacheRoot, "engine");
    let engineInfo;
    try {
      engineInfo = resolveEngine({
        packageRoot: PACKAGE_ROOT,
        cacheRoot,
        ...options.aurumPath === void 0 ? {} : {
          optionPath: options.aurumPath
        }
      });
    } catch {
      engineInfo = void 0;
    }
    const modelStore = new ModelStore({
      cacheRoot,
      manifestPath: process.env.VOICE_MODELS_MANIFEST ?? join5(PACKAGE_ROOT, "manifest", "models.json"),
      ...options.assetsDir === void 0 ? {} : {
        assetsDir: options.assetsDir
      }
    });
    const engine = engineInfo === void 0 ? void 0 : new SpeechEngine({
      bin: engineInfo.path,
      model: options.sttModel,
      language: options.language,
      cacheRoot,
      voice: options.voice,
      maxRecordSeconds: options.maxRecordSeconds,
      preflight: (role) => modelStore.verifyRoles(role === "stt" ? ["stt"] : ["tts-model", "tts-voices", "tts-config"])
    });
    const [, setPhase] = createSignal("idle");
    const [line, setLine] = createSignal(void 0);
    const [conflict, setConflict] = createSignal(void 0);
    const toast = (message, variant = "info") => context.ui.toast.show({
      message,
      variant
    });
    const status = (next, text) => {
      if (next === "idle") {
        setPhase("idle");
        setLine(void 0);
      } else {
        setPhase(next);
        setLine(text === void 0 ? label(next) : `${label(next)}${text === "pause" ? " \xB7 pause" : ""}`);
      }
    };
    const flow = new DictationFlow({
      engine,
      activeSession: () => activeSession(context),
      submit: (sessionID, text) => context.client.session.prompt({
        sessionID,
        text
      }).then(() => void 0),
      review: (text) => context.ui.dialog.prompt({
        title: "Voice transcript",
        description: "Edit before sending",
        value: text
      }),
      toast,
      status,
      submitMode: () => settings().submit,
      record: (text) => {
        if (options.keepTranscripts) void history.add(text);
      }
    });
    let footerDispose;
    if (options.statusIndicator === "footer") {
      footerDispose = context.ui.slot({
        append: "prompt.footer.status",
        render: () => {
          const text = line();
          return text === void 0 ? (() => {
            var _el$ = _$createElement("text");
            _$insertNode(_el$, _$createTextNode(` `));
            return _el$;
          })() : (() => {
            var _el$3 = _$createElement("text");
            _$insert(_el$3, `Voice: ${text}`);
            _$effect((_$p) => _$setProp(_el$3, "fg", context.theme.text.muted, _$p));
            return _el$3;
          })();
        }
      });
    }
    const requireEngine = () => {
      if (engine === void 0) {
        toast("ENGINE_MISSING: The speech engine is not installed. Run /voice-install.", "error");
        return void 0;
      }
      return engine;
    };
    const dictate = async () => {
      if (requireEngine() === void 0) return;
      await flow.start();
    };
    const speakLast = async () => {
      if (requireEngine() === void 0) return;
      const sessionID = activeSession(context);
      if (sessionID === void 0) {
        toast("Open a session first", "warning");
        return;
      }
      await context.data.session.message.sync(sessionID);
      const messages = context.data.session.message.list(sessionID);
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (message?.type !== "assistant") continue;
        const text = (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n");
        if (text.trim() === "") continue;
        await flow.speak(text, {
          markdown: true
        });
        return;
      }
      toast("There is no reply to read aloud", "info");
    };
    const readStatus = async () => {
      const client = context.client.rpc({
        id: PLUGIN_ID,
        methods: STATUS_METHODS,
        events: {}
      });
      return client.status({}, {
        location: context.location ?? context.data.location.default()
      });
    };
    const openStatus = () => {
      const [text, setText] = createSignal("Reading the voice status\u2026");
      const [busy, setBusy] = createSignal(false);
      const [current, setCurrent] = createSignal(void 0);
      let stopped = false;
      const stops2 = [];
      const refresh = () => {
        if (stopped) return;
        setBusy(true);
        void readStatus().then((status2) => {
          if (stopped) return;
          setCurrent(status2);
          const rows = formatStatus(status2).split("\n").slice(1).join("\n");
          setText(conflict() === void 0 ? rows : `Keybind: ${conflict().key} is also used by ${conflict().command}
${rows}`);
        }, (error) => setText(cut(oneLine(asEngineError(error).message), 400))).then(() => setBusy(false));
      };
      const install = async () => {
        const target = {
          packageRoot: PACKAGE_ROOT,
          cacheRoot,
          store: modelStore
        };
        const request = await installRequest(target).catch((error) => {
          setText(cut(oneLine(asEngineError(error).message), 400));
          return void 0;
        });
        if (request === void 0) return;
        if (request.files.length === 0) {
          toast("The engine and every speech model are already installed", "info");
          refresh();
          return;
        }
        const confirmed = await context.ui.dialog.confirm({
          title: "Voice",
          message: `Download ${request.engine ? "the Aurum engine and " : ""}${request.files.length} file${request.files.length === 1 ? "" : "s"} (${Math.round(request.bytes / (1024 * 1024))} MB) from ${request.hosts.join(", ")}?`,
          label: {
            confirm: "Download",
            cancel: "Cancel"
          }
        });
        if (confirmed !== true) return;
        setText("Downloading the engine and speech models\u2026");
        void installAll(target, new AbortController().signal, async () => void 0).then((result) => {
          toast(result.downloaded.length === 0 ? "Everything is already installed" : "Speech installed", "success");
          refresh();
        }, (error) => setText(cut(oneLine(asEngineError(error).message), 400)));
      };
      const doctor = async () => {
        if (engineInfo === void 0) {
          setText("ENGINE_MISSING: The speech engine is not installed.");
          return;
        }
        setText("Running the voice doctor\u2026");
        const checks = await runDoctor(engineInfo.path, {
          cacheDir: engineCacheDir
        }).catch((error) => asEngineError(error));
        if (checks instanceof Error) {
          setText(cut(oneLine(checks.message), 400));
          return;
        }
        const probe = await Promise.resolve().then(() => (init_binary(), binary_exports)).then(({
          probeEngine: probeEngine2
        }) => probeEngine2(engineInfo.path));
        const lines = [`Engine: ${probe.version ?? "unknown"} (${probe.compatible ? "compatible" : "too old"})`, ...checks.map((check) => `${check.ok ? "ok" : "failed"} \xB7 ${check.id}: ${cut(oneLine(check.detail), 120)}`), `Models: ${(await modelStore.inspect().catch(() => [])).map((asset) => `${asset.name} ${asset.state}`).join(", ") || "none"}`];
        setText(lines.join("\n"));
      };
      const toggleSubmit = () => {
        const next = settings().submit === "send" ? "review" : "send";
        updateStored((draft) => void (draft.submit = next));
        toast(next === "review" ? "Voice: review before sending" : "Voice: send on pause", "info");
        refresh();
      };
      const toggleAutoSpeak = () => {
        const next = !settings().autoSpeak;
        updateStored((draft) => void (draft.autoSpeak = next));
        toast(next ? "Voice: read replies aloud" : "Voice: auto-speak off", "info");
        refresh();
      };
      const clearHistory = () => {
        void history.clear().then(() => {
          toast("Voice: transcript history cleared", "info");
          refresh();
        });
      };
      const StatusDialog = () => {
        context.keymap.layer(() => ({
          mode: "modal",
          commands: [{
            title: "Refresh the voice status",
            group: "Voice",
            bind: "r",
            run: () => refresh()
          }, {
            title: "Install the speech models",
            group: "Voice",
            bind: "i",
            run: () => void install()
          }, {
            title: "Run the voice doctor",
            group: "Voice",
            bind: "d",
            run: () => void doctor()
          }, {
            title: "Toggle review before sending",
            group: "Voice",
            bind: "s",
            run: () => toggleSubmit()
          }, {
            title: "Toggle auto-speak",
            group: "Voice",
            bind: "a",
            run: () => toggleAutoSpeak()
          }, {
            title: "Clear the transcript history",
            group: "Voice",
            bind: "c",
            run: () => clearHistory()
          }, {
            title: "Close the voice status",
            group: "Voice",
            bind: "escape",
            run: () => context.ui.dialog.clear()
          }]
        }));
        const theme = context.theme.text;
        return (() => {
          var _el$4 = _$createElement("box"), _el$5 = _$createElement("box"), _el$6 = _$createElement("text"), _el$8 = _$createElement("text"), _el$9 = _$createElement("text"), _el$0 = _$createElement("text");
          _$insertNode(_el$4, _el$5);
          _$insertNode(_el$4, _el$9);
          _$insertNode(_el$4, _el$0);
          _$setProp(_el$4, "flexDirection", "column");
          _$setProp(_el$4, "gap", 1);
          _$setProp(_el$4, "paddingLeft", 2);
          _$setProp(_el$4, "paddingRight", 2);
          _$setProp(_el$4, "paddingBottom", 1);
          _$insertNode(_el$5, _el$6);
          _$insertNode(_el$5, _el$8);
          _$setProp(_el$5, "flexDirection", "row");
          _$setProp(_el$5, "justifyContent", "space-between");
          _$insertNode(_el$6, _$createTextNode(`Voice status`));
          _$insert(_el$8, () => busy() ? "refreshing\u2026" : "r refresh \xB7 esc close");
          _$setProp(_el$9, "wrapMode", "word");
          _$insert(_el$9, text);
          _$insert(_el$0, () => `i install \xB7 d doctor \xB7 s send/review \xB7 a auto-speak \xB7 c clear history${current() === void 0 ? "" : ` \xB7 ${historySummary(current(), history.count())}`}`);
          _$effect((_p$) => {
            var _v$ = theme.base, _v$2 = TextAttributes.BOLD, _v$3 = theme.muted, _v$4 = theme.base, _v$5 = theme.muted;
            _v$ !== _p$.e && (_p$.e = _$setProp(_el$6, "fg", _v$, _p$.e));
            _v$2 !== _p$.t && (_p$.t = _$setProp(_el$6, "attributes", _v$2, _p$.t));
            _v$3 !== _p$.a && (_p$.a = _$setProp(_el$8, "fg", _v$3, _p$.a));
            _v$4 !== _p$.o && (_p$.o = _$setProp(_el$9, "fg", _v$4, _p$.o));
            _v$5 !== _p$.i && (_p$.i = _$setProp(_el$0, "fg", _v$5, _p$.i));
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0,
            i: void 0
          });
          return _el$4;
        })();
      };
      const subscribed = ["server.connected", "mcp.status.changed", "agent.updated"].flatMap((type) => [context.data.on(type, () => refresh())]);
      stops2.push(...subscribed);
      context.ui.dialog.show(() => _$createComponent(StatusDialog, {}), () => {
        stopped = true;
        for (const stop of stops2.splice(0)) stop();
      });
      context.ui.dialog.set({
        size: "large"
      });
      refresh();
    };
    context.keymap.layer(() => ({
      mode: "global",
      commands: [{
        id: `${PLUGIN_ID}.dictate`,
        title: "Voice: Dictate",
        description: "Start dictation; a pause or a second press sends it",
        group: "Voice",
        palette: true,
        bind: keybind,
        slash: {
          name: `${COMMAND_STEM}-dictate`
        },
        run: () => void dictate()
      }, {
        id: `${PLUGIN_ID}.status`,
        title: "Voice: Status",
        description: "The engine, the models, the microphone and the next step",
        group: "Voice",
        palette: true,
        slash: {
          name: COMMAND_STEM
        },
        run: () => openStatus()
      }, {
        id: `${PLUGIN_ID}.speak`,
        title: "Voice: Speak last response",
        description: "Read the last assistant reply aloud",
        group: "Voice",
        palette: true,
        slash: {
          name: `${COMMAND_STEM}-speak`
        },
        run: () => void speakLast()
      }, {
        id: `${PLUGIN_ID}.cancel`,
        title: "Voice: Cancel",
        description: "Stop the recording, transcription or playback",
        group: "Voice",
        bind: "escape",
        enabled: () => flow.active || flow.state === "playing",
        run: () => flow.cancel()
      }]
    }));
    const owner = context.keymap.commands().find((command) => command.bind === keybind && command.id !== `${PLUGIN_ID}.dictate`);
    if (owner !== void 0) {
      const found = {
        key: keybind,
        command: owner.title ?? owner.id ?? "another command"
      };
      setConflict(found);
      toast(`Voice: ${keybind} is also used by ${found.command}`, "warning");
    }
    const stops = [];
    let spoken = /* @__PURE__ */ new Set();
    stops.push(context.data.on("session.execution.succeeded", (event) => {
      if (!settings().autoSpeak) return;
      const data = event.data;
      if (data?.sessionID === void 0 || data.sessionID !== activeSession(context)) return;
      void context.data.session.message.sync(data.sessionID).then(() => {
        const messages = context.data.session.message.list(data.sessionID);
        for (let index = messages.length - 1; index >= 0; index -= 1) {
          const message = messages[index];
          if (message?.type !== "assistant" || message.id === void 0 || spoken.has(message.id)) continue;
          const text = (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n");
          if (text.trim() === "") continue;
          spoken.add(message.id);
          if (spoken.size > 100) spoken = new Set([...spoken].slice(-50));
          void flow.speak(text, {
            markdown: true
          });
          return;
        }
      });
    }));
    return async () => {
      for (const stop of stops) stop();
      footerDispose?.();
      flow.cancel();
      await engine?.dispose();
    };
  }
});
function historySummary(status, count) {
  return status.privacy.transcriptHistory ? `history ${count}/${20}` : "history off";
}
export {
  tui_default as default
};
