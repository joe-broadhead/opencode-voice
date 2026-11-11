// src/plugin.ts
import { homedir } from "node:os";
import { join as join6 } from "node:path";
import { fileURLToPath } from "node:url";
import { Plugin } from "@opencode/plugin";

// src/constants.ts
var PLUGIN_ID = "voice.dictation";
var COMMAND_STEM = "voice";
var ENGINE_RPC_ID = `${PLUGIN_ID}.engine`;
var NAMESPACE = "voice";
var SUPPORTED_HOST = ">=2.2.3 <2.3.0";
var TESTED_HOSTS = ["2.2.3", "2.2.4", "2.2.5", "2.2.6"];
var DEFAULT_KEYBIND_MAC = "ctrl+shift+space";
var DEFAULT_KEYBIND_OTHER = "ctrl+space";
var errorText = (code, message, nextStep2) => `${code}: ${message} Next step: ${nextStep2}`;
function voiceError(code, message, nextStep2) {
  return Object.assign(new Error(errorText(code, message, nextStep2)), { code, nextStep: nextStep2 });
}
var NEXT_STEPS = {
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
  SKILLS_INVALID: "Reinstall the plugin from github:joe-broadhead/opencode-voice#v0.0.0.",
  ENGINE_EXITED: "Run the doctor in /voice, then try again.",
  UNSUPPORTED: "Use a supported platform and engine.",
  UNCHECKED: "Call it from a session, where its approval can be answered; never from a script.",
  INPUT_INVALID: "Fix the call's input as the message says, then call it again."
};

// src/redact.ts
var SECRETS = [
  [/\b(bearer|basic|token)\s+[\w.~+/=-]{8,}/gi, "$1 [redacted]"],
  [/\b([\w-]*(?:api[_-]?key|access[_-]?key|private[_-]?key|token|secret|password|signature|credential)["']?\s*[:=]\s*)["']?[^\s"'&,;]+["']?/gi, "$1[redacted]"],
  [/\beyJ[\w-]{4,}\.[\w-]{4,}\.[\w-]{4,}/g, "[redacted]"],
  [/\b(?:tvly|sk|pk|rk|ghp|gho|ghu|ghs|ghr|github_pat|glpat|xox[abposr]|lin_api|lin_oauth)[-_][\w-]{8,}/gi, "[redacted]"],
  [/[\w+=-]{40,}/g, "[redacted]"]
];
var REASON_LIMIT = 160;
var CONTROLS = /[\u0000-\u001f\u007f-\u009f]+/g;
var BIDI = /[‎‏‪-‮⁦-⁩]/g;
var withoutUrlSecrets = (text) => text.replace(/\bhttps?:\/\/[^\s"'<>]+/gi, (url) => url.replace(/^(https?:\/\/)[^/?#@]*@/i, "$1").replace(/[?#].*$/s, ""));
var oneLine = (text) => text.replace(BIDI, "").replace(CONTROLS, " ").replace(/\s+/g, " ").trim();
function cut(text, limit) {
  const characters = Array.from(text);
  return characters.length > limit ? `${characters.slice(0, limit - 1).join("")}\u2026` : text;
}
function shortReason(text) {
  const reason = oneLine(SECRETS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), withoutUrlSecrets(text))).replace(/[.\s]+$/, "");
  if (reason === "") return void 0;
  return cut(reason, REASON_LIMIT);
}

// src/engine/errors.ts
var EngineError = class extends Error {
  code;
  next;
  constructor(code, message, next = NEXT_STEPS[code] ?? "Try again.") {
    super(errorText(code, message, next));
    this.name = "EngineError";
    this.code = code;
    this.next = next;
  }
};
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

// src/engine/release.ts
import { createHash as createHash2 } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join as join2 } from "node:path";

// src/native/install.ts
import { createHash, randomUUID } from "node:crypto";
import { constants, createReadStream, createWriteStream } from "node:fs";
import { chmod, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createGunzip } from "node:zlib";
var NativeError = class extends Error {
  code;
  next;
  constructor(code, what, next) {
    super(`${code}: ${what}`);
    this.name = "NativeError";
    this.code = code;
    this.next = next;
  }
};
var HEX64 = /^[a-f0-9]{64}$/;
var HEX40 = /^[a-f0-9]{40}$/;
var DEFAULT_STALL_MS = 12e4;
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var invalid = (what) => {
  throw new NativeError("NATIVE_MANIFEST_INVALID", `the release manifest ${what}`, "Reinstall the plugin from a release whose manifest is valid.");
};
var plain = (value, field) => {
  if (typeof value !== "string" || value === "" || value.includes("/") || value.includes("\\") || value === "." || value === "..") invalid(`has a bad file name in ${field}`);
  return value;
};
var positive = (value, field) => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) invalid(`has a bad size in ${field}`);
  return value;
};
var digest = (value, field) => {
  if (typeof value !== "string" || !HEX64.test(value)) invalid(`has a bad sha256 in ${field}`);
  return value;
};
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
var nameOf = (options) => entryFor(options).name;
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

// src/engine/platform.ts
var MINIMUM_ENGINE = "0.0.24";
var MODULE = "aurum";
function platformKey(platform = process.platform, arch = process.arch) {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "linux" && arch === "x64") return "linux-x64-gnu";
  if (platform === "linux" && arch === "arm64") return "linux-arm64-gnu";
  return void 0;
}
var platformLabel = (platform = process.platform, arch = process.arch) => `${platform}-${arch}`;

// src/engine/release.ts
var INSTALL_COMMAND = "/voice-install";
var CODE_FOR = {
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

// src/host-version.ts
var RELEASE = /^(\d+)\.(\d+)\.(\d+)$/;
var parse = (version) => RELEASE.exec(version)?.slice(1).map(Number);
var [LOWEST, ABOVE] = SUPPORTED_HOST.split(" ").map((bound) => parse(bound.replace(/^[<>]=?/, "")));
var compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
function isSupportedHost(version) {
  const parts2 = parse(version);
  return parts2 !== void 0 && compare(parts2, LOWEST) >= 0 && compare(parts2, ABOVE) < 0;
}

// src/version.ts
var VERSION = "0.0.0";

// src/status.ts
var view = (asset) => asset === void 0 ? null : { name: asset.name, bytes: asset.bytes, licence: asset.licence, state: asset.state, path: asset.path };
var modelOf = (models, role) => models?.find((asset) => asset.role === role);
function buildStatus(facts) {
  const engine = facts.engine;
  const models = facts.models;
  const stt = modelOf(models, "stt");
  const tts = modelOf(models, "tts-model");
  const microphone = facts.microphone ?? "unknown";
  const problems = [...facts.problems ?? []];
  if (facts.setup !== void 0) problems.unshift(facts.setup.message);
  if (facts.engineError !== void 0) problems.unshift(facts.engineError.message);
  const outside = facts.host.version !== null && !isSupportedHost(facts.host.version);
  const conflict = facts.keybindConflict !== void 0;
  const state = conflict ? "conflict" : outside ? "host_untested" : facts.engineError !== void 0 ? "failed" : engine === void 0 ? "not_configured" : facts.probe !== void 0 && !facts.probe.compatible ? "failed" : !engine.supported ? "failed" : "ready";
  return {
    version: VERSION,
    state,
    host: facts.host,
    unguardedAgents: [...facts.unguardedAgents ?? []],
    nextStep: nextStep({ facts, engine, stt, tts, microphone, problems }),
    engine: {
      installed: engine !== void 0,
      version: facts.probe?.version ?? engine?.version ?? null,
      path: engine?.path ?? null,
      verified: engine?.verified ?? false,
      compatible: facts.probe?.compatible ?? (engine?.supported ?? false),
      platform: engine?.platform ?? `${process.platform}-${process.arch}`,
      source: engine?.source ?? null
    },
    models: {
      version: facts.modelsVersion ?? null,
      stt: view(stt),
      tts: view(tts)
    },
    microphone: {
      permission: microphone,
      input: facts.input === void 0 ? null : oneLine(facts.input),
      output: facts.output === void 0 ? null : oneLine(facts.output)
    },
    dictation: {
      keybind: facts.keybind,
      submit: facts.options.submit,
      lastLatencyMs: facts.lastLatencyMs ?? null
    },
    tools: facts.tools ?? { registered: 0, readable: 0 },
    providers: { stt: "local", tts: "local" },
    privacy: {
      audioLeavesMachine: false,
      keepRecordings: false,
      transcriptHistory: facts.options.keepTranscripts
    },
    problems
  };
}
function nextStep(input) {
  const { facts, engine, stt, tts, microphone } = input;
  if (facts.keybindConflict !== void 0) {
    return `The key ${facts.keybindConflict.key} is also used by ${facts.keybindConflict.command}; set another keybind option.`;
  }
  if (facts.setup !== void 0) return facts.setup.next;
  if (facts.engineError !== void 0) return facts.engineError.next;
  if (engine === void 0) return NEXT_STEPS.ENGINE_MISSING;
  if (!engine.supported) return NEXT_STEPS.UNSUPPORTED_PLATFORM;
  if (!engine.verified && engine.source === "download") return NEXT_STEPS.ENGINE_UNVERIFIED;
  if (facts.probe !== void 0 && !facts.probe.compatible) {
    if (facts.probe.olderSystem !== void 0) {
      return `The speech engine needs ${facts.probe.olderSystem} from this system's libraries, which are older. Use Ubuntu 24.04, Debian 13 or a newer system.`;
    }
    if (facts.probe.missingLibrary !== void 0) {
      return `The speech engine cannot load ${facts.probe.missingLibrary}. Install the ALSA runtime (libasound2; libasound2t64 on Ubuntu 24.04), then run /voice-status.`;
    }
    return NEXT_STEPS.ENGINE_INCOMPATIBLE;
  }
  if (stt === void 0 || stt.state === "missing" || tts === void 0 || tts.state === "missing") {
    return "Run /voice-install to download the speech models.";
  }
  if (microphone === "denied" || microphone === "restricted") return NEXT_STEPS.MIC_DENIED;
  if (microphone === "not_determined") return "Run /voice-dictate once and allow microphone access.";
  if (microphone === "unknown") return "Run the doctor in /voice to check the microphone.";
  const failed = facts.doctor?.find((check) => !check.ok);
  if (failed !== void 0) return failed.next === void 0 ? "Run the doctor in /voice." : oneLine(failed.next);
  if (facts.problems !== void 0 && facts.problems.length > 0) return "Open /voice for the problem and its next step.";
  return "Nothing to do.";
}
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
function compactStatus(status) {
  const missing = [status.models.stt, status.models.tts].filter((model) => model === null || model.state === "missing").length;
  return [
    `Voice ${status.version} on OpenCode ${status.host.version ?? "unknown"} (${status.state}).`,
    `Engine: ${status.engine.installed ? `${status.engine.version ?? "unknown"} ${status.engine.verified ? "verified" : "unverified"}` : "not installed"}; models: ${missing === 0 ? "ready" : `${missing} missing`}; microphone: ${status.microphone.permission.replace("_", " ")}.`,
    `Privacy: on-device only; recordings are not kept.`,
    `Next step: ${status.nextStep}`
  ].join("\n");
}
function statusSummary(status) {
  const missing = [status.models.stt, status.models.tts].filter((model) => model === null || model.state === "missing").length;
  return {
    state: status.state,
    nextStep: status.nextStep,
    unguardedAgents: status.unguardedAgents.length,
    engine: { installed: status.engine.installed, verified: status.engine.verified, version: status.engine.version },
    models: { missing },
    microphone: status.microphone.permission
  };
}
function unavailable(error) {
  void error;
  return {
    code: "STATUS_UNAVAILABLE",
    message: errorText("STATUS_UNAVAILABLE", "The voice status could not be read.", NEXT_STEPS.STATUS_UNAVAILABLE),
    nextStep: NEXT_STEPS.STATUS_UNAVAILABLE
  };
}
var STATUS_OUTPUT = {
  type: "object",
  properties: {
    version: { type: "string" },
    state: { type: "string", enum: ["ready", "not_configured", "failed", "host_untested", "conflict"] },
    host: {
      type: "object",
      properties: { version: { type: ["string", "null"] }, range: { type: "string" }, tested: { type: "boolean" } },
      required: ["version", "range", "tested"]
    },
    unguardedAgents: { type: "array", items: { type: "string" } },
    nextStep: { type: "string" },
    engine: { type: "object" },
    models: { type: "object" },
    microphone: { type: "object" },
    dictation: { type: "object" },
    tools: { type: "object" },
    providers: { type: "object" },
    privacy: { type: "object" },
    problems: { type: "array", items: { type: "string" } }
  },
  required: ["version", "state", "host", "unguardedAgents", "nextStep", "engine", "models", "microphone", "dictation", "tools", "providers", "privacy", "problems"]
};

// src/commands.ts
function registerCommands(ctx, hooks) {
  const post = (sessionID, text, description) => ctx.session.synthetic({ sessionID, text, description, resume: false });
  const registration = ctx.command.transform((editor) => {
    editor.add({
      name: `${COMMAND_STEM}-status`,
      description: "Show the voice engine, models, microphone and the one next step",
      execute: async ({ sessionID }) => {
        const text = await hooks.status().then(formatStatus, (error) => unavailable(error).message);
        await post(sessionID, text, "Voice status");
      }
    });
    editor.add({
      name: `${COMMAND_STEM}-install`,
      description: "Download and verify the pinned speech engine and the speech models",
      execute: async ({ sessionID }) => {
        const controller = new AbortController();
        const text = await hooks.install(sessionID, controller.signal).then(
          (result) => result.downloaded.length === 0 ? "The speech engine and every speech model are already installed and verified." : `Installed ${result.downloaded.join(", ")} (${Math.round(result.bytes / (1024 * 1024))} MB), verified against their pinned hashes.`,
          (error) => asEngineError(error).message
        );
        await post(sessionID, text, "Voice install");
      }
    });
  });
  return registration.then((registration2) => registration2.dispose);
}
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

// src/engine/assets.ts
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
    const { readFile: readFile4 } = await import("node:fs/promises");
    return createHash3("sha256").update(await readFile4(path)).digest("hex");
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
    const { readFile: readFile4 } = await import("node:fs/promises");
    let raw;
    try {
      raw = JSON.parse(await readFile4(this.input.manifestPath, "utf8"));
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

// src/engine/binary.ts
import { spawn } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { resolve } from "node:path";
function resolveEngine(input) {
  const platform = input.platform ?? process.platform;
  const arch = input.arch ?? process.arch;
  const env = input.env ?? process.env;
  const label = platformLabel(platform, arch);
  const version = pinnedVersion(input.packageRoot);
  const candidate = (path, source, verified) => ({
    path,
    version,
    source,
    verified,
    platform: label,
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
  if (key === void 0) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no speech engine for ${label}.`);
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
  if (entry === void 0) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${label}.`);
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
var parts = (version) => version.split(".").map(Number);
function isCompatibleEngine(version) {
  if (version === void 0) return false;
  const [major = 0, minor = 0, patch = 0] = parts(version);
  const [minMajor = 0, minMinor = 0, minPatch = 0] = parts(MINIMUM_ENGINE);
  if (major !== minMajor) return major > minMajor;
  if (minor !== minMinor) return minor > minMinor;
  return patch >= minPatch;
}
var PROBE_TIMEOUT = 5e3;
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

// src/engine/doctor.ts
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
function microphonePermission(checks) {
  const check = checks.find((entry) => entry.id === "microphone" || entry.id === "mic");
  if (check === void 0) return "unknown";
  const text = `${check.detail} ${check.next ?? ""}`.toLowerCase();
  if (/not determined|notdetermined|not yet/.test(text)) return "not_determined";
  if (/denied/.test(text)) return "denied";
  if (/restricted/.test(text)) return "restricted";
  if (check.ok || /authorized|granted/.test(text)) return "authorized";
  return "unknown";
}
function deviceName(checks, id) {
  const check = checks.find((entry) => entry.id === id);
  if (check === void 0) return null;
  const detail = check.detail.trim();
  return detail === "" ? null : detail.slice(0, 120);
}

// src/engine/index.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { mkdir as mkdir3, readFile as readFile2, rm as rm3, writeFile } from "node:fs/promises";
import { join as join4 } from "node:path";

// src/engine/play.ts
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
          const record2 = event;
          let dbfs;
          if (typeof record2.level_dbfs === "number") dbfs = record2.level_dbfs;
          else if (record2.type === "level" && typeof record2.rms === "number") {
            dbfs = record2.rms <= 0 ? Number.NEGATIVE_INFINITY : 20 * Math.log10(record2.rms);
          }
          if (dbfs === void 0) return;
          const at = typeof record2.t_ms === "number" ? record2.t_ms : void 0;
          const delta = at !== void 0 && lastT !== void 0 ? Math.min(1e3, Math.max(20, at - lastT)) : typeof record2.level_dbfs === "number" ? 20 : 100;
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
  const view2 = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let format;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = tag(bytes, offset);
    const declared = view2.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === "fmt ") {
      if (declared < 16 || body + 16 > bytes.length) throw bad("The WAV header is damaged.");
      format = {
        code: view2.getUint16(body, true),
        channels: view2.getUint16(body + 2, true),
        rate: view2.getUint32(body + 4, true),
        bits: view2.getUint16(body + 14, true)
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
        const sample = Math.abs(view2.getInt16(body + index * 2, true)) / 32768;
        if (sample > peak) peak = sample;
      }
      for (let start = 0; start < samples; start += frameSamples) {
        const end = Math.min(samples, start + frameSamples);
        let sum = 0;
        for (let index = start; index < end; index += 1) {
          const sample = view2.getInt16(body + index * 2, true) / 32768;
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

// src/host/permissions.ts
var ACCESS_VALUES = ["all", "ask-changes", "read-only"];
var TOOL_CLASSES = { voice_status: "read", voice_speak: "write" };
var accessEffect = (cls, access) => cls === "read" ? "allow" : access === "ask-changes" ? "ask" : access === "read-only" ? "deny" : "allow";
var defaultRules = (access = "all") => [
  { action: "voice_*", resource: "*", effect: access === "all" ? "allow" : access === "ask-changes" ? "ask" : "deny" },
  ...Object.entries(TOOL_CLASSES).map(([action, cls]) => ({ action, resource: "*", effect: accessEffect(cls, access) }))
];
var BASE_ALLOW = { action: "*", resource: "*", effect: "allow" };
var same = (left, right) => left.action === right.action && left.resource === right.resource && left.effect === right.effect;
function hasDefaultRules(rules, access = "all") {
  const base = rules.findIndex((rule) => same(rule, BASE_ALLOW));
  if (base === -1) return false;
  const block = defaultRules(access);
  return rules.some((_, start) => start > base && block.every((rule, offset) => rules[start + offset] !== void 0 && same(rules[start + offset], rule)));
}
function insertDefaultRules(rules, access = "all") {
  if (hasDefaultRules(rules, access)) return;
  let base = rules.findIndex((rule) => same(rule, BASE_ALLOW));
  if (base === -1) return;
  for (const value of ACCESS_VALUES) {
    if (value === access) continue;
    const stale = defaultRules(value);
    for (let start = 0; start + stale.length <= rules.length; start += 1) {
      if (stale.every((rule, offset) => same(rules[start + offset], rule))) {
        rules.splice(start, stale.length);
        break;
      }
    }
  }
  base = rules.findIndex((rule) => same(rule, BASE_ALLOW));
  rules.splice(base + 1, 0, ...defaultRules(access).map((rule) => ({ ...rule })));
}
var matches = (pattern, value) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`).test(value);
function evaluate(rules, action) {
  return rules.findLast((rule) => matches(rule.action, action))?.effect ?? "ask";
}
var UNNAMED = "voice_new_tool";
var unguardedAgents = (agents, access = "all") => agents.filter((agent) => agent.permissions.some((rule) => same(rule, BASE_ALLOW)) && !hasDefaultRules(agent.permissions, access) && evaluate(agent.permissions, UNNAMED) === "allow").map((agent) => agent.id);
function registerDefaultRules(agent, access = "all") {
  return agent.transform((editor) => {
    for (const { id } of editor.list()) editor.update(id, (info) => void insertDefaultRules(info.permissions, access));
  });
}

// src/host/skills.ts
import { readFile as readFile3 } from "node:fs/promises";
import { join as join5 } from "node:path";
var SKILL_ID = "voice";
async function loadSkill(packageRoot, warn = console.warn) {
  const path = join5(packageRoot, "skills", SKILL_ID, "SKILL.md");
  try {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(await readFile3(path, "utf8"));
    const fields = {};
    for (const line of (match?.[1] ?? "").split(/\r?\n/)) {
      const field = /^(\w+):\s*(.+?)\s*$/.exec(line);
      if (field !== null) fields[field[1]] = field[2];
    }
    if (match === null || fields.name !== SKILL_ID || !fields.description) throw new Error("expected front matter with name and description");
    return { id: SKILL_ID, name: SKILL_ID, description: fields.description, path, content: match[2].trim(), autoinvoke: true };
  } catch {
    warn(errorText("SKILLS_INVALID", `The skill ${SKILL_ID} is missing or malformed, so it was skipped.`, NEXT_STEPS.SKILLS_INVALID));
    return void 0;
  }
}
function skillTransform(skill) {
  return (editor) => {
    if (skill !== void 0) editor.add(skill);
  };
}

// src/host/tools.ts
var TOOL_NAMES = ["status", "speak"];
var actionOf = (name) => `${NAMESPACE}_${name}`;
var EMPTY = { type: "object", properties: {}, additionalProperties: false };
var SPEAK = {
  type: "object",
  properties: {
    text: { type: "string", minLength: 1, maxLength: 5e3, description: "The text to read aloud." }
  },
  required: ["text"],
  additionalProperties: false
};
var OUTPUT = { type: "object" };
var DESCRIPTIONS = {
  status: "Report the local voice engine: whether it is installed and verified, the speech models and their cache state, microphone permission, the dictation key and the one next step. It reads nothing and speaks nothing.",
  speak: 'Read text aloud on this machine with the local voice. It does not send anything to a model and keeps nothing. It runs without asking by default; with access "ask-changes" it asks first.'
};
async function runVoiceTool(input, name, raw, call) {
  if (name === "speak") {
    if (call === void 0) {
      throw voiceError("UNCHECKED", "Speaking was called with nothing to check its permission against.", "Call it from a session, where the approval can be answered.");
    }
    await input.assert({
      sessionID: call.sessionID,
      agent: call.agent,
      action: actionOf(name),
      resources: ["*"],
      source: { type: "tool", messageID: call.messageID, id: call.id }
    });
  }
  const args = typeof raw === "object" && raw !== null ? raw : {};
  if (name === "status") {
    const status = await input.status();
    return {
      output: statusSummary(status),
      text: compactStatus(status)
    };
  }
  const text = args.text;
  if (typeof text !== "string" || text.trim() === "") throw voiceError("INPUT_INVALID", "There is nothing to read aloud.", "Pass the text to speak, in the text field.");
  if (text.length > 5e3) throw voiceError("INPUT_INVALID", "The text is longer than 5,000 characters.", "Speak it in shorter pieces, or raise the limit in a later release.");
  const speech = await input.engine.synthesize(text, { markdown: false });
  try {
    await input.engine.play(speech.path);
  } finally {
    await input.engine.release(speech.path);
  }
  return {
    output: { played: true, seconds: Math.round(speech.durationMs / 100) / 10, voice: speech.voice },
    text: `Read ${Math.max(1, Math.round(speech.durationMs / 1e3))} s aloud.`
  };
}
function toolTransform(input) {
  return (editor) => {
    editor.namespace({
      name: NAMESPACE,
      description: "Local voice, powered by Aurum: report the engine and speak text aloud. Dictation happens in the terminal UI (a key or /voice-dictate), not through a tool. Audio and transcripts stay on this machine, and a recording is never kept. File transcription is not this plugin: use utilities_speech_transcribe."
    });
    for (const name of TOOL_NAMES) {
      editor.add({
        name,
        description: DESCRIPTIONS[name],
        input: name === "status" ? EMPTY : SPEAK,
        output: OUTPUT,
        options: { namespace: NAMESPACE, permission: actionOf(name) },
        execute: async (value, context) => {
          const result = await runVoiceTool(input, name, value, {
            sessionID: context.sessionID,
            agent: context.agent,
            messageID: context.messageID,
            id: context.id
          });
          return { output: result.output, content: result.text };
        }
      });
    }
  };
}
var CLASS_OF = { status: "read", speak: "write" };
function ownedMethods(input) {
  return TOOL_NAMES.map((name) => ({
    kind: "plugin",
    class: CLASS_OF[name],
    name: actionOf(name),
    action: actionOf(name),
    description: DESCRIPTIONS[name],
    input: name === "status" ? EMPTY : SPEAK,
    output: OUTPUT,
    run: (value, call) => runVoiceTool(input, name, value, call).then((result) => result.output)
  }));
}

// src/host/tools-rpc.ts
import { randomUUID as randomUUID4 } from "node:crypto";
import { Rpc } from "@opencode/plugin/rpc";
var PLUGIN_ID2 = "voice.dictation";
var METHODS = [];
function shapeInput(_method, input, _call) {
  return input;
}
function shapeResult(_method, result, _call) {
  return result;
}
var NEXT_STEPS2 = {
  SESSION_UNKNOWN: `Create a session in the location you mean, such as POST /api/session with {"agent":"build"} sent with the header "x-opencode-directory: <dir>" or the location[directory] query, and pass its id.`,
  SESSION_AGENT_REQUIRED: `Create a session that names an agent this project has, with its project as the location, such as POST /api/session with {"agent":"build","location":{"directory":"/path/to/project"}}, and pass its id.`,
  PERMISSION_DENIED: "Add an allow rule for the tool to the session's agent or to the session, or use a session whose agent allows it.",
  CANCELLED: "Call the method again if you still need the result."
};
function pluginError(error) {
  if (typeof error !== "object" || error === null) return void 0;
  const code = error.code;
  const next = error.next;
  const message = error instanceof Error ? error.message : void 0;
  if (typeof code !== "string" || typeof next !== "string" || message === void 0) return void 0;
  const what = message.replace(new RegExp(`^${code}: `), "").replace(/ Next step: [\s\S]*$/, "");
  return { code, what, next };
}
var TOOLS_RPC_ID = `${PLUGIN_ID2}.tools`;
var CLASSES = ["read", "write", "send", "export", "destructive"];
var MCP_ONLY = ["SERVER_CONFLICT", "AUTH_REQUIRED", "CONNECTING", "CONNECTION_FAILED", "DISABLED", "NOT_REGISTERED", "TOOL_UNAVAILABLE", "UPSTREAM_ERROR"];
var UNATTENDED = "A script cannot answer an approval prompt; this needs an allow rule for the session's agent.";
var MESSAGE_ID = "msg_script";
var UPSTREAM_LIMIT = 300;
var LOCATION_HEADER = "x-opencode-directory";
var LOCATION_HINT = `Send the call to the location you mean: run it in that project with "opencode api ... -H \\"${LOCATION_HEADER}:$PWD\\"", or pass the location[directory] query parameter to the HTTP request.`;
var object = (properties, required) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false
});
var STRING = { type: "string" };
var ANY_OBJECT = { type: "object" };
var FAILED = object({ code: STRING, next: STRING }, ["code", "next"]);
var mcpOutput = (output = {}) => object({ output, text: STRING }, ["text"]);
var DESCRIBED = object(
  {
    name: STRING,
    tool: STRING,
    kind: { type: "string", enum: ["mcp", "plugin"] },
    class: { type: "string", enum: [...CLASSES] },
    action: STRING,
    description: STRING,
    available: { type: "boolean" },
    reason: STRING,
    detail: STRING,
    permission: { type: "string", enum: ["allow", "ask", "deny"] },
    input: ANY_OBJECT,
    output: ANY_OBJECT
  },
  ["name", "tool", "kind", "class", "action", "description", "available", "input", "output"]
);
var DESCRIPTION = object(
  {
    id: STRING,
    call: STRING,
    location: STRING,
    locationHint: STRING,
    methods: { type: "array", items: DESCRIBED },
    unclassified: { type: "array", items: STRING }
  },
  ["id", "call", "location", "locationHint", "methods"]
);
var plainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var ENVELOPE_MESSAGES = {
  notObject: `the envelope must be an object, such as {"sessionID":"<session>","input":<the tool's input>}`,
  unknownKey: (key) => `"${key}" is not allowed`,
  sessionID: `"sessionID" must be a non-empty string`,
  account: `"account" must be a non-empty string`,
  inputMissing: `"input" is missing`,
  inputNotObject: `"input" must be an object`,
  describe: `describe takes nothing, or {"sessionID":"<session>"}`
};
var standard = (schema, validate) => Object.defineProperty({ ...schema }, "~standard", { value: { version: 1, vendor: "tools-rpc", validate }, enumerable: false });
var DESCRIBE_INPUT = standard(
  object({ sessionID: { type: "string", minLength: 1 } }, []),
  (value) => {
    if (value === void 0 || value === null) return { value: {} };
    if (!plainObject(value)) return { issues: [{ message: ENVELOPE_MESSAGES.describe }] };
    const issues = [
      ...Object.keys(value).filter((key) => key !== "sessionID").map(ENVELOPE_MESSAGES.unknownKey),
      ...value["sessionID"] === void 0 || typeof value["sessionID"] === "string" && value["sessionID"] !== "" ? [] : [ENVELOPE_MESSAGES.sessionID]
    ];
    return issues.length === 0 ? { value } : { issues: issues.map((message) => ({ message })) };
  }
);
function strict(schema, issues) {
  const keys = Object.keys(schema["properties"]);
  return standard(schema, (value) => {
    if (!plainObject(value)) return { issues: [{ message: ENVELOPE_MESSAGES.notObject }] };
    const found = [...Object.keys(value).filter((key) => !keys.includes(key)).map(ENVELOPE_MESSAGES.unknownKey), ...issues(value)];
    return found.length === 0 ? { value } : { issues: found.map((message) => ({ message })) };
  });
}
var ScriptError = class extends Error {
  failure;
  constructor(failure) {
    super(`${failure.code}: ${failure.what.replace(/[.\s]+$/, "")}. Next step: ${failure.next}`);
    this.failure = failure;
  }
};
var fail2 = (code, what) => {
  const next = NEXT_STEPS2[code];
  if (next === void 0) throw new Error(`tools-rpc: NEXT_STEPS.${code} is missing`);
  return new ScriptError({ code, what, next });
};
var conflictNext = (server) => NEXT_STEPS2.SERVER_CONFLICT ?? `Remove your own "${server}" server from opencode.json so that the plugin manages it, then run "opencode reload".`;
var record = (value) => typeof value === "object" && value !== null;
function notFound(error, tags) {
  if (!record(error)) return false;
  const tag2 = error["_tag"] ?? error["name"];
  return typeof tag2 === "string" && tags.includes(tag2) || error["status"] === 404 || error["statusCode"] === 404;
}
var toolError = (error) => record(error) && error["_tag"] === "Tool.Error";
var requestAction = (cause) => {
  const request = record(cause) ? cause["request"] : void 0;
  return record(request) && typeof request["action"] === "string" && request["action"] !== "" ? request["action"] : void 0;
};
var deniedAction = (message) => /^Permission denied: ([\w.:-]*[\w-])\.?\s*$/.exec(message.split(/\r?\n/, 1)[0] ?? "")?.[1];
var wildcard = (pattern, value) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`).test(value);
var evaluate2 = (rules, action) => rules.findLast((rule) => wildcard(rule.action, action) && wildcard(rule.resource, "*"))?.effect ?? "ask";
var hidden = (rules, action) => evaluate2(rules, action) === "deny";
var SECRETS2 = [
  [/\b(bearer|basic|token)\s+[\w.~+/=-]{8,}/gi, "$1 [redacted]"],
  [/\b([\w-]*(?:api[_-]?key|access[_-]?key|private[_-]?key|token|secret|password|signature|credential)["']?\s*[:=]\s*)["']?[^\s"'&,;]+["']?/gi, "$1[redacted]"],
  [/\beyJ[\w-]{4,}\.[\w-]{4,}\.[\w-]{4,}/g, "[redacted]"],
  [/\b(?:tvly|sk|pk|rk|ghp|gho|ghu|ghs|ghr|github_pat|glpat|xox[abposr]|lin_api|lin_oauth)[-_][\w-]{8,}/gi, "[redacted]"],
  [/[\w+=-]{40,}/g, "[redacted]"]
];
var withoutQuery = (text) => text.replace(/\bhttps?:\/\/[^\s"'<>()]+/gi, (url) => {
  const cut2 = url.search(/[?#]/);
  return cut2 === -1 ? url : `${url.slice(0, cut2)}?[redacted]`;
});
function upstreamText(text) {
  const line = text.split(/\r?\n/).find((part) => part.trim() !== "")?.trim() ?? "no message";
  const redacted = SECRETS2.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), withoutQuery(line));
  return redacted.length <= UPSTREAM_LIMIT ? redacted : `${redacted.slice(0, UPSTREAM_LIMIT - 1)}\u2026`;
}
var jsonSchema = (schema) => record(schema) && !("ast" in schema) && !("~standard" in schema) ? schema : void 0;
function normalise(result) {
  const text = typeof result.content === "string" ? result.content : (result.content ?? []).flatMap((part) => part.type === "text" ? [part.text] : []).join("\n");
  return result.output === void 0 ? { text } : { output: result.output, text };
}
function connection(status) {
  switch (status) {
    case "connected":
      return void 0;
    case "pending":
      return "CONNECTING";
    case "needs_auth":
      return "AUTH_REQUIRED";
    case "failed":
      return "CONNECTION_FAILED";
    case "disabled":
      return "DISABLED";
    default:
      return "NOT_REGISTERED";
  }
}
var STATUS_TEXT = {
  CONNECTING: "is still connecting",
  AUTH_REQUIRED: "needs a sign-in",
  CONNECTION_FAILED: "could not connect",
  DISABLED: "is disabled",
  NOT_REGISTERED: "is not registered"
};
async function registerToolsRpc(ctx, options) {
  const { mcp, methods } = options;
  const shapeIn = options.shapers?.input ?? shapeInput;
  const shapeOut = options.shapers?.result ?? shapeResult;
  const accounts = typeof mcp?.server === "function";
  const anyMcp = methods.some((method) => method.kind === "mcp");
  if (anyMcp && !mcp) throw new Error("registerToolsRpc: an MCP method needs the mcp option");
  if (accounts && NEXT_STEPS2.ACCOUNT_UNKNOWN === void 0) throw new Error("registerToolsRpc: per-account servers need NEXT_STEPS.ACCOUNT_UNKNOWN");
  const missing = anyMcp ? MCP_ONLY.find((code) => code !== "SERVER_CONFLICT" && NEXT_STEPS2[code] === void 0) : void 0;
  if (missing) throw new Error(`registerToolsRpc: MCP methods need NEXT_STEPS.${missing}`);
  const names = methods.map((method) => method.name);
  const duplicate = names.find((name, index) => name === "describe" || names.indexOf(name) !== index);
  if (duplicate) throw new Error(`registerToolsRpc: the method name "${duplicate}" is taken`);
  for (const method of methods) {
    if (!CLASSES.includes(method.class)) throw new Error(`registerToolsRpc: ${method.name} has the class "${String(method.class)}"; use one of ${CLASSES.join(", ")}`);
    if (method.kind === "plugin" && (typeof method.run !== "function" || method.action === "")) throw new Error(`registerToolsRpc: the plugin method ${method.name} needs a run function and an action`);
  }
  const live = /* @__PURE__ */ new Set();
  const refused = /* @__PURE__ */ new Map();
  const serverOf = (account) => {
    const server = typeof mcp.server === "function" ? mcp.server(account) : mcp.server;
    if (server !== void 0) return server;
    throw new ScriptError({ code: "ACCOUNT_UNKNOWN", what: `there is no account '${account}'`, next: NEXT_STEPS2.ACCOUNT_UNKNOWN });
  };
  const actionOf2 = (method, envelope2) => method.kind === "plugin" ? method.action : `${serverOf(envelope2.account)}_${method.name}`;
  const session = async (sessionID) => {
    let info;
    try {
      info = await ctx.session.get({ sessionID });
    } catch (error) {
      if (notFound(error, ["Session.NotFoundError", "SessionNotFoundError"])) throw fail2("SESSION_UNKNOWN", `there is no session '${sessionID}' in this location`);
      throw error;
    }
    if (!info.agent) throw fail2("SESSION_AGENT_REQUIRED", `session '${sessionID}' names no agent`);
    let agent;
    try {
      agent = await ctx.agent.get({ agentID: info.agent });
    } catch (error) {
      const missing2 = notFound(error, ["Agent.NotFoundError", "AgentNotFoundError"]) || error instanceof Error && error.message.startsWith("Agent not found");
      if (missing2) throw fail2("SESSION_AGENT_REQUIRED", `session '${sessionID}' names the agent '${info.agent}', which does not exist in this location`);
      throw error;
    }
    const rules = [...agent.data.permissions, ...info.permissions ?? []];
    return { agent: info.agent, rules };
  };
  const notRegistered = (server) => mcp?.notRegistered?.(server);
  const unavailable2 = async (server, tool, connected) => {
    const status = (await ctx.mcp.list()).data.find((entry) => entry.name === server)?.status.status;
    const code = connection(status) ?? connected;
    if (code === "TOOL_UNAVAILABLE") return fail2(code, `OpenCode does not list ${tool} on the connected "${server}" server`);
    if (status === "connected") return fail2(code, `the "${server}" server was reconnecting when ${tool} ran`);
    const what = `the "${server}" server ${STATUS_TEXT[code] ?? "is unavailable"}`;
    const own = code === "NOT_REGISTERED" ? notRegistered(server) : void 0;
    return own ? new ScriptError({ code: own.code, what, next: own.next }) : fail2(code, what);
  };
  const denyNext = (action, agent) => `Remove or narrow the deny rule for ${action} in the agent "${agent}" or in the session, or add a later allow rule for ${action} to the session, or use a session whose agent allows it.`;
  const denied = (action, error, asked = action) => {
    const reason = upstreamText(record(error) && typeof error["message"] === "string" ? error["message"] : String(error));
    if (asked === action) return fail2("PERMISSION_DENIED", `${action} was refused for this session's agent: ${reason}`);
    return new ScriptError({
      code: "PERMISSION_DENIED",
      what: `${action} needs ${asked}, which was refused for this session's agent: ${reason}`,
      next: `Add an allow rule for ${asked} to the session's agent or to the session, or use a session whose agent allows it.`
    });
  };
  const ruleDenied = (action, error, agent, inner = action) => {
    const reason = upstreamText(record(error) && typeof error["message"] === "string" ? error["message"] : String(error));
    const what = inner === action ? `${action} was refused by a deny rule for this session's agent: ${reason}` : `${action} needs ${inner}, which a deny rule refuses for this session's agent: ${reason}`;
    return new ScriptError({ code: "PERMISSION_DENIED", what, next: denyNext(inner, agent) });
  };
  const resolve2 = (rules, action, agent) => {
    const effect = evaluate2(rules, action);
    if (effect === "allow") return;
    if (effect === "ask")
      throw new ScriptError({
        code: "PERMISSION_DENIED",
        what: `${action} would ask for this session's agent, and a script cannot answer`,
        next: `Add an allow rule for ${action} to the session's agent or to the session, or use a session whose agent allows it.`
      });
    if (hidden(rules, action)) throw new ScriptError({ code: "PERMISSION_DENIED", what: `${action} is hidden from this session's agent by a deny rule`, next: denyNext(action, agent) });
    throw new ScriptError({ code: "PERMISSION_DENIED", what: `${action} is denied for this session's agent`, next: denyNext(action, agent) });
  };
  const mcpTarget = (method, envelope2, action, server) => ({
    action,
    method,
    async run(call) {
      if (!mcp.managed(server)) {
        throw new ScriptError({ code: "SERVER_CONFLICT", what: `the "${server}" server in your config is not the one this plugin manages`, next: conflictNext(server) });
      }
      const tool = (await ctx.tool.list()).find((entry) => entry.id === action);
      if (!tool) throw await unavailable2(server, action, "TOOL_UNAVAILABLE");
      const shaped = shapeIn(method.name, envelope2.input, { sessionID: call.sessionID, agent: call.agent, action });
      let result;
      try {
        result = await tool.execute(shaped, call);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith(`MCP server "${server}" `)) throw await unavailable2(server, action, "CONNECTING");
        throw error;
      }
      const shapedResult = shapeOut(method.name, normalise(result), { sessionID: call.sessionID, agent: call.agent, action });
      return shapedResult;
    }
  });
  const pluginTarget = (method, envelope2, action) => {
    if (accounts) serverOf(envelope2.account);
    const account = accounts && envelope2.account !== void 0 ? { account: envelope2.account } : {};
    return {
      action,
      method,
      run: async (call) => await method.run(envelope2.input, { ...call, ...account }) ?? null
    };
  };
  const targetOf = (method, envelope2) => {
    const action = actionOf2(method, envelope2);
    if (method.kind === "plugin") return pluginTarget(method, envelope2, action);
    return mcpTarget(method, envelope2, action, serverOf(envelope2.account));
  };
  const invoke = async (method, raw, context) => {
    const envelope2 = raw;
    let target;
    let id;
    let agent;
    try {
      if (context.signal.aborted) throw fail2("CANCELLED", "the call was cancelled");
      target = targetOf(method, envelope2);
      const resolved = await session(envelope2.sessionID);
      agent = resolved.agent;
      resolve2(resolved.rules, target.action, agent);
      id = `script:${randomUUID4()}`;
      const call = {
        sessionID: envelope2.sessionID,
        agent,
        messageID: MESSAGE_ID,
        id,
        signal: context.signal,
        progress: async () => {
        }
      };
      live.add(call.id);
      try {
        return JSON.parse(JSON.stringify(await target.run(call)));
      } finally {
        live.delete(call.id);
      }
    } catch (error) {
      const failure = refusal(error, target, context.signal, agent, id === void 0 ? void 0 : refused.get(id));
      if (!failure) throw error;
      return context.error("failed", new ScriptError(failure).message, { code: failure.code, next: failure.next });
    } finally {
      if (id !== void 0) refused.delete(id);
    }
  };
  const refusal = (error, target, signal, agent, seen) => {
    if (signal.aborted) return fail2("CANCELLED", "the call was cancelled").failure;
    if (error instanceof ScriptError) return error.failure;
    const own = pluginError(error);
    if (own || !target || !toolError(error)) return own;
    if (error.error !== void 0) {
      const request = requestAction(error.error);
      if (seen?.effect === "ask" || request !== void 0 || agent === void 0) return denied(target.action, error, request ?? seen?.action).failure;
      return ruleDenied(target.action, error, agent, seen?.action ?? deniedAction(error.message) ?? target.action).failure;
    }
    if (target.method.kind === "mcp") return fail2("UPSTREAM_ERROR", `${target.action} failed: ${upstreamText(error.message)}`).failure;
    return void 0;
  };
  const unclassified = async (tools) => {
    const server = serverOf(void 0);
    const prefix = `${server}_`;
    const known = new Set(methods.filter((method) => method.kind === "mcp").map((method) => method.name));
    const owned = new Set(methods.filter((method) => method.kind === "plugin").flatMap((method) => [method.name, method.action]));
    return tools.filter((tool) => tool.id.startsWith(prefix) && !known.has(tool.id.slice(prefix.length)) && !owned.has(tool.id.slice(prefix.length))).map((tool) => tool.id.slice(prefix.length)).sort();
  };
  const describe = async (raw) => {
    const input = raw ?? {};
    const resolved = input.sessionID === void 0 ? void 0 : await session(input.sessionID);
    const tools = mcp ? await ctx.tool.list() : [];
    const server = anyMcp ? serverOf(void 0) : "";
    const managed = mcp !== void 0 && server !== "" ? mcp.managed(server) : false;
    const status = managed ? (await ctx.mcp.list()).data.find((entry) => entry.name === server)?.status.status : void 0;
    const methodsOut = [];
    for (const method of methods) {
      if (method.kind === "mcp") {
        const id = `${server}_${method.name}`;
        const tool = managed ? tools.find((entry) => entry.id === id) : void 0;
        const code = !managed ? "SERVER_CONFLICT" : tool ? void 0 : connection(status) ?? "TOOL_UNAVAILABLE";
        const reason2 = code === "NOT_REGISTERED" ? notRegistered(server)?.code ?? code : code;
        const detail = code === void 0 ? void 0 : mcp.unavailableDetail?.(method.name, code);
        methodsOut.push({
          name: method.name,
          tool: id,
          kind: "mcp",
          class: method.class,
          action: id,
          description: tool?.description ?? "",
          available: reason2 === void 0,
          ...reason2 ? { reason: reason2 } : {},
          ...detail === void 0 ? {} : { detail },
          ...resolved ? { permission: evaluate2(resolved.rules, id) } : {},
          input: jsonSchema(tool?.input) ?? ANY_OBJECT,
          output: mcpOutput(jsonSchema(tool?.output))
        });
        continue;
      }
      const reason = await method.available?.();
      methodsOut.push({
        name: method.name,
        tool: method.name,
        kind: "plugin",
        class: method.class,
        action: method.action,
        description: method.description,
        available: reason === void 0,
        ...reason === void 0 ? {} : { reason },
        ...resolved ? { permission: evaluate2(resolved.rules, method.action) } : {},
        input: method.input,
        output: method.output
      });
    }
    const loose = mcp && mcp.managed(serverOf(void 0)) ? await unclassified(tools) : [];
    return JSON.parse(
      JSON.stringify({
        id: TOOLS_RPC_ID,
        call: `POST /api/rpc/${TOOLS_RPC_ID}/<method> with {"input":{"sessionID":"<session>",${accounts ? `"account":"<account>",` : ""}"input":<the tool's input>}}`,
        location: ctx.location.directory,
        locationHint: LOCATION_HINT,
        methods: methodsOut,
        ...loose.length > 0 ? { unclassified: loose } : {}
      })
    );
  };
  const envelope = (input, objectInput) => strict(
    object({ sessionID: { type: "string", minLength: 1 }, ...accounts ? { account: { type: "string", minLength: 1 } } : {}, input }, ["sessionID", "input"]),
    (value) => [
      ...typeof value["sessionID"] === "string" && value["sessionID"] !== "" ? [] : [ENVELOPE_MESSAGES.sessionID],
      ...value["account"] === void 0 || typeof value["account"] === "string" && value["account"] !== "" ? [] : [ENVELOPE_MESSAGES.account],
      ...!("input" in value) ? [ENVELOPE_MESSAGES.inputMissing] : objectInput && !plainObject(value["input"]) ? [ENVELOPE_MESSAGES.inputNotObject] : []
    ]
  );
  const contract = Rpc.define({
    id: TOOLS_RPC_ID,
    methods: {
      describe: { input: DESCRIBE_INPUT, output: DESCRIPTION, errors: { failed: FAILED } },
      ...Object.fromEntries(
        methods.map((method) => [
          method.name,
          method.kind === "mcp" ? { input: envelope(ANY_OBJECT, true), output: mcpOutput(), errors: { failed: FAILED } } : { input: envelope(method.input, false), output: method.output, errors: { failed: FAILED } }
        ])
      )
    },
    events: {}
  });
  const handlers = {
    describe: async (raw, context) => {
      try {
        return await describe(raw);
      } catch (error) {
        if (!(error instanceof ScriptError)) throw error;
        return context.error("failed", error.message, { code: error.failure.code, next: error.failure.next });
      }
    },
    ...Object.fromEntries(methods.map((method) => [method.name, (raw, context) => invoke(method, raw, context)]))
  };
  const registration = await ctx.rpc.register(contract, handlers);
  const hook = await ctx.permission.hook("evaluate", (evaluation) => {
    if (evaluation.source === void 0 || !live.has(evaluation.source.id) || evaluation.effect === "allow") return;
    refused.set(evaluation.source.id, { action: evaluation.action, effect: evaluation.effect === "ask" ? "ask" : "deny" });
    if (evaluation.effect !== "ask") return;
    evaluation.effect = "deny";
    evaluation.message = UNATTENDED;
  });
  return async () => {
    await hook.dispose().catch(() => void 0);
    await registration.dispose().catch(() => void 0);
  };
}

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
var fail3 = (field, message, next) => ({
  ok: false,
  error: { code: "OPTIONS_INVALID", field, message, next }
});
var nonEmpty = (value) => typeof value === "string" && value.trim() !== "" && !/\s/.test(value);
function parseOptions(input) {
  const raw = input ?? {};
  if (!isRecord5(raw)) return fail3("options", "Plugin options must be an object.", "Set options to an object, or remove them.");
  const unknown = Object.keys(raw).find((key) => !TOP_KEYS.includes(key));
  if (unknown !== void 0) return fail3(unknown, "This option is not supported.", `Remove it. Supported options: ${TOP_KEYS.join(", ")}.`);
  const aurumPath = raw.aurumPath;
  if (aurumPath !== void 0 && (typeof aurumPath !== "string" || aurumPath.trim() === "")) {
    return fail3("aurumPath", "Must be a non-empty path.", "Set it to the absolute path of an Aurum binary, or remove it.");
  }
  const assetsDir = raw.assetsDir;
  if (assetsDir !== void 0 && (typeof assetsDir !== "string" || assetsDir.trim() === "")) {
    return fail3("assetsDir", "Must be a non-empty path.", "Set it to a folder holding the model files, or remove it.");
  }
  const submit = raw.submit ?? "send";
  if (submit !== "send" && submit !== "review") {
    return fail3("submit", 'Must be "send" or "review".', 'Set it to "send" to submit at once, or "review" to edit first.');
  }
  const keybind = raw.keybind;
  if (keybind !== void 0 && !nonEmpty(keybind)) {
    return fail3("keybind", "Must be a key combination without spaces.", 'Set it to a combination such as "ctrl+shift+space".');
  }
  const autoSpeak = raw.autoSpeak ?? false;
  if (typeof autoSpeak !== "boolean") return fail3("autoSpeak", "Must be true or false.", "Set it to true to read every completed reply aloud.");
  const voice = raw.voice ?? "Luna";
  if (!nonEmpty(voice)) return fail3("voice", "Must be a local voice name.", "Use a name from the status dialog, such as Luna.");
  const sttModel = raw.sttModel ?? "tiny-q5_1";
  if (!nonEmpty(sttModel)) return fail3("sttModel", "Must be a model name.", "Use a name from the status dialog, such as tiny-q5_1.");
  const language = raw.language ?? "auto";
  if (typeof language !== "string" || !/^(?:auto|[a-z]{2,3}(?:-[A-Z]{2})?)$/.test(language)) {
    return fail3("language", "Must be auto or a language code such as en or pt-BR.", "Set it to auto, or an ISO language code.");
  }
  const maxRecordSeconds = raw.maxRecordSeconds ?? 120;
  if (typeof maxRecordSeconds !== "number" || !Number.isInteger(maxRecordSeconds) || maxRecordSeconds < 5 || maxRecordSeconds > 120) {
    return fail3("maxRecordSeconds", "Must be a whole number from 5 to 120.", "Set the longest recording, in seconds.");
  }
  const statusIndicator = raw.statusIndicator ?? "toast";
  if (statusIndicator !== "toast" && statusIndicator !== "footer") {
    return fail3("statusIndicator", 'Must be "toast" or "footer".', 'Leave it "toast", or set "footer" for a listening row above the prompt.');
  }
  const keepTranscripts = raw.keepTranscripts ?? false;
  if (typeof keepTranscripts !== "boolean") {
    return fail3("keepTranscripts", "Must be true or false.", "Set it to true to keep the last 20 transcripts as text.");
  }
  const allowUntestedHost = raw.allowUntestedHost ?? false;
  if (typeof allowUntestedHost !== "boolean") {
    return fail3("allowUntestedHost", "Must be true or false.", "Set it to true only to run on an OpenCode version outside the supported range.");
  }
  const access = raw.access ?? "all";
  if (access !== "all" && access !== "ask-changes" && access !== "read-only") {
    return fail3("access", 'Must be "all", "ask-changes" or "read-only".', 'Set it to "ask-changes" to be asked before each change, or "read-only" to turn changes off.');
  }
  const engine = raw.engine ?? true;
  if (typeof engine !== "boolean") {
    return fail3("engine", "Must be true or false.", "Set it to false to serve no engine RPC to a host such as hey-jelly.");
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

// src/rpc.ts
import { Rpc as Rpc2 } from "@opencode/plugin/rpc";
var string = { type: "string" };
var object2 = (properties, required) => ({ type: "object", properties, required, additionalProperties: false });
var NO_INPUT = object2({}, []);
var FAILED2 = object2({ code: string, next: string }, ["code", "next"]);
var FAILURES = { failed: FAILED2 };
var VoiceStatusRpc = Rpc2.define({
  id: PLUGIN_ID,
  methods: {
    status: { input: NO_INPUT, output: STATUS_OUTPUT, errors: { unavailable: object2({ nextStep: string }, ["nextStep"]) } }
  },
  events: {}
});
function registerStatusRpc(rpc, read) {
  const registration = rpc.register(VoiceStatusRpc, {
    status: (_input, { error }) => read().catch((cause) => {
      const failure = unavailable(cause);
      return error("unavailable", failure.message, { nextStep: failure.nextStep });
    })
  });
  return registration.then((registration2) => registration2.dispose);
}
var VERSION2 = { type: "integer", enum: [1] };
var AUDIO = { type: "string", minLength: 4, maxLength: 8 * 1024 * 1024 };
var VoiceEngineRpc = Rpc2.define({
  id: ENGINE_RPC_ID,
  methods: {
    status: { input: object2({ v: VERSION2 }, ["v"]), output: { type: "object" }, errors: FAILURES },
    warmup: { input: object2({ v: VERSION2 }, ["v"]), output: { type: "object" }, errors: FAILURES },
    transcribe: {
      input: object2({ v: VERSION2, audio: AUDIO, mime: { type: "string", enum: ["audio/wav"] }, language: string }, ["v", "audio", "mime"]),
      output: { type: "object" },
      errors: FAILURES
    },
    synthesize: {
      input: object2({ v: VERSION2, text: { type: "string", minLength: 1, maxLength: 5e3 }, markdown: { type: "boolean" }, rate: { type: "number", minimum: 0.5, maximum: 2 } }, ["v", "text"]),
      output: { type: "object" },
      errors: FAILURES
    },
    cancel: { input: object2({ v: VERSION2 }, ["v"]), output: { type: "object" }, errors: FAILURES }
  },
  events: {}
});
var BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
function decodeAudio(value) {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 !== 0 || !BASE64.test(value)) {
    throw new EngineError("BAD_AUDIO", "audio must be a base64 string.");
  }
  return Buffer.from(value, "base64");
}
var failureOf = (error) => {
  const failure = asEngineError(error);
  return { code: failure.code, next: failure.next, message: failure.message };
};
function registerEngineRpc(rpc, deps) {
  const fail4 = (error, respond) => {
    const failure = failureOf(error);
    return respond("failed", failure.message, { code: failure.code, next: failure.next });
  };
  const registration = rpc.register(VoiceEngineRpc, {
    status: async () => {
      const status = await deps.status();
      return {
        v: 1,
        ready: status.state === "ready",
        stt: { provider: status.providers.stt, model: status.models.stt?.name ?? "", language: "auto" },
        tts: { provider: status.providers.tts, model: status.models.tts?.name ?? "", voice: "" },
        models: status.models,
        caps: ["transcribe", "synthesize", "warmup", "cancel", ...deps.engine.caps.includes("synthesize_speaking_rate") ? ["synthesize_speaking_rate"] : []],
        problems: status.problems
      };
    },
    warmup: async (_input, { error }) => {
      try {
        const result = await deps.engine.warmup();
        return { v: 1, ready: result.ready, state: result.state };
      } catch (cause) {
        return fail4(cause, error);
      }
    },
    transcribe: async (input, { error }) => {
      try {
        const value = input;
        const bytes = decodeAudio(value.audio);
        readWav(bytes);
        const started = performance.now();
        const result = await deps.engine.transcribeBytes(bytes);
        return {
          v: 1,
          text: result.text,
          silent: result.silent,
          ms: Math.round(performance.now() - started),
          provider: result.provider,
          model: result.model
        };
      } catch (cause) {
        return fail4(cause, error);
      }
    },
    synthesize: async (input, { error }) => {
      try {
        const value = input;
        if (typeof value.text !== "string" || value.text.trim() === "") throw new EngineError("BAD_AUDIO", "text must be a non-empty string.");
        if (value.text.length > 5e3) throw new EngineError("AUDIO_TOO_LONG", "text is longer than 5,000 characters.");
        const rate = typeof value.rate === "number" ? value.rate : void 0;
        const speech = await deps.engine.synthesize(value.text, { ...value.markdown === true ? { markdown: true } : {}, ...rate === void 0 ? {} : { rate } });
        try {
          const { readFile: readFile4 } = await import("node:fs/promises");
          const audio = (await readFile4(speech.path)).toString("base64");
          return {
            v: 1,
            audio,
            mime: "audio/wav",
            spokenText: speech.spoken,
            truncated: speech.spoken.length < value.text.trim().length
          };
        } finally {
          await deps.engine.release(speech.path);
        }
      } catch (cause) {
        return fail4(cause, error);
      }
    },
    cancel: async () => {
      deps.engine.cancel();
      return { v: 1 };
    }
  });
  return registration.then((registration2) => registration2.dispose);
}

// src/plugin.ts
var PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
var DEFAULT_KEYBIND = process.platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER;
var keybindOf = (options) => options.keybind ?? DEFAULT_KEYBIND;
var isEngineError = (error) => error instanceof EngineError;
var FALLBACK_OPTIONS = {
  submit: "send",
  autoSpeak: false,
  voice: "Luna",
  sttModel: "tiny-q5_1",
  language: "auto",
  maxRecordSeconds: 120,
  statusIndicator: "toast",
  keepTranscripts: false,
  allowUntestedHost: false,
  engine: true,
  access: "all"
};
var plugin_default = Plugin.define({
  id: PLUGIN_ID,
  async setup(ctx) {
    const parsed = parseOptions(ctx.options);
    const supported = isSupportedHost(ctx.app.version);
    const host = { version: ctx.app.version === "" ? null : ctx.app.version, range: SUPPORTED_HOST, tested: TESTED_HOSTS.includes(ctx.app.version) };
    const setup = parsed.ok === false ? { code: "OPTIONS_INVALID", message: `Option ${parsed.error.field}: ${parsed.error.message}`, next: parsed.error.next } : !supported && !parsed.options.allowUntestedHost ? {
      code: "HOST_UNTESTED",
      message: `OpenCode ${ctx.app.version || "of an unknown version"} is outside the supported range ${SUPPORTED_HOST}, so Voice is in status-only mode.`,
      next: `Use OpenCode ${SUPPORTED_HOST}, or set "allowUntestedHost": true.`
    } : void 0;
    const options = parsed.ok ? parsed.options : void 0;
    const enabled = setup === void 0 && options !== void 0;
    const cacheRoot = defaultCacheRoot(homedir(), process.platform);
    const engineCacheDir = join6(cacheRoot, "engine");
    let probe;
    const probeFor = async (info) => {
      if (probe !== void 0 && Date.now() - probe.at < 3e4) return probe;
      const [version, check] = await Promise.all([
        probeEngine(info.path),
        runDoctor(info.path, { cacheDir: engineCacheDir }).catch(() => void 0)
      ]);
      probe = { at: Date.now(), check, version };
      return probe;
    };
    const engineInfo = (() => {
      if (!enabled) return void 0;
      try {
        return resolveEngine({
          packageRoot: PACKAGE_ROOT,
          cacheRoot,
          ...options?.aurumPath === void 0 ? {} : { optionPath: options.aurumPath }
        });
      } catch (error) {
        return { error };
      }
    })();
    const modelStore = options === void 0 ? void 0 : new ModelStore({
      cacheRoot,
      manifestPath: process.env.VOICE_MODELS_MANIFEST ?? join6(PACKAGE_ROOT, "manifest", "models.json"),
      ...options.assetsDir === void 0 ? {} : { assetsDir: options.assetsDir }
    });
    const engine = engineInfo === void 0 || "error" in engineInfo || options === void 0 ? void 0 : new SpeechEngine({
      bin: engineInfo.path,
      model: options.sttModel,
      language: options.language,
      cacheRoot,
      voice: options.voice,
      maxRecordSeconds: options.maxRecordSeconds,
      ...modelStore === void 0 ? {} : {
        preflight: (role) => modelStore.verifyRoles(role === "stt" ? ["stt"] : ["tts-model", "tts-voices", "tts-config"])
      }
    });
    const agents = async () => ctx.agent.list(ctx.location === void 0 ? void 0 : { location: { directory: ctx.location.directory } }).then(
      (found) => found.data,
      () => []
    );
    const readStatus = async () => {
      const list = await agents();
      const info = engineInfo !== void 0 && !("error" in engineInfo) ? engineInfo : void 0;
      const manifest = modelStore === void 0 ? void 0 : await modelStore.manifest().catch(() => void 0);
      const models = modelStore === void 0 ? void 0 : await modelStore.inspect().catch(() => void 0);
      const live = info === void 0 ? void 0 : await probeFor(info);
      const action = options ?? FALLBACK_OPTIONS;
      return buildStatus({
        host,
        ...info === void 0 ? {} : { engine: info },
        ...live === void 0 ? {} : { probe: live.version },
        ...models === void 0 ? {} : { models },
        ...manifest === void 0 ? {} : { modelsVersion: manifest.version },
        ...live?.check === void 0 ? {} : { doctor: live.check },
        ...live?.check === void 0 ? {} : { microphone: microphonePermission(live.check) },
        ...live?.check === void 0 ? {} : { input: deviceName(live.check, "input") ?? void 0 },
        ...live?.check === void 0 ? {} : { output: deviceName(live.check, "output") ?? void 0 },
        options: action,
        keybind: keybindOf(action),
        tools: engine === void 0 ? { registered: 0, readable: 0 } : { registered: 2, readable: 1 },
        unguardedAgents: unguardedAgents(list, options?.access ?? "all"),
        ...setup === void 0 ? {} : { setup },
        ...engineInfo !== void 0 && "error" in engineInfo && isEngineError(engineInfo.error) ? { engineError: { code: engineInfo.error.code, message: engineInfo.error.message, next: engineInfo.error.next } } : {}
      });
    };
    const skill = await loadSkill(PACKAGE_ROOT);
    const stops = [];
    stops.push(
      await registerCommands(ctx, {
        status: readStatus,
        install: async (sessionID, signal) => {
          if (modelStore === void 0) throw new Error("The model manifest is unavailable.");
          const target = { packageRoot: PACKAGE_ROOT, cacheRoot, store: modelStore };
          const request = await installRequest(target);
          if (request.files.length === 0) return { downloaded: [], bytes: 0 };
          await ctx.permission.assert({
            sessionID,
            action: "voice_install",
            resources: request.hosts,
            save: request.hosts,
            metadata: { bytes: request.bytes, files: request.files }
          });
          return installAll(target, signal, async () => void 0);
        }
      })
    );
    stops.push(await registerStatusRpc(ctx.rpc, readStatus));
    stops.push(await ctx.skill.transform(skillTransform(skill)).then((registration) => registration.dispose));
    if (options !== void 0 && engine !== void 0 && modelStore !== void 0) {
      const toolInput = { engine, status: readStatus, assert: ctx.permission.assert };
      stops.push(await ctx.tool.transform(toolTransform(toolInput)).then((registration) => registration.dispose));
      stops.push(await registerToolsRpc(ctx, { methods: [...METHODS, ...ownedMethods(toolInput)] }));
      if (options.engine) stops.push(await registerEngineRpc(ctx.rpc, { engine, status: readStatus }));
      stops.push(await registerDefaultRules(ctx.agent, options.access).then((registration) => registration.dispose).catch(() => async () => {
      }));
    }
    return async () => {
      for (const stop of stops.reverse()) await stop().catch(() => void 0);
      await engine?.dispose();
    };
  }
});
export {
  plugin_default as default
};
