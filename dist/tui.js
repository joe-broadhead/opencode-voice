import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);

// src/tui.tsx
import { createComponent as _$createComponent } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { fileURLToPath } from "node:url";
import { Plugin } from "@opencode/plugin/tui";
import { TextAttributes } from "@opentui/core";
import { createSignal } from "solid-js";

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-L3NVT2DE.js
var SHAPED = Object.freeze([
  // At a word start, with a key-like tail: 20 or more key characters, letters and digits.
  ["api key", /(?<![A-Za-z0-9_-])sk-[A-Za-z0-9_-]{20,}/g, (match) => /\d/.test(match.slice(3)) && /[A-Za-z]/.test(match.slice(3))],
  ["api key", /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g],
  ["api key", /\bAIza[0-9A-Za-z_-]{30,}/g],
  ["api key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["api key", /\b(?:AccountKey|SharedAccessKey)=[A-Za-z0-9+/]{20,}={0,2}/g],
  ["token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{8,}/g],
  ["token", /\bgithub_pat_[A-Za-z0-9_]{20,}/g],
  ["token", /\bglpat-[A-Za-z0-9_-]{16,}/g],
  ["token", /\bxox[bpars]-[A-Za-z0-9-]{10,}/g],
  ["token", /\bnpm_[A-Za-z0-9]{30,}/g],
  ["token", /\bhf_[A-Za-z0-9]{30,}/g],
  ["token", /\bdop_v1_[A-Za-z0-9]{40,}/g],
  ["token", /https:\/\/hooks\.slack\.com\/(?:services|workflows|triggers)\/[A-Za-z0-9_/-]{20,}/g],
  ["token", /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g]
]);
var CREDENTIAL_KEYS = "api[_-]?key|apikey|access[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|client[_-]?secret|secret[_-]?key|private[_-]?key|passphrase|password|passwd|pwd|token|secret";
var ASSIGNMENT = new RegExp(
  String.raw`(?<![A-Za-z0-9])([A-Za-z0-9_.-]*?(${CREDENTIAL_KEYS}))["']?((?:[ \t]+(?:is|was))?[ \t]*[:=][ \t]*(?:\r?\n[ \t]*)?)(?:"([^"\n]*)"|'([^'\n]*)'|` + "`([^`\\n]*)`" + String.raw`|([^\s,;&]+))`,
  "gi"
);
var PROSE_WORDS = new Set(
  "a an the is are was were be been must should shall will can may not no never always every each at least most of to in on for and or with by from via see use uses used set stored managed rotated rotate required policy characters chars minimum maximum change changed expires expire reset same as one this that it its".split(" ")
);

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-CQOJNZW4.js
var MANIFEST_VERSION = 1;
var OPENCODE_RANGE = ">=2.4.1 <2.5.0";
var TESTED_OPENCODE = "2.4.1";
function hostInRange(version2) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version2));
  if (match === null) return false;
  const [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return major === 2 && minor === 4 && patch >= 1;
}
var PLUGIN_NAME = /^[a-z0-9]{2,31}$/;
var METHOD_CLASSES = ["read", "write", "send", "share", "delete", "export", "admin"];
var METHOD_ACCOUNTS = ["optional", "none"];
var METHOD_EFFECTS = ["ask", "deny"];
var ACCOUNT_MECHANISMS = ["integration", "mcp", "local"];
var SOURCE_SIGNALS = ["bus", "mcp-events", "webhook"];
var COST_CLASSES = ["free", "metered", "billed"];
var ACTION_EFFECTS = ["local", "notify", "spend", "irreversible"];
var MAX_BYTES_LIMIT = 1048576;
var SERVICE_ID_MAX = 128;
var SERVICE_LABEL_MAX = 64;
var DETAIL_FIELDS = ["external_id", "kind", "occurred_at", "url", "thread", "actors", "labels", "hash"];
var EXTENSION_SEGMENT_MAX = 32;
var EXTENSION_NAME = new RegExp(`^x-[a-z][a-z0-9-]{0,${EXTENSION_SEGMENT_MAX - 1}}/[a-z][a-z0-9-]{0,${EXTENSION_SEGMENT_MAX - 1}}$`);
var PAGE = { default: 100, min: 1, max: 500 };
var FACT_TYPES = ["commitment", "person.attribute", "meeting.attended"];
var EVENTS_LIST_INPUT_SCHEMA = {
  type: "object",
  properties: {
    source: { type: "string" },
    cursor: { type: "string" },
    since: { type: "string" },
    limit: { type: "integer", minimum: PAGE.min, maximum: PAGE.max },
    scope: { type: "object" }
  },
  additionalProperties: false
};

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-WLRWVIVP.js
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-4YITQAYJ.js
var schemas_exports2 = {};
__export(schemas_exports2, {
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCreditCard: () => ZodCreditCard,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIBAN: () => ZodIBAN,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodInstanceOf: () => ZodInstanceOf,
  ZodIntersection: () => ZodIntersection,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  codec: () => codec,
  creditCard: () => creditCard2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  currencyCode: () => currencyCode2,
  custom: () => custom,
  date: () => date2,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  enum: () => _enum,
  exactOptional: () => exactOptional,
  file: () => file,
  float32: () => float32,
  float64: () => float64,
  function: () => _function,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  iban: () => iban2,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  literal: () => literal,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  mac: () => mac2,
  map: () => map,
  meta: () => meta2,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  never: () => never,
  nonoptional: () => nonoptional,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  prefault: () => prefault,
  preprocess: () => preprocess,
  promise: () => promise,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  set: () => set,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  transform: () => transform,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor
});
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  CONSTANT_CATCH: () => CONSTANT_CATCH,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  attachSchema: () => attachSchema,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  codePointLength: () => codePointLength,
  constantCatch: () => constantCatch,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  defineLazyInternal: () => defineLazyInternal,
  derived: () => derived,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  hide: () => hide,
  installLazyProp: () => installLazyProp,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  members: () => members,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  own: () => own,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  rawShape: () => rawShape,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  sizeCaps: () => sizeCaps,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  toZod: () => toZod,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function toZod() {
  return (schema) => schema;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
var Cached = class {
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source2) {
  const start = source2.startsWith("^") ? 1 : 0;
  const end = source2.endsWith("$") ? source2.length - 1 : source2.length;
  return source2.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
function mirrorShape(target, source2, keys, wrap) {
  const raw = sourceShape(source2);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source2._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
function mirrorProps(target, source2) {
  for (const key of Reflect.ownKeys(source2)) {
    const desc = Object.getOwnPropertyDescriptor(source2, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source2[key]);
    else
      putProp(target, key, desc.value);
  }
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined"
]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class2, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class2 && ((value, key) => selected && !selected.has(key) ? value : new Class2({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class2, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => (
    // overwrite with non-optional
    selected && !selected.has(key) ? value : new Class2({ type: "nonoptional", innerType: value })
  ));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function sizeCaps(defChecks) {
  const caps = [];
  for (const ch of defChecks ?? []) {
    const d = ch._zod.def;
    if (!/_(length|size)$|_equals$/.test(d.check))
      break;
    const max = d.maximum ?? d.length ?? d.size;
    if (max >= 0)
      caps.push([max, ch]);
  }
  return caps;
}
function attachSchema(issues, start, inst) {
  var _a3;
  for (let i = start; i < issues.length; i++) {
    (_a3 = issues[i]).schema ?? (_a3.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config2) {
  var _a3;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a3 = iss).schema ?? (_a3.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base643) {
  const binaryString = atob(base643);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url3) {
  const base643 = base64url3.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base643.length % 4) % 4);
  return base64ToUint8Array(base643 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex3) {
  const cleanHex = hex3.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
  constructor(..._args) {
  }
};
function members(proto, table2) {
  for (const key in table2) {
    const desc = Object.getOwnPropertyDescriptor(table2, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
// @__NO_SIDE_EFFECTS__
function derived(computes, table2) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table2, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table2;
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = () => value;
  fn[CONSTANT_CATCH] = true;
  return fn;
}
var _a;
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = /* @__PURE__ */ $constructor("$ZodError", initializer);
var $ZodRealError = /* @__PURE__ */ $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
function flattenError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error2.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error3, path = []) => {
    for (const issue2 of error3.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue2));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node2 = curr[el];
            if (terminal) {
              node2._errors.push(mapper(issue2));
            }
            curr = node2;
            i++;
          }
        }
      }
    }
  };
  processError(error2);
  return fieldErrors;
}
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
function failure(Err, issues, ctx) {
  let error2;
  return {
    success: false,
    get error() {
      if (!error2) {
        error2 = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error2;
    },
    set error(e) {
      error2 = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = ((schema, value, _ctx) => {
  const validator2 = schema._zod.bag.validator;
  if (validator2 !== void 0) {
    if (validator2(value) !== COMPILE_INVALID)
      return true;
    if (validator2.definite === true && _ctx === void 0)
      return false;
  }
  return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length === 0;
}
var validateAsync = async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
};
var _encode = (_Err) => {
  const parse3 = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse3(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decode = (_Err) => {
  const parse3 = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    return parse3(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _encodeAsync = (_Err) => {
  const parseAsync3 = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync3(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decodeAsync = (_Err) => {
  const parseAsync3 = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    return await parseAsync3(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
var regexes_exports = {};
__export(regexes_exports, {
  anyString: () => anyString,
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  creditCard: () => creditCard,
  cuid: () => cuid,
  cuid2: () => cuid2,
  currencyCode: () => currencyCode,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hex: () => hex,
  hostname: () => hostname,
  html5Email: () => html5Email,
  httpProtocol: () => httpProtocol,
  iban: () => iban,
  idnEmail: () => idnEmail,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  mac: () => mac,
  md5_base64: () => md5_base64,
  md5_base64url: () => md5_base64url,
  md5_hex: () => md5_hex,
  nanoid: () => nanoid,
  nanoidOfLength: () => nanoidOfLength,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  sha1_base64: () => sha1_base64,
  sha1_base64url: () => sha1_base64url,
  sha1_hex: () => sha1_hex,
  sha256_base64: () => sha256_base64,
  sha256_base64url: () => sha256_base64url,
  sha256_hex: () => sha256_hex,
  sha384_base64: () => sha384_base64,
  sha384_base64url: () => sha384_base64url,
  sha384_hex: () => sha384_hex,
  sha512_base64: () => sha512_base64,
  sha512_base64url: () => sha512_base64url,
  sha512_hex: () => sha512_hex,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid
});
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var uuid4 = /* @__PURE__ */ uuid(4);
var uuid6 = /* @__PURE__ */ uuid(6);
var uuid7 = /* @__PURE__ */ uuid(7);
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
var idnEmail = unicodeEmail;
var browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var mac = (delimiter) => {
  const escapedDelim = escapeRegex(delimiter ?? ":");
  return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var domain = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var creditCard = /^\d(?:[ -]?\d){11,18}$/;
var currencyCode = /^(?:AED|AFN|ALL|AMD|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAD|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/;
var iban = /^[A-Z]{2}(?!00|01|99)\d{2}[A-Z0-9]{11,30}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source2) {
  return new RegExp(`^${source2}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var _undefined = /^undefined$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
var hex = /^[0-9a-fA-F]*$/;
function fixedBase64(bodyLength, padding) {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
function fixedBase64url(length) {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
var md5_hex = /^[0-9a-fA-F]{32}$/;
var md5_base64 = /* @__PURE__ */ fixedBase64(22, "==");
var md5_base64url = /* @__PURE__ */ fixedBase64url(22);
var sha1_hex = /^[0-9a-fA-F]{40}$/;
var sha1_base64 = /* @__PURE__ */ fixedBase64(27, "=");
var sha1_base64url = /* @__PURE__ */ fixedBase64url(27);
var sha256_hex = /^[0-9a-fA-F]{64}$/;
var sha256_base64 = /* @__PURE__ */ fixedBase64(43, "=");
var sha256_base64url = /* @__PURE__ */ fixedBase64url(43);
var sha384_hex = /^[0-9a-fA-F]{96}$/;
var sha384_base64 = /* @__PURE__ */ fixedBase64(64, "");
var sha384_base64url = /* @__PURE__ */ fixedBase64url(64);
var sha512_hex = /^[0-9a-fA-F]{128}$/;
var sha512_base64 = /* @__PURE__ */ fixedBase64(86, "==");
var sha512_base64url = /* @__PURE__ */ fixedBase64url(86);
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var _whenHasSize = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.size !== void 0;
};
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? (
      // `value % 0n` throws, and nothing is a multiple of zero — the number branch already fails this way via NaN
      def.value !== BigInt(0) && payload.value % def.value === BigInt(0)
    ) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor("$ZodCheckBigIntFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (input < minimum) {
      payload.issues.push({
        origin: "bigint",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "bigint",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxSize = /* @__PURE__ */ $constructor("$ZodCheckMaxSize", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasSize);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size <= def.maximum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input),
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinSize = /* @__PURE__ */ $constructor("$ZodCheckMinSize", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasSize);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size >= def.minimum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input),
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckSizeEquals = /* @__PURE__ */ $constructor("$ZodCheckSizeEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasSize);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size === def.size)
      return;
    const tooBig = size > def.size;
    payload.issues.push({
      origin: getSizableOrigin(input),
      ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a3, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
var $ZodCheckProperty = /* @__PURE__ */ $constructor("$ZodCheckProperty", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    const result = def.schema._zod.run({
      value: payload.value[def.property],
      issues: []
    }, {});
    if (result instanceof Promise) {
      return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
    }
    handleCheckPropertyResult(result, payload, def.property);
    return;
  };
});
var $ZodCheckProperties = /* @__PURE__ */ $constructor("$ZodCheckProperties", (inst, def) => {
  $ZodCheck.init(inst, def);
  hide(inst, Symbol.iterator, function* () {
    yield inst;
  });
  let entries;
  inst._zod.check = (payload) => {
    if (payload.value == null) {
      payload.issues.push({ expected: "object", code: "invalid_type", input: payload.value, inst });
      return void 0;
    }
    entries ?? (entries = Reflect.ownKeys(def.shape).map((key) => [key, def.shape[key]]));
    const input = payload.value;
    let proms;
    for (const [key, schema] of entries) {
      const result = schema._zod.run({ value: input[key], issues: [] }, {});
      if (result instanceof Promise) {
        proms ?? (proms = []);
        proms.push(result.then((result2) => handleCheckPropertyResult(result2, payload, key)));
      } else {
        handleCheckPropertyResult(result, payload, key);
      }
    }
    if (proms)
      return Promise.all(proms).then(() => void 0);
    return void 0;
  };
});
var $ZodCheckMimeType = /* @__PURE__ */ $constructor("$ZodCheckMimeType", (inst, def) => {
  $ZodCheck.init(inst, def);
  const mimeSet = new Set(def.mime);
  inst._zod.check = (payload) => {
    if (mimeSet.has(payload.value.type))
      return;
    payload.issues.push({
      code: "invalid_value",
      values: def.mime,
      input: payload.value.type,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});
var Doc = class {
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  // the compiler catches a child's throw and keeps writing into this doc, so the indent has to unwind with it
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join("\n")}
};`);
    return factory(...Object.values(this.closed));
  }
};
var version = {
  major: 4,
  minor: 6,
  patch: 7
};
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync2(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function canParseURL(input) {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function")
      return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
function validateURL(trimmed, def) {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL;
      if (typeof URLStatic.parse === "function")
        return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url2, hostname3) {
  hostname3.lastIndex = 0;
  return hostname3.test(url2.hostname);
}
function urlProtocolOk(url2, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol);
}
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url2 = validateURL(trimmed, def);
      if (url2 === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }
      if (def.hostname && !urlHostnameOk(url2, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url2, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url2.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodMAC = /* @__PURE__ */ $constructor("$ZodMAC", (inst, def) => {
  def.pattern ?? (def.pattern = mac(def.delimiter));
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts2 = value.split("/");
  if (parts2.length !== 2)
    return false;
  const [address, prefix] = parts2;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base643 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
var CC_SANITIZE = /[- ]/g;
function isLuhnAlgo(digits) {
  let length = digits.length;
  let bit = 1;
  let sum = 0;
  while (length) {
    const value = digits.charCodeAt(--length) - 48;
    bit ^= 1;
    sum += bit ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][value] : value;
  }
  return sum % 10 === 0;
}
function isValidCreditCard(input) {
  if (!creditCard.test(input))
    return false;
  return isLuhnAlgo(input.replace(CC_SANITIZE, ""));
}
var $ZodCreditCard = /* @__PURE__ */ $constructor("$ZodCreditCard", (inst, def) => {
  def.pattern ?? (def.pattern = creditCard);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidCreditCard(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "credit_card",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isIso7064Mod97(iban3) {
  let remainder = 0;
  const len = iban3.length;
  for (let i = 4; i < len; i++) {
    const code = iban3.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  for (let i = 0; i < 4; i++) {
    const code = iban3.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  return remainder === 1;
}
function isValidIBAN(input) {
  if (!iban.test(input))
    return false;
  return isIso7064Mod97(input);
}
var $ZodIBAN = /* @__PURE__ */ $constructor("$ZodIBAN", (inst, def) => {
  def.pattern ?? (def.pattern = iban);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidIBAN(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "iban",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCustomStringFormat = /* @__PURE__ */ $constructor("$ZodCustomStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (def.fn(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: def.format,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodBigIntFormat = /* @__PURE__ */ $constructor("$ZodBigIntFormat", (inst, def) => {
  $ZodCheckBigIntFormat.init(inst, def);
  $ZodBigInt.init(inst, def);
});
var $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "symbol")
      return payload;
    payload.issues.push({
      expected: "symbol",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _undefined;
  inst._zod.values = /* @__PURE__ */ new Set([void 0]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "undefined",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "void",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function capSize(inst, size) {
  const caps = sizeCaps(inst._zod.def.checks);
  if (!caps.length)
    return;
  const cap = Math.min(...caps.map((c) => c[0]));
  const parse3 = inst._zod.parse;
  inst._zod.parse = (payload, ctx) => {
    const n = size(payload.value);
    if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
      for (const [max, ch] of sizeCaps(inst._zod.def.checks)) {
        if (n > max && ch._zod.def.when(payload)) {
          const start = payload.issues.length;
          ch._zod.check(payload);
          payload.issues[start].continue = false;
          attachSchema(payload.issues, start, inst);
          return payload;
        }
      }
    }
    return parse3(payload, ctx);
  };
}
var arraySize = (input) => Array.isArray(input) ? input.length : -1;
var mapSize = (input) => input instanceof Map ? input.size : -1;
var setSize = (input) => input instanceof Set ? input.size : -1;
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo2 ? memo2.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item2 = input[i];
      const result = def.element._zod.run({
        value: item2,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
  capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo2 = globalConfig.memoizer;
  const generateFastpass = (shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo: memo2, syms });
    const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo2 ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== void 0;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
  const matches2 = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].issues.length === 0)
      matches2.push(i);
  }
  if (matches2.length === 1) {
    final.value = results[matches2[0]].value;
    return final;
  }
  if (matches2.length === 0) {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
    });
  } else {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: [],
      inclusive: false,
      matches: matches2
    });
  }
  return final;
}
var $ZodXor = /* @__PURE__ */ $constructor("$ZodXor", (inst, def) => {
  $ZodUnion.init(inst, def);
  def.inclusive = false;
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        results.push(result);
      }
    }
    if (!async)
      return handleExclusiveUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleExclusiveUnionResults(results2, payload, inst, ctx);
    });
  };
});
function discriminatorMap(def) {
  const map2 = /* @__PURE__ */ new Map();
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map2.has(value)) {
        if (value !== void 0)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map2.set(value, null);
      } else {
        map2.set(value, option);
      }
    }
  }
  return map2;
}
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(void 0))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, /* @__PURE__ */ new Set());
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(void 0);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const value = input?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== void 0 || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value2) => disc.value.get(value2) !== null),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  const keyIssues = /* @__PURE__ */ new Map();
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
  $ZodType.init(inst, def);
  const items = def.items;
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        input,
        inst,
        expected: "tuple",
        code: "invalid_type"
      });
      return payload;
    }
    payload.value = memo2 ? memo2.alloc(inst, payload, [], ctx) : [];
    const proms = [];
    const optinStart = getTupleOptStart(items, "optin");
    const optoutStart = getTupleOptStart(items, "optout");
    if (!def.rest) {
      if (input.length < optinStart) {
        payload.issues.push({
          code: "too_small",
          minimum: optinStart,
          inclusive: true,
          input,
          inst,
          origin: "array"
        });
        return payload;
      }
      if (input.length > items.length) {
        payload.issues.push({
          code: "too_big",
          maximum: items.length,
          inclusive: true,
          input,
          inst,
          origin: "array"
        });
      }
    }
    const itemResults = new Array(items.length);
    const abortEarly = def.rest ? ctx?.abortEarly : void 0;
    let itemAborted = false;
    for (let i = 0; i < items.length; i++) {
      const r = items[i]._zod.run({ value: input[i], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((rr) => {
          itemResults[i] = rr;
        }));
      } else {
        itemResults[i] = r;
        if (abortEarly && !itemAborted && r.issues.length)
          itemAborted = aborted(r);
      }
    }
    if (def.rest && !itemAborted) {
      let i = items.length - 1;
      const rest = input.slice(items.length);
      let seen = payload.issues.length;
      for (const el of rest) {
        if (abortEarly && payload.issues.length !== seen) {
          if (aborted(payload, seen))
            break;
          seen = payload.issues.length;
        }
        i++;
        const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((r) => handleTupleResult(r, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
    }
    return handleTupleResults(itemResults, payload, items, input, optoutStart);
  };
});
function getTupleOptStart(items, key) {
  for (let i = items.length - 1; i >= 0; i--) {
    const omittable = key === "optin" ? items[i]._zod.optin !== void 0 : items[i]._zod.optout === "optional";
    if (!omittable)
      return i + 1;
  }
  return 0;
}
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input, optoutStart) {
  for (let i = 0; i < items.length; i++) {
    const r = itemResults[i];
    const isPresent = i < input.length;
    if (!isPresent && i >= optoutStart && items[i]._zod.optin === "optional") {
      final.value.length = i;
      break;
    }
    if (r.issues.length) {
      if (!isPresent && i >= optoutStart) {
        final.value.length = i;
        break;
      }
      final.issues.push(...prefixIssues(i, r.issues));
    }
    final.value[i] = r.value;
  }
  for (let i = final.value.length - 1; i >= input.length; i--) {
    if (items[i]._zod.optout === "optional" && final.value[i] === void 0) {
      final.value.length = i;
    } else {
      break;
    }
  }
  return final;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[outKey] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Map)) {
      payload.issues.push({
        expected: "map",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    payload.value = memo2 ? memo2.alloc(inst, payload, /* @__PURE__ */ new Map(), ctx) : /* @__PURE__ */ new Map();
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const [key, value] of input) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
      const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
      if (keyResult instanceof Promise || valueResult instanceof Promise) {
        proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
          handleMapResult(keyResult2, valueResult2, payload, key, input, inst, ctx);
        }));
      } else {
        handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
      }
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
  capSize(inst, mapSize);
});
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        code: "invalid_key",
        origin: "map",
        input,
        inst,
        issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",
        input,
        inst,
        key,
        issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
var $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Set)) {
      payload.issues.push({
        input,
        inst,
        expected: "set",
        code: "invalid_type"
      });
      return payload;
    }
    const proms = [];
    payload.value = memo2 ? memo2.alloc(inst, payload, /* @__PURE__ */ new Set(), ctx) : /* @__PURE__ */ new Set();
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const item2 of input) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      const result = def.valueType._zod.run({ value: item2, issues: [] }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleSetResult(result2, payload)));
      } else
        handleSetResult(result, payload);
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
  capSize(inst, setSize);
});
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input instanceof File)
      return payload;
    payload.issues.push({
      expected: "file",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError("ZodSuccess");
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.issues.length === 0;
        return payload;
      });
    }
    payload.value = result.issues.length === 0;
    return payload;
  };
});
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleCatchResult(payload, result2, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "nan",
        code: "invalid_type"
      });
      return payload;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodCodec = /* @__PURE__ */ $constructor("$ZodCodec", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
      const left = def.in._zod.run(payload, ctx);
      if (left instanceof Promise) {
        return left.then((left2) => handleCodecAResult(left2, def, ctx));
      }
      return handleCodecAResult(left, def, ctx);
    } else {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handleCodecAResult(right2, def, ctx));
      }
      return handleCodecAResult(right, def, ctx);
    }
  };
});
function handleCodecAResult(result, def, ctx) {
  if (result.issues.length) {
    result.aborted = true;
    return result;
  }
  const direction = ctx.direction || "forward";
  if (direction === "forward") {
    const transformed = def.transform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
    }
    return handleCodecTxResult(result, transformed, def.out, ctx);
  } else {
    const transformed = def.reverseTransform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
    }
    return handleCodecTxResult(result, transformed, def.in, ctx);
  }
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return nextSchema._zod.run({ value, issues: left.issues }, ctx);
}
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
function leafPattern(schema) {
  const def = schema._zod.def;
  let pattern = def.pattern;
  let isInt = !!def.format?.includes("int");
  let minimum;
  let maximum;
  for (const ch of def.checks ?? []) {
    const d = ch._zod.def;
    if (d.pattern)
      pattern = d.pattern;
    isInt || (isInt = !!d.format?.includes("int"));
    const lo = d.minimum ?? d.length;
    const hi = d.maximum ?? d.length;
    if (lo !== void 0 && (minimum === void 0 || lo > minimum))
      minimum = lo;
    if (hi !== void 0 && (maximum === void 0 || hi < maximum))
      maximum = hi;
  }
  if (pattern)
    return pattern.source;
  if (minimum !== void 0 && maximum !== void 0 && minimum > maximum)
    return "(?!)";
  if (minimum !== void 0 || maximum !== void 0)
    return string({ minimum, maximum }).source;
  const own2 = schema._zod.pattern;
  return (isInt && own2 === number ? integer : own2)?.source;
}
function partPattern(schema) {
  const def = schema._zod.def;
  const own2 = schema._zod.pattern?.source;
  const inner = def.innerType ?? schema._zod.innerType;
  if (inner) {
    const before = inner._zod.pattern?.source;
    const after = partPattern(inner);
    if (own2 && before && after && after !== before) {
      return own2.replace(cleanRegex(before), () => cleanRegex(after));
    }
    return own2;
  }
  if (def.options) {
    const sources = def.options.map(partPattern);
    if (sources.every(Boolean))
      return `^(${sources.map((s) => cleanRegex(s)).join("|")})$`;
  }
  return leafPattern(schema);
}
var $ZodTemplateLiteral = /* @__PURE__ */ $constructor("$ZodTemplateLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const regexParts = [];
  for (const part of def.parts) {
    if (typeof part === "object" && part !== null) {
      const source2 = partPattern(part);
      if (!source2) {
        throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
      }
      regexParts.push(cleanRegex(source2));
    } else if (part === null || primitiveTypes.has(typeof part)) {
      regexParts.push(escapeRegex(`${part}`));
    } else {
      throw new Error(`Invalid template literal part: ${part}`);
    }
  }
  inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "string") {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "string",
        code: "invalid_type"
      });
      return payload;
    }
    inst._zod.pattern.lastIndex = 0;
    if (!inst._zod.pattern.test(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        code: "invalid_format",
        format: def.format ?? "template_literal",
        pattern: inst._zod.pattern.source
      });
      return payload;
    }
    return payload;
  };
});
var $ZodFunction = /* @__PURE__ */ $constructor("$ZodFunction", (inst, def) => {
  $ZodType.init(inst, def);
  Object.defineProperty(inst, "_def", { value: def });
  inst._zod.def = def;
  inst.implement = (func) => {
    if (typeof func !== "function") {
      throw new Error("implement() must be called with a function");
    }
    return Object.defineProperty(function(...args) {
      const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
      const result = Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return parse(inst._def.output, result);
      }
      return result;
    }, "_zod", { value: inst._zod, enumerable: false });
  };
  inst.implementAsync = (func) => {
    if (typeof func !== "function") {
      throw new Error("implementAsync() must be called with a function");
    }
    return Object.defineProperty(async function(...args) {
      const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
      const result = await Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return await parseAsync(inst._def.output, result);
      }
      return result;
    }, "_zod", { value: inst._zod, enumerable: false });
  };
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "function") {
      payload.issues.push({
        code: "invalid_type",
        expected: "function",
        input: payload.value,
        inst
      });
      return payload;
    }
    const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
    if (hasPromiseOutput) {
      payload.value = inst.implementAsync(payload.value);
    } else {
      payload.value = inst.implement(payload.value);
    }
    return payload;
  };
  inst.input = (...args) => {
    const F = inst.constructor;
    if (Array.isArray(args[0])) {
      return new F({
        type: "function",
        input: new $ZodTuple({
          type: "tuple",
          items: args[0],
          rest: args[1]
        }),
        output: inst._def.output
      });
    }
    return new F({
      type: "function",
      input: args[0],
      output: inst._def.output
    });
  };
  inst.output = (output) => {
    const F = inst.constructor;
    return new F({
      type: "function",
      input: inst._def.input,
      output
    });
  };
  return inst;
});
var $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
  };
});
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazyInternal(inst, "pattern", (zod) => zod.innerType?._zod?.pattern);
  defineLazyInternal(inst, "propValues", (zod) => zod.innerType?._zod?.propValues);
  defineLazyInternal(inst, "optin", (zod) => zod.innerType?._zod?.optin ?? void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.innerType?._zod?.optout ?? void 0);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
var $ZodCyclicError = class extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
};
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap();
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve2) {
  const cached2 = recursive.get(inst);
  if (cached2 !== void 0)
    return cached2 ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check2 = (child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve2);
      if (answer > result)
        result = answer;
    }
  };
  const shape = (sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve2) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  };
  const merge2 = (answer) => {
    if (answer > result)
      result = answer;
  };
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge2(raw ? shape(raw, true) : ASSUMED);
      check2(def.catchall);
      break;
    }
    case "array":
      check2(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check2(el);
      check2(def.rest);
      break;
    case "record":
    case "map":
      check2(def.keyType);
      check2(def.valueType);
      break;
    case "set":
      check2(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check2(el);
      break;
    case "intersection":
      check2(def.left);
      check2(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check2(def.innerType);
      break;
    case "pipe":
      check2(def.in);
      check2(def.out);
      break;
    case "function":
      check2(def.input);
      check2(def.output);
      break;
    // `$ZodLazy` caches its inner on the def, so a resolved edge is followed exactly
    case "lazy": {
      const inner = def._cachedInner ?? (resolve2 ? inst._zod.innerType : void 0);
      merge2(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    // a leaf by choice: `parts` are regex fragments, not data positions
    case "template_literal":
    // leaves
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      kind;
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check2(value);
        else if (Array.isArray(value))
          for (const el of value)
            check2(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = /* @__PURE__ */ new WeakMap();
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = void 0;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a3;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError();
        return base(payload, ctx);
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a3;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (isRecursiveInst === void 0) {
          const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input = payload.value;
        if (!isRef(input))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: /* @__PURE__ */ new WeakMap(), backEdges: void 0 };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = void 0;
        const entry = open.length > depth ? open.pop() : void 0;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    currency_code: "currency code",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  function getTypeName(type, input) {
    if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
      return String(input);
    }
    return TypeDictionary[type] ?? type;
  }
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = getTypeName(issue2.expected);
        const receivedType = parsedType(issue2.input);
        const received = getTypeName(receivedType, issue2.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue2.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}
var _a2;
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta3 = _meta[0];
    this._map.set(schema, meta3);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.set(meta3.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta3 = this._map.get(schema);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.delete(meta3.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mac(Class2, params) {
  return new Class2({
    type: "string",
    format: "mac",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _creditCard(Class2, params) {
  return new Class2({
    type: "string",
    format: "credit_card",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _iban(Class2, params) {
  return new Class2({
    type: "string",
    format: "iban",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float64(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _positive(params) {
  return /* @__PURE__ */ _gt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _negative(params) {
  return /* @__PURE__ */ _lt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
  return /* @__PURE__ */ _lte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
  return /* @__PURE__ */ _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
  return new $ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum
  });
}
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
  return new $ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
  return new $ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
  return new $ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _properties(shape, params) {
  return new $ZodCheckProperties({
    check: "properties",
    shape,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
  return new $ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// @__NO_SIDE_EFFECTS__
function describe(description) {
  const ch = new $ZodCheck({ check: "describe" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, description });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
  const ch = new $ZodCheck({ check: "meta" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, ...metadata });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
    falsyArray = falsyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Codec = Classes.Codec ?? $ZodCodec;
  const _Boolean = Classes.Boolean ?? $ZodBoolean;
  const _String = Classes.String ?? $ZodString;
  const stringSchema = new _String({ type: "string", error: params.error });
  const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
  const codec2 = new _Codec({
    type: "pipe",
    in: stringSchema,
    out: booleanSchema,
    transform: ((input, payload) => {
      let data = input;
      if (params.case !== "sensitive")
        data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: codec2,
          continue: false
        });
        return {};
      }
    }),
    reverseTransform: ((input, _payload) => {
      if (input === true) {
        return truthyArray[0] || "true";
      } else {
        return falsyArray[0] || "false";
      }
    }),
    error: params.error
  });
  codec2._zod.bag.truthy = truthyArray;
  codec2._zod.bag.falsy = falsyArray;
  codec2._zod.bag.case = params.case ?? "insensitive";
  return codec2;
}
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class2, format, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}
function assignProps(target, ...sources) {
  for (const source2 of sources) {
    for (const key of Reflect.ownKeys(source2)) {
      if (Object.prototype.propertyIsEnumerable.call(source2, key)) {
        assignProp(target, key, source2[key]);
      }
    }
  }
  return target;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    sharedDefsExtractedFor: void 0,
    sharedEmitDoneFor: void 0,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? void 0
  };
}
function handleUnrepresentable(schema, ctx, json2, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === void 0 || result === "throw")
    throw new Error(message);
  Object.assign(json2, result);
  return true;
}
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a3;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = void 0;
  ctx.sharedEmitDoneFor = void 0;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta3 = ctx.metadataRegistry.get(schema);
  if (meta3)
    assignProps(result.schema, meta3);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = /* @__PURE__ */ new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
function foldObjects(members2) {
  const objects = [];
  for (const member of members2) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties = {};
  const required2 = /* @__PURE__ */ new Set();
  for (const object2 of objects) {
    for (const key in object2.properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key))
        continue;
      const parts2 = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === void 0)
          continue;
        if (!parts2.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts2.push(part);
      }
      const merged = parts2.length === 1 ? parts2[0] : foldObjects(parts2) ?? { allOf: parts2 };
      assignProp(properties, key, merged);
    }
    for (const key of object2.required ?? [])
      required2.add(key);
  }
  const folded = { type: "object", properties };
  if (required2.size)
    folded.required = [...required2];
  if (objects.every((object2) => object2.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object2 of objects) {
      const constraint = undeclaredConstraint(object2);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
function foldIntersection(json2) {
  const allOf = json2.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json2)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union2 = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union2[k]));
    if (Object.keys(union2).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union2);
    const branches = union2[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json2.allOf;
  assignProps(json2, folded);
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        assignProps(schema2, refSchema);
      }
      assignProps(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = /* @__PURE__ */ new Map();
      for (const seen of ctx.seen.values()) {
        for (const json2 of [seen.schema, seen.def]) {
          const allOf = json2?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json2);
          else
            carriers.set(allOf, [json2]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json2 of carriers.get(allOf) ?? [])
          foldIntersection(json2);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item2 of def.items) {
      if (isTransforming(item2, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var narrowMin = (agg, key, value) => {
  if (agg[key] === void 0 || value > agg[key])
    agg[key] = value;
};
var narrowMax = (agg, key, value) => {
  if (agg[key] === void 0 || value < agg[key])
    agg[key] = value;
};
var narrowBoth = (agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
  agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
  agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
  agg.format = format;
  if (format.includes("int"))
    agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
};
var contributors = {
  greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
  less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
  multiple_of: (agg, def) => addDivisor(agg, def.value),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: (agg, def) => narrowBoth(agg, def.length),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: (agg, def) => narrowBoth(agg, def.size),
  string_format: (agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  },
  mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list2 = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list2)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== void 0)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== void 0)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== void 0)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== void 0)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== void 0)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== void 0) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var exactPatterns = /* @__PURE__ */ new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
  const json2 = _json;
  json2.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json2.minLength = minimum;
  if (typeof maximum === "number")
    json2.maxLength = maximum;
  if (format) {
    json2.format = formatMap[format] ?? format;
    if (json2.format === "")
      delete json2.format;
    if (format === "time" || laxFormat) {
      delete json2.format;
    }
  }
  if (contentEncoding)
    json2.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json2.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json2.allOf = [
        ...patternList.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json2.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json2.minimum = exclusiveMinimum;
      json2.exclusiveMinimum = true;
    } else {
      json2.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json2.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json2.maximum = exclusiveMaximum;
      json2.exclusiveMaximum = true;
    } else {
      json2.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json2.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = /* @__PURE__ */ new Set();
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json2, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== void 0)
      json2.multipleOf = first;
    if (rest.length)
      json2.allOf = [...json2.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
};
var booleanProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
var bigintProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "BigInt cannot be represented in JSON Schema");
};
var symbolProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Symbols cannot be represented in JSON Schema");
};
var nullProcessor = (_schema, ctx, json2, _params) => {
  if (ctx.target === "openapi-3.0") {
    json2.type = "string";
    json2.nullable = true;
    json2.enum = [null];
  } else {
    json2.type = "null";
  }
};
var undefinedProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Undefined cannot be represented in JSON Schema");
};
var voidProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Void cannot be represented in JSON Schema");
};
var neverProcessor = (_schema, _ctx, json2, _params) => {
  json2.not = {};
};
var anyProcessor = (_schema, _ctx, _json, _params) => {
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {
};
var dateProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Date cannot be represented in JSON Schema");
};
var enumProcessor = (schema, _ctx, json2, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json2.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json2.type = "number";
  if (values.every((v) => typeof v === "string"))
    json2.type = "string";
  json2.enum = values;
};
var literalProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json2.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (handleUnrepresentable(schema, ctx, json2, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json2, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json2.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json2.enum = [val];
    } else {
      json2.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json2.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json2.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json2.type = "boolean";
    if (vals.every((v) => v === null))
      json2.type = "null";
    json2.enum = vals;
  }
};
var nanProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "NaN cannot be represented in JSON Schema");
};
var templateLiteralProcessor = (schema, _ctx, json2, _params) => {
  const _json = json2;
  const pattern = schema._zod.pattern;
  if (!pattern)
    throw new Error("Pattern not found in template literal");
  _json.type = "string";
  _json.pattern = pattern.source;
};
var fileProcessor = (schema, _ctx, json2, _params) => {
  const _json = json2;
  _json.type = "string";
  _json.format = "binary";
  _json.contentEncoding = "binary";
  const { minimum, maximum, mime } = aggregateChecks(schema);
  if (minimum !== void 0)
    _json.minLength = minimum;
  if (maximum !== void 0)
    _json.maxLength = maximum;
  if (!mime)
    return;
  if (mime.length === 0)
    _json.not = {};
  else if (mime.length === 1)
    _json.contentMediaType = mime[0];
  else
    _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
};
var successProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
var customProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Custom types cannot be represented in JSON Schema");
};
var functionProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Function types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Transforms cannot be represented in JSON Schema");
};
var mapProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Map cannot be represented in JSON Schema");
};
var setProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Set cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
  json2.type = "array";
  json2.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json2, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json2.type = "object";
  json2.properties = {};
  for (const key in shape) {
    assignProp(json2.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const requiredKeys = [];
  for (const key of Object.keys(shape)) {
    const field = def.shape[key];
    if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) {
      requiredKeys.push(key);
    }
  }
  if (requiredKeys.length > 0) {
    json2.required = requiredKeys;
  }
  if (def.catchall?._zod.def.type === "never") {
    json2.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json2.additionalProperties = false;
  } else if (def.catchall) {
    json2.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json2.oneOf = options;
  } else {
    json2.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json2.allOf = allOf;
  ctx.intersections.push(allOf);
};
var tupleProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? processSchema(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  let minItems = def.items.length;
  while (minItems > 0) {
    const item2 = def.items[minItems - 1];
    const optional2 = ctx.io === "input" ? inputOptin(item2) !== void 0 : item2._zod.optout === "optional";
    if (!optional2)
      break;
    minItems--;
  }
  const maxItems = def.items.length;
  const isClosed = !def.rest;
  if (ctx.target === "draft-2020-12") {
    json2.prefixItems = prefixItems;
    if (isClosed) {
      json2.items = false;
    } else if (rest) {
      json2.items = rest;
    }
    if (minItems > 0)
      json2.minItems = minItems;
    if (isClosed)
      json2.maxItems = maxItems;
  } else if (ctx.target === "openapi-3.0") {
    json2.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json2.items.anyOf.push(rest);
    }
    if (minItems > 0)
      json2.minItems = minItems;
    if (isClosed)
      json2.maxItems = maxItems;
  } else {
    json2.items = prefixItems;
    if (isClosed) {
      json2.additionalItems = false;
    } else if (rest) {
      json2.additionalItems = rest;
    }
    if (minItems > 0)
      json2.minItems = minItems;
    if (isClosed)
      json2.maxItems = maxItems;
  }
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
};
function stringifyKeyNames(bySchema, json2, visited) {
  if (json2.$ref) {
    if (visited.has(json2))
      return json2;
    visited.add(json2);
    const def = bySchema.get(json2)?.def;
    if (!def)
      return json2;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json2 : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json2[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json2 = { ...json2, [keyword]: mapped };
  }
  const types = Array.isArray(json2.type) ? json2.type : [json2.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json2.enum ?? (json2.const !== void 0 ? [json2.const] : void 0);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json2;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json2;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
var pendingRecords = /* @__PURE__ */ new WeakMap();
function rewriteKeyNames(ctx) {
  const bySchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = /* @__PURE__ */ new Map();
  for (const record22 of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record22);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, /* @__PURE__ */ new Set());
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
var recordProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json2.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json2.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json2.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json2.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json2.required = validKeyValues.map(String);
    }
  }
};
var nullableProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json2.nullable = true;
  } else {
    json2.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = /* @__PURE__ */ Symbol();
function serializeDefaultValue(value, schema, ctx, json2, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json2, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json2, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json2.default = value;
};
var prefaultProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json2, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json2._prefault = value;
};
var catchProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    handleUnrepresentable(schema, ctx, json2, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json2.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json2.readOnly = true;
};
var promiseProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var allProcessors = {
  string: stringProcessor,
  number: numberProcessor,
  boolean: booleanProcessor,
  bigint: bigintProcessor,
  symbol: symbolProcessor,
  null: nullProcessor,
  undefined: undefinedProcessor,
  void: voidProcessor,
  never: neverProcessor,
  any: anyProcessor,
  unknown: unknownProcessor,
  date: dateProcessor,
  enum: enumProcessor,
  literal: literalProcessor,
  nan: nanProcessor,
  template_literal: templateLiteralProcessor,
  file: fileProcessor,
  success: successProcessor,
  custom: customProcessor,
  function: functionProcessor,
  transform: transformProcessor,
  map: mapProcessor,
  set: setProcessor,
  array: arrayProcessor,
  object: objectProcessor,
  union: unionProcessor,
  intersection: intersectionProcessor,
  tuple: tupleProcessor,
  record: recordProcessor,
  nullable: nullableProcessor,
  nonoptional: nonoptionalProcessor,
  default: defaultProcessor,
  prefault: prefaultProcessor,
  catch: catchProcessor,
  pipe: pipeProcessor,
  readonly: readonlyProcessor,
  promise: promiseProcessor,
  optional: optionalProcessor,
  lazy: lazyProcessor
};
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      processSchema(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      assignProp(schemas, key, finalize(ctx2, schema));
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  processSchema(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}
var checks_exports2 = {};
__export(checks_exports2, {
  endsWith: () => _endsWith,
  gt: () => _gt,
  gte: () => _gte,
  includes: () => _includes,
  length: () => _length,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  negative: () => _negative,
  nonnegative: () => _nonnegative,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  overwrite: () => _overwrite,
  positive: () => _positive,
  properties: () => _properties,
  property: () => _property,
  regex: () => _regex,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  trim: () => _trim,
  uppercase: () => _uppercase
});
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
  _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
  _lazyMethod(proto, "addIssue", (self) => (issue2) => {
    self.issues.push(issue2);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self) => (issues2) => {
    self.issues.push(...issues2);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, void 0, {
  Parent: Error
});
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(util_exports.mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta3) {
    reg.add(this, meta3);
    return this;
  },
  refine(check2, params) {
    return this.check(refine(check2, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(/* @__PURE__ */ _overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(void 0).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  // Overrides core's `~standard` to add `jsonSchema`. Must stay a prototype entry: redefining it per instance demotes instances to dictionary mode.
  get "~standard"() {
    return util_exports.hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    util_exports.own(this, "~standard", value);
  },
  parse: function _parse2(data, params) {
    return parse2(this, data, params, { callee: _parse2 });
  },
  parseAsync: async function _parseAsync2(data, params) {
    return await parseAsync2(this, data, params, { callee: _parseAsync2 });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  // `spa` is an alias: same function object as `safeParseAsync`, as before.
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    util_exports.own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: function _encode2(data, params) {
    return encode(this, data, params, { callee: _encode2 });
  },
  decode: function _decode2(data, params) {
    return decode(this, data, params, { callee: _decode2 });
  },
  encodeAsync: async function _encodeAsync2(data, params) {
    return await encodeAsync(this, data, params, { callee: _encodeAsync2 });
  },
  decodeAsync: async function _decodeAsync2(data, params) {
    return await decodeAsync(this, data, params, { callee: _decodeAsync2 });
  },
  safeEncode(data, params) {
    return safeEncode(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  // Reads through to the registry on every access, so it must not cache.
  get description() {
    return globalRegistry.get(this)?.description;
  },
  // No setter: `schema._def = x` throws, as it did when `_def` was a non-writable own property.
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor(
  "_ZodString",
  (inst, def) => {
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => stringProcessor(inst, ctx, json2, params);
  },
  /* @__PURE__ */ util_exports.derived({
    format: (inst) => aggregateChecks(inst).format ?? null,
    minLength: (inst) => aggregateChecks(inst).minimum ?? null,
    maxLength: (inst) => aggregateChecks(inst).maximum ?? null
  }, {
    regex(...args) {
      return this.check(/* @__PURE__ */ _regex(...args));
    },
    includes(...args) {
      return this.check(/* @__PURE__ */ _includes(...args));
    },
    startsWith(...args) {
      return this.check(/* @__PURE__ */ _startsWith(...args));
    },
    endsWith(...args) {
      return this.check(/* @__PURE__ */ _endsWith(...args));
    },
    min(...args) {
      return this.check(/* @__PURE__ */ _minLength(...args));
    },
    max(...args) {
      return this.check(/* @__PURE__ */ _maxLength(...args));
    },
    length(...args) {
      return this.check(/* @__PURE__ */ _length(...args));
    },
    nonempty(...args) {
      return this.check(/* @__PURE__ */ _minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(/* @__PURE__ */ _lowercase(params));
    },
    uppercase(params) {
      return this.check(/* @__PURE__ */ _uppercase(params));
    },
    trim() {
      return this.check(/* @__PURE__ */ _trim());
    },
    normalize(...args) {
      return this.check(/* @__PURE__ */ _normalize(...args));
    },
    toLowerCase() {
      return this.check(/* @__PURE__ */ _toLowerCase());
    },
    toUpperCase() {
      return this.check(/* @__PURE__ */ _toUpperCase());
    },
    slugify() {
      return this.check(/* @__PURE__ */ _slugify());
    }
  })
);
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(/* @__PURE__ */ _email(ZodEmail, params));
  },
  url(params) {
    return this.check(/* @__PURE__ */ _url(ZodURL, params));
  },
  jwt(params) {
    return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(/* @__PURE__ */ _emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(/* @__PURE__ */ _xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(/* @__PURE__ */ _e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return /* @__PURE__ */ _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return /* @__PURE__ */ _email(ZodEmail, params);
}
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function guid2(params) {
  return /* @__PURE__ */ _guid(ZodGUID, params);
}
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function uuid2(params) {
  return /* @__PURE__ */ _uuid(ZodUUID, params);
}
function uuidv4(params) {
  return /* @__PURE__ */ _uuidv4(ZodUUID, params);
}
function uuidv6(params) {
  return /* @__PURE__ */ _uuidv6(ZodUUID, params);
}
function uuidv7(params) {
  return /* @__PURE__ */ _uuidv7(ZodUUID, params);
}
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return /* @__PURE__ */ _url(ZodURL, params);
}
function httpUrl(params) {
  return /* @__PURE__ */ _url(ZodURL, {
    protocol: httpProtocol,
    hostname: domain,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function emoji2(params) {
  return /* @__PURE__ */ _emoji2(ZodEmoji, params);
}
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function nanoid2(params) {
  return /* @__PURE__ */ _nanoid(ZodNanoID, params);
}
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid3(params) {
  return /* @__PURE__ */ _cuid(ZodCUID, params);
}
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid22(params) {
  return /* @__PURE__ */ _cuid2(ZodCUID2, params);
}
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ulid2(params) {
  return /* @__PURE__ */ _ulid(ZodULID, params);
}
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function xid2(params) {
  return /* @__PURE__ */ _xid(ZodXID, params);
}
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ksuid2(params) {
  return /* @__PURE__ */ _ksuid(ZodKSUID, params);
}
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv42(params) {
  return /* @__PURE__ */ _ipv4(ZodIPv4, params);
}
var ZodMAC = /* @__PURE__ */ $constructor("ZodMAC", (inst, def) => {
  $ZodMAC.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function mac2(params) {
  return /* @__PURE__ */ _mac(ZodMAC, params);
}
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv62(params) {
  return /* @__PURE__ */ _ipv6(ZodIPv6, params);
}
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv42(params) {
  return /* @__PURE__ */ _cidrv4(ZodCIDRv4, params);
}
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv62(params) {
  return /* @__PURE__ */ _cidrv6(ZodCIDRv6, params);
}
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base642(params) {
  return /* @__PURE__ */ _base64(ZodBase64, params);
}
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base64url2(params) {
  return /* @__PURE__ */ _base64url(ZodBase64URL, params);
}
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function e1642(params) {
  return /* @__PURE__ */ _e164(ZodE164, params);
}
var ZodCreditCard = /* @__PURE__ */ $constructor("ZodCreditCard", (inst, def) => {
  $ZodCreditCard.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function creditCard2(params) {
  return /* @__PURE__ */ _creditCard(ZodCreditCard, params);
}
var ZodIBAN = /* @__PURE__ */ $constructor("ZodIBAN", (inst, def) => {
  $ZodIBAN.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function iban2(params) {
  return /* @__PURE__ */ _iban(ZodIBAN, params);
}
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function jwt(params) {
  return /* @__PURE__ */ _jwt(ZodJWT, params);
}
var ZodCustomStringFormat = /* @__PURE__ */ $constructor("ZodCustomStringFormat", (inst, def) => {
  $ZodCustomStringFormat.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function stringFormat(format, fnOrRegex, _params = {}) {
  return /* @__PURE__ */ _stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function hostname2(_params) {
  return /* @__PURE__ */ _stringFormat(ZodCustomStringFormat, "hostname", hostname, _params);
}
function hex2(_params) {
  return /* @__PURE__ */ _stringFormat(ZodCustomStringFormat, "hex", hex, _params);
}
function currencyCode2(_params) {
  return /* @__PURE__ */ _stringFormat(ZodCustomStringFormat, "currency_code", currencyCode, _params);
}
function hash(alg, params) {
  const enc = params?.enc ?? "hex";
  const format = `${alg}_${enc}`;
  const regex = regexes_exports[format];
  if (!regex)
    throw new Error(`Unrecognized hash format: ${format}`);
  return /* @__PURE__ */ _stringFormat(ZodCustomStringFormat, format, regex, params);
}
var ZodNumber = /* @__PURE__ */ $constructor(
  "ZodNumber",
  (inst, def) => {
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => numberProcessor(inst, ctx, json2, params);
    inst.isFinite = true;
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: (inst) => {
      const { minimum, exclusiveMinimum } = aggregateChecks(inst);
      return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
    },
    maxValue: (inst) => {
      const { maximum, exclusiveMaximum } = aggregateChecks(inst);
      return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
    },
    isInt: (inst) => {
      const { isInt, multipleOf } = aggregateChecks(inst);
      return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    },
    format: (inst) => aggregateChecks(inst).format ?? null
  }, {
    gt(value, params) {
      return this.check(/* @__PURE__ */ _gt(value, params));
    },
    gte(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    min(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    lt(value, params) {
      return this.check(/* @__PURE__ */ _lt(value, params));
    },
    lte(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    max(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(/* @__PURE__ */ _gt(0, params));
    },
    nonnegative(params) {
      return this.check(/* @__PURE__ */ _gte(0, params));
    },
    negative(params) {
      return this.check(/* @__PURE__ */ _lt(0, params));
    },
    nonpositive(params) {
      return this.check(/* @__PURE__ */ _lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    },
    step(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    },
    finite() {
      return this;
    }
  })
);
function number2(params) {
  return /* @__PURE__ */ _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
function float32(params) {
  return /* @__PURE__ */ _float32(ZodNumberFormat, params);
}
function float64(params) {
  return /* @__PURE__ */ _float64(ZodNumberFormat, params);
}
function int32(params) {
  return /* @__PURE__ */ _int32(ZodNumberFormat, params);
}
function uint32(params) {
  return /* @__PURE__ */ _uint32(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => booleanProcessor(inst, ctx, json2, params);
});
function boolean2(params) {
  return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ $constructor(
  "ZodBigInt",
  (inst, def) => {
    $ZodBigInt.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => bigintProcessor(inst, ctx, json2, params);
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: (inst) => aggregateChecks(inst).minimum ?? null,
    maxValue: (inst) => aggregateChecks(inst).maximum ?? null,
    format: (inst) => aggregateChecks(inst).format ?? null
  }, {
    gte(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    min(value, params) {
      return this.check(/* @__PURE__ */ _gte(value, params));
    },
    gt(value, params) {
      return this.check(/* @__PURE__ */ _gt(value, params));
    },
    lt(value, params) {
      return this.check(/* @__PURE__ */ _lt(value, params));
    },
    lte(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    max(value, params) {
      return this.check(/* @__PURE__ */ _lte(value, params));
    },
    positive(params) {
      return this.check(/* @__PURE__ */ _gt(BigInt(0), params));
    },
    negative(params) {
      return this.check(/* @__PURE__ */ _lt(BigInt(0), params));
    },
    nonpositive(params) {
      return this.check(/* @__PURE__ */ _lte(BigInt(0), params));
    },
    nonnegative(params) {
      return this.check(/* @__PURE__ */ _gte(BigInt(0), params));
    },
    multipleOf(value, params) {
      return this.check(/* @__PURE__ */ _multipleOf(value, params));
    }
  })
);
function bigint2(params) {
  return /* @__PURE__ */ _bigint(ZodBigInt, params);
}
var ZodBigIntFormat = /* @__PURE__ */ $constructor("ZodBigIntFormat", (inst, def) => {
  $ZodBigIntFormat.init(inst, def);
  ZodBigInt.init(inst, def);
});
function int64(params) {
  return /* @__PURE__ */ _int64(ZodBigIntFormat, params);
}
function uint64(params) {
  return /* @__PURE__ */ _uint64(ZodBigIntFormat, params);
}
var ZodSymbol = /* @__PURE__ */ $constructor("ZodSymbol", (inst, def) => {
  $ZodSymbol.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => symbolProcessor(inst, ctx, json2, params);
});
function symbol(params) {
  return /* @__PURE__ */ _symbol(ZodSymbol, params);
}
var ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
  $ZodUndefined.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => undefinedProcessor(inst, ctx, json2, params);
});
function _undefined3(params) {
  return /* @__PURE__ */ _undefined2(ZodUndefined, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullProcessor(inst, ctx, json2, params);
});
function _null3(params) {
  return /* @__PURE__ */ _null2(ZodNull, params);
}
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => anyProcessor(inst, ctx, json2, params);
});
function any() {
  return /* @__PURE__ */ _any(ZodAny);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unknownProcessor(inst, ctx, json2, params);
});
function unknown() {
  return /* @__PURE__ */ _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => neverProcessor(inst, ctx, json2, params);
});
function never(params) {
  return /* @__PURE__ */ _never(ZodNever, params);
}
var ZodVoid = /* @__PURE__ */ $constructor("ZodVoid", (inst, def) => {
  $ZodVoid.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => voidProcessor(inst, ctx, json2, params);
});
function _void2(params) {
  return /* @__PURE__ */ _void(ZodVoid, params);
}
var ZodDate = /* @__PURE__ */ $constructor(
  "ZodDate",
  (inst, def) => {
    $ZodDate.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => dateProcessor(inst, ctx, json2, params);
    inst.min = (value, params) => inst.check(/* @__PURE__ */ _gte(value, params));
    inst.max = (value, params) => inst.check(/* @__PURE__ */ _lte(value, params));
  },
  /* @__PURE__ */ util_exports.derived({
    minDate: (inst) => {
      const { minimum } = aggregateChecks(inst);
      return minimum ? new Date(minimum) : null;
    },
    maxDate: (inst) => {
      const { maximum } = aggregateChecks(inst);
      return maximum ? new Date(maximum) : null;
    }
  }, {})
);
function date2(params) {
  return /* @__PURE__ */ _date(ZodDate, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => arrayProcessor(inst, ctx, json2, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(/* @__PURE__ */ _minLength(n, params));
  },
  nonempty(params) {
    return this.check(/* @__PURE__ */ _minLength(1, params));
  },
  max(n, params) {
    return this.check(/* @__PURE__ */ _maxLength(n, params));
  },
  length(n, params) {
    return this.check(/* @__PURE__ */ _length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return /* @__PURE__ */ _array(ZodArray, element, params);
}
function keyof(schema) {
  const shape = schema._zod.def.shape;
  return _enum(Object.keys(shape));
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => objectProcessor(inst, ctx, json2, params);
  util_exports.installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
  keyof() {
    return _enum(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: void 0 }));
  },
  extend(incoming) {
    return util_exports.extend(this, incoming);
  },
  safeExtend(incoming) {
    return util_exports.safeExtend(this, incoming);
  },
  merge(other) {
    return util_exports.merge(this, other);
  },
  pick(mask) {
    return util_exports.pick(this, mask);
  },
  omit(mask) {
    return util_exports.omit(this, mask);
  },
  partial(...args) {
    return util_exports.partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return util_exports.partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return util_exports.required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: never(),
    ...util_exports.normalizeParams(params)
  });
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodXor = /* @__PURE__ */ $constructor("ZodXor", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodXor.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function xor(options, params) {
  return new ZodXor({
    type: "union",
    options,
    inclusive: false,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => intersectionProcessor(inst, ctx, json2, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => tupleProcessor(inst, ctx, json2, params);
}, {
  rest(rest) {
    return this.clone({
      ...this._zod.def,
      rest
    });
  },
  partial() {
    const def = this._zod.def;
    if (def.checks?.length)
      throw new Error(".partial() cannot be used on tuple schemas containing refinements");
    return this.clone({
      ...def,
      items: def.items.map((item2) => new ZodOptional({ type: "optional", innerType: item2 }))
    });
  }
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...util_exports.normalizeParams(params)
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => recordProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function partialRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params),
    partial: true
  });
}
function looseRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    mode: "loose",
    ...util_exports.normalizeParams(params)
  });
}
var ZodMap = /* @__PURE__ */ $constructor("ZodMap", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodMap.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => mapProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
  inst.min = (...args) => inst.check(/* @__PURE__ */ _minSize(...args));
  inst.nonempty = (params) => inst.check(/* @__PURE__ */ _minSize(1, params));
  inst.max = (...args) => inst.check(/* @__PURE__ */ _maxSize(...args));
  inst.size = (...args) => inst.check(/* @__PURE__ */ _size(...args));
});
function map(keyType, valueType, params) {
  return new ZodMap({
    type: "map",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSet = /* @__PURE__ */ $constructor("ZodSet", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodSet.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => setProcessor(inst, ctx, json2, params);
  inst.min = (...args) => inst.check(/* @__PURE__ */ _minSize(...args));
  inst.nonempty = (params) => inst.check(/* @__PURE__ */ _minSize(1, params));
  inst.max = (...args) => inst.check(/* @__PURE__ */ _maxSize(...args));
  inst.size = (...args) => inst.check(/* @__PURE__ */ _size(...args));
});
function set(valueType, params) {
  return new ZodSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => enumProcessor(inst, ctx, json2, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function nativeEnum(entries, params) {
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => literalProcessor(inst, ctx, json2, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodFile = /* @__PURE__ */ $constructor("ZodFile", (inst, def) => {
  $ZodFile.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => fileProcessor(inst, ctx, json2, params);
  inst.min = (size, params) => inst.check(/* @__PURE__ */ _minSize(size, params));
  inst.max = (size, params) => inst.check(/* @__PURE__ */ _maxSize(size, params));
  inst.mime = (types, params) => inst.check(/* @__PURE__ */ _mime(Array.isArray(types) ? types : [types], params));
});
function file(params) {
  return /* @__PURE__ */ _file(ZodFile, params);
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => transformProcessor(inst, ctx, json2, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullableProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
function nullish2(innerType) {
  return optional(nullable(innerType));
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => defaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => prefaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nonoptionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSuccess = /* @__PURE__ */ $constructor("ZodSuccess", (inst, def) => {
  $ZodSuccess.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => successProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function success(innerType) {
  return new ZodSuccess({
    type: "success",
    innerType
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => catchProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : util_exports.constantCatch(catchValue)
  });
}
var ZodNaN = /* @__PURE__ */ $constructor("ZodNaN", (inst, def) => {
  $ZodNaN.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nanProcessor(inst, ctx, json2, params);
});
function nan(params) {
  return /* @__PURE__ */ _nan(ZodNaN, params);
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => pipeProcessor(inst, ctx, json2, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodCodec = /* @__PURE__ */ $constructor("ZodCodec", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodCodec.init(inst, def);
});
function codec(in_, out, params) {
  return new ZodCodec({
    type: "pipe",
    in: in_,
    out,
    transform: params.decode,
    reverseTransform: params.encode
  });
}
function invertCodec(codec2) {
  const def = codec2._zod.def;
  return new ZodCodec({
    type: "pipe",
    in: def.out,
    out: def.in,
    transform: def.reverseTransform,
    reverseTransform: def.transform
  });
}
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => readonlyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodTemplateLiteral = /* @__PURE__ */ $constructor("ZodTemplateLiteral", (inst, def) => {
  $ZodTemplateLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => templateLiteralProcessor(inst, ctx, json2, params);
});
function templateLiteral(parts2, params) {
  return new ZodTemplateLiteral({
    type: "template_literal",
    parts: parts2,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => lazyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodPromise = /* @__PURE__ */ $constructor("ZodPromise", (inst, def) => {
  $ZodPromise.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => promiseProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function promise(innerType) {
  return new ZodPromise({
    type: "promise",
    innerType
  });
}
var ZodFunction = /* @__PURE__ */ $constructor("ZodFunction", (inst, def) => {
  $ZodFunction.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => functionProcessor(inst, ctx, json2, params);
});
function _function(params) {
  return new ZodFunction({
    type: "function",
    input: Array.isArray(params?.input) ? tuple(params?.input) : params?.input ?? array(unknown()),
    output: params?.output ?? unknown()
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => customProcessor(inst, ctx, json2, params);
});
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
function custom(fn, _params) {
  return /* @__PURE__ */ _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return /* @__PURE__ */ _superRefine(fn, params);
}
var describe2 = describe;
var meta2 = meta;
var ZodInstanceOf = /* @__PURE__ */ $constructor("ZodInstanceOf", (inst, def) => {
  ZodCustom.init(inst, def);
}, {
  properties(shape, params) {
    return this.check(/* @__PURE__ */ _properties(shape, params));
  }
});
function _instanceof(cls, params = {}) {
  const inst = new ZodInstanceOf({
    type: "custom",
    check: "custom",
    fn: (data) => data instanceof cls,
    abort: true,
    ...util_exports.normalizeParams(params)
  });
  inst._zod.bag.Class = cls;
  inst._zod.check = (payload) => {
    if (!(payload.value instanceof cls)) {
      payload.issues.push({
        code: "invalid_type",
        expected: cls.name,
        input: payload.value,
        inst,
        path: [...inst._zod.def.path ?? []]
      });
    }
  };
  return inst;
}
var stringbool = (...args) => /* @__PURE__ */ _stringbool({
  Codec: ZodCodec,
  Boolean: ZodBoolean,
  String: ZodString
}, ...args);
function json(params) {
  const jsonSchema = lazy(() => {
    return union([string2(params), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date3,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
function datetime2(params) {
  return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
}
function date3(params) {
  return /* @__PURE__ */ _isoDate(ZodISODate, params);
}
function time2(params) {
  return /* @__PURE__ */ _isoTime(ZodISOTime, params);
}
function duration2(params) {
  return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
}
var z = {
  ...schemas_exports2,
  ...checks_exports2,
  iso: iso_exports
};

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-FTEX4OOT.js
function pathText(path) {
  if (path.length === 0) return "the value";
  return path.map((part, index) => typeof part === "number" ? `[${part}]` : index === 0 ? String(part) : `.${String(part)}`).join("");
}
function problemsOf(error2) {
  return error2.issues.map((issue2) => `${pathText(issue2.path)}: ${issue2.message}`);
}
function validator(name, schema) {
  let generated;
  const check2 = (value) => {
    const result = schema.safeParse(value);
    return result.success ? { ok: true, value: result.data } : { ok: false, problems: problemsOf(result.error) };
  };
  return {
    name,
    check: check2,
    parse(value) {
      const checked = check2(value);
      if (checked.ok) return checked.value;
      throw new Error(`${name}: the value breaks the schema:
- ${checked.problems.join("\n- ")}`);
    },
    jsonSchema() {
      generated ??= toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any" });
      return structuredClone(generated);
    }
  };
}

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-SWSUBLXW.js
var text = (max) => string2().max(max);
var httpsUrl = string2().max(2048).refine((value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "must be an https URL");
var timestamp = iso_exports.datetime({ offset: true });
var date4 = union([timestamp, string2().regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date-time with an offset, or a date")]);
var item = {
  id: string2().min(1).max(128),
  url: httpsUrl.optional(),
  ask: text(200).optional()
};
var IMAGE_DATA_URI_MAX = 1024 * 1024 - 4 * 1024;
var agenda = object({
  items: array(
    object({
      ...item,
      title: text(120),
      start: date4,
      end: date4.optional(),
      allDay: boolean2().optional(),
      location: text(120).optional(),
      calendar: text(60).optional(),
      joinUrl: httpsUrl.optional()
    }).strict()
  ).max(50),
  rangeEnd: date4.optional()
}).strict();
var inbox = object({
  unread: number2().int().nonnegative().nullable(),
  unit: text(20).optional(),
  label: text(60).optional(),
  items: array(
    object({
      ...item,
      title: text(120),
      from: text(60).optional(),
      preview: text(200).optional(),
      at: timestamp,
      count: number2().int().nonnegative().optional(),
      important: boolean2().optional()
    }).strict()
  ).max(30)
}).strict();
var metric = object({
  label: text(40),
  value: union([number2().finite(), text(20)]),
  unit: text(10).optional(),
  delta: object({
    value: number2().finite(),
    direction: _enum(["up", "down", "flat"]),
    good: boolean2().optional()
  }).strict().optional(),
  spark: array(number2().finite()).max(48).optional()
}).strict();
var list = object({
  items: array(
    object({
      id: item.id,
      text: text(200),
      done: boolean2().optional(),
      note: text(200).optional(),
      due: date4.optional()
    }).strict()
  ).max(50),
  editable: boolean2()
}).strict();
var progress = object({
  label: text(60),
  value: number2().nonnegative(),
  max: number2().positive(),
  steps: array(object({ label: text(40), done: boolean2() }).strict()).max(12).optional(),
  eta: timestamp.optional()
}).strict().refine((value) => value.value <= value.max, { message: "value must not exceed max", path: ["value"] });
var note = object({ markdown: text(16 * 1024) }).strict();
var links = object({
  items: array(
    object({
      ...item,
      title: text(60),
      url: httpsUrl,
      hint: text(60).optional()
    }).strict()
  ).max(12)
}).strict();
var countdown = object({
  label: text(60),
  target: timestamp,
  style: _enum(["relative", "timer"])
}).strict();
var image = object({
  url: httpsUrl.optional(),
  dataUri: string2().max(IMAGE_DATA_URI_MAX).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "must be a base64 data URI of a png, jpeg or webp image").optional(),
  alt: string2().min(1).max(200),
  caption: text(120).optional()
}).strict().refine((value) => value.url === void 0 !== (value.dataUri === void 0), { message: "give exactly one of url and dataUri" });
var thread = object({
  subject: text(200),
  messages: array(
    object({
      ...item,
      from: text(120),
      at: timestamp,
      body: text(4e3),
      quoted: text(4e3).optional()
    }).strict()
  ).min(1).max(50)
}).strict();
var table = object({
  columns: array(object({ key: string2().regex(/^[A-Za-z0-9_-]{1,40}$/), label: text(40) }).strict()).min(1).max(8),
  rows: array(record(string2(), union([text(200), number2().finite(), boolean2(), _null3()]))).max(100)
}).strict();
var record2 = object({
  title: text(120),
  fields: array(object({ label: text(60), value: text(400) }).strict()).min(1).max(24)
}).strict();
var OUTPUTS = {
  agenda: validator("output.agenda", agenda),
  inbox: validator("output.inbox", inbox),
  metric: validator("output.metric", metric),
  list: validator("output.list", list),
  progress: validator("output.progress", progress),
  note: validator("output.note", note),
  links: validator("output.links", links),
  countdown: validator("output.countdown", countdown),
  image: validator("output.image", image),
  thread: validator("output.thread", thread),
  table: validator("output.table", table),
  record: validator("output.record", record2)
};
var OUTPUT_NAMES = Object.keys(OUTPUTS);
function isOutputName(name) {
  return typeof name === "string" && Object.hasOwn(OUTPUTS, name);
}
function isExtensionOutput(name) {
  return typeof name === "string" && EXTENSION_NAME.test(name);
}

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-QO4BENAJ.js
var METHOD_NAME = /^[a-z][a-z0-9_]*$/;
var MCP_METHOD_NAME = /^mcp:(?:[a-z0-9][a-z0-9_.-]{0,99}|\*)$/;
var SOURCE_ID = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;
var SCOPE_KEY = /^[a-z][a-z0-9_]{0,31}$/;
var OPERATION = /^[A-Za-z][A-Za-z0-9._-]{0,199}$/;
var HOST = /^(?:\*\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
var SCHEME = /^[a-z][a-z0-9+.-]{0,31}$/;
var VENDOR_ID = /^[a-z][a-z0-9-]{0,31}$/;
var DOMAIN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
var ICON_TYPE = /^image\/[a-z0-9][a-z0-9.+-]*$/;
var FILE_PATH = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*\.md$/;
var PRICE_PER = /^[a-z][a-z0-9-]{0,31}$/;
var PROFILE_REF = "#/options/properties/accounts/additionalProperties";
var nonEmpty = (max) => string2().min(1).max(max);
var vendor = strictObject({
  id: string2().regex(VENDOR_ID, { error: "must be a lowercase vendor id such as google" }),
  name: nonEmpty(80),
  domain: string2().regex(DOMAIN, { error: "must be a domain such as google.com, with no scheme or path" })
}).describe("Who makes the provider the plugin talks to.");
var icon = strictObject({
  src: string2().min(1).max(200).describe("A path inside the installed package, such as assets/icon.svg."),
  type: string2().regex(ICON_TYPE, { error: "must be an image MIME type such as image/svg+xml" })
}).describe("One icon the package ships.");
var host = strictObject({
  opencode: literal(OPENCODE_RANGE, { error: `must be exactly "${OPENCODE_RANGE}" in version 1 of the contract` }),
  tested: array(string2().min(1).max(40)).min(1).describe(`The OpenCode releases CI ran. It includes ${TESTED_OPENCODE}.`)
}).superRefine((value, context) => {
  if (!value.tested.includes(TESTED_OPENCODE)) context.addIssue({ code: "custom", path: ["tested"], message: `must include ${TESTED_OPENCODE}, the release this contract is tested on` });
  if (new Set(value.tested).size !== value.tested.length) context.addIssue({ code: "custom", path: ["tested"], message: "must not repeat a release" });
}).describe("The OpenCode range, and the releases the plugin was tested on.");
var plugin = strictObject({
  name: string2().regex(PLUGIN_NAME, { error: "must be 2 to 31 lowercase letters or digits, with no hyphen" }),
  title: nonEmpty(80),
  summary: nonEmpty(300),
  vendor,
  icons: array(icon).min(1).describe("At least one icon; a consumer picks the size it needs."),
  host
}).describe("The plugin's identity, title, summary, vendor, icons and OpenCode range.");
var accountsInfo = strictObject({
  via: _enum(ACCOUNT_MECHANISMS),
  profile: strictObject({ $ref: literal(PROFILE_REF, { error: `must be { "$ref": "${PROFILE_REF}" }` }) }).describe("A JSON-Schema $ref to the profile schema in options.").optional(),
  owner: string2().regex(SCHEME, { error: "must be a scheme such as mailto" })
}).describe("How accounts work. Absent: the plugin signs in to nothing.");
var methodName = string2().refine((value) => METHOD_NAME.test(value) || MCP_METHOD_NAME.test(value), {
  error: "must be a method name such as events_list, or mcp:<tool> / mcp:*"
});
var methodItem = strictObject({
  class: _enum(METHOD_CLASSES),
  accounts: _enum(METHOD_ACCOUNTS).optional().describe("optional when the method takes an account, none when it does not. Defaults to none."),
  operations: array(string2().regex(OPERATION, { error: "must be a provider operation of letters, digits, dots, underscores or hyphens" })).min(1).optional(),
  plans: literal(true).optional().describe("The method dry-runs a change and answers { planId, method }."),
  commits: methodName.optional().describe("The planning method this method commits. It then takes only { planId }."),
  effect: _enum(METHOD_EFFECTS).optional().describe("A narrowing of the access setting: ask or deny, never allow."),
  pinned: literal(true).optional().describe("The one method Code Mode sends on every turn. None by default.")
}).superRefine((value, context) => {
  if (value.plans === true && value.commits !== void 0) context.addIssue({ code: "custom", path: ["commits"], message: "a method either plans a change or commits one, not both" });
  if (value.commits !== void 0 && !METHOD_NAME.test(value.commits)) {
    context.addIssue({ code: "custom", path: ["commits"], message: "must name a declared method" });
  }
  if (value.operations !== void 0 && new Set(value.operations).size !== value.operations.length) {
    context.addIssue({ code: "custom", path: ["operations"], message: "must not repeat an operation" });
  }
}).describe("One callable: a contract method, a plugin tool or a pass-through MCP tool.");
var service = strictObject({
  id: string2().min(1).max(SERVICE_ID_MAX),
  label: string2().min(1).max(SERVICE_LABEL_MAX)
}).describe("The outside system a source belongs to. Sources with the same id are one service with one label.");
var price = strictObject({
  per: string2().regex(PRICE_PER, { error: "must be a lowercase word such as post or call" }),
  usd: number2().finite().nonnegative()
});
var cost = strictObject({
  class: _enum(COST_CLASSES),
  units: array(price).min(1).optional()
}).superRefine((value, context) => {
  if (value.class === "free" && value.units !== void 0) context.addIssue({ code: "custom", path: ["units"], message: "a free source states no price units" });
  if (value.class !== "free" && value.units === void 0) context.addIssue({ code: "custom", path: ["units"], message: `a ${value.class} source must state its price units` });
}).describe("What one read costs. A billed or metered source states its price units.");
var scope = strictObject({
  keys: array(string2().regex(SCOPE_KEY, { error: "must be a lowercase scope key such as channels" })).min(1).describe("The keys a person confirms: labels, channels, repositories."),
  describe: string2().min(1).max(200),
  suggest: strictObject({ method: methodName, operations: array(string2().regex(OPERATION)).min(1).optional() }).describe("The read-only method that lists the values a person may pick.").optional()
}).superRefine((value, context) => {
  if (new Set(value.keys).size !== value.keys.length) context.addIssue({ code: "custom", path: ["keys"], message: "must not repeat a key" });
}).describe("What a person confirms at consent.");
var cadence = strictObject({
  providerMinMinutes: number2().int().positive().optional(),
  suggestMinutes: number2().int().positive().optional()
}).describe("The provider's floor between reads, and a suggested cadence, in minutes.");
var detail = strictObject({
  id: string2().regex(SOURCE_ID, { error: "must be a dotted, lowercase detail id such as gws.gmail.message" }),
  method: methodName,
  from: array(_enum(DETAIL_FIELDS)).min(1).describe("The event fields the detail's input comes from: identifiers, never the event's prose.")
}).describe("One follow-up read of an event's detail.");
var sourceBase = {
  id: string2().regex(SOURCE_ID, { error: "must be a dotted, lowercase source id such as gws.gmail" }),
  method: methodName.describe("The declared method that reads this source."),
  input: record(string2(), unknown()).optional().describe("The fixed input that selects this source."),
  service: service.optional(),
  operations: array(string2().regex(OPERATION, { error: "must be a provider operation" })).min(1).optional(),
  scope: scope.optional(),
  cadence: cadence.optional(),
  signals: array(_enum(SOURCE_SIGNALS)).min(1).optional(),
  private: boolean2().optional(),
  cost,
  maxBytes: number2().int().positive().max(MAX_BYTES_LIMIT, { error: `must be at most ${MAX_BYTES_LIMIT} (1 MB)` }).optional(),
  details: array(detail).min(1).optional(),
  facts: array(_enum(FACT_TYPES)).min(1).optional(),
  hints: array(string2().max(200).regex(FILE_PATH, { error: "must be a relative path in the package ending in .md" })).min(1).optional(),
  urlHosts: array(string2().regex(HOST, { error: "must be a lowercase domain, or *. and a domain for its subdomains" })).min(1).optional().describe("The hosts an event's url and thumbnail may point at.")
};
var eventsSource = strictObject({
  ...sourceBase,
  kind: literal("events"),
  reads: string2().describe("A core event kind, or x-<name>/<kind>."),
  thumbnails: literal(true).optional().describe("The source can answer an event's thumbnail (#42). Requires urlHosts.")
}).superRefine((value, context) => {
  if (value.thumbnails === true && value.urlHosts === void 0) context.addIssue({ code: "custom", path: ["thumbnails"], message: "a source that declares thumbnails must declare urlHosts" });
  if (value.signals !== void 0 && new Set(value.signals).size !== value.signals.length) context.addIssue({ code: "custom", path: ["signals"], message: "must not repeat a signal" });
  if (value.details !== void 0 && new Set(value.details.map((entry) => entry.id)).size !== value.details.length) context.addIssue({ code: "custom", path: ["details"], message: "must not repeat a detail id" });
}).describe("An events source: append-only items read with a cursor.");
var snapshotSource = strictObject({
  ...sourceBase,
  kind: literal("snapshot"),
  output: string2().describe("A registry output name such as agenda, or x-<namespace>/<name>.")
}).superRefine((value, context) => {
  const output = value.output;
  if (!isOutputName(output) && !isExtensionOutput(output)) context.addIssue({ code: "custom", path: ["output"], message: `"${output}" is not a registered output and not an x-<namespace>/<name>` });
  if (value.signals !== void 0 && new Set(value.signals).size !== value.signals.length) context.addIssue({ code: "custom", path: ["signals"], message: "must not repeat a signal" });
  if (value.details !== void 0) context.addIssue({ code: "custom", path: ["details"], message: "only an events source has detail reads" });
}).describe("A snapshot source: the latest state, read on demand.");
var source = discriminatedUnion("kind", [eventsSource, snapshotSource]).describe("A source: an events feed or a snapshot.");
var action = strictObject({
  id: string2().regex(SOURCE_ID, { error: "must be a dotted, lowercase action id such as gws.gmail.send" }),
  effect: _enum(ACTION_EFFECTS),
  preview: methodName.describe("The declared method that previews the action. It writes nothing."),
  commit: methodName.describe("The declared method that commits the action. A different method from preview."),
  input: record(string2(), unknown()).describe("JSON Schema 2020-12 for the caller's input."),
  output: record(string2(), unknown()).describe("JSON Schema 2020-12 for the answer's output.")
}).describe("One write an app can offer a person.");
var events = strictObject({
  changed: strictObject({}).optional().describe("The plugin knows a source changed."),
  status: strictObject({}).optional().describe("The plugin's state changed."),
  account: strictObject({}).optional().describe("An account signed in, out, or needs sign-in.")
}).describe("The bus events the plugin emits. Each is declared with an empty object.");
var versionField = literal(MANIFEST_VERSION);
var optionsField = record(string2(), unknown()).describe("JSON Schema 2020-12 of the plugin's options. It must include access.");
var normalizedMCPTool = (tool) => tool.replace(/[^A-Za-z0-9_-]/g, "_");
var methodsField = record(methodName, methodItem).superRefine((methods, context) => {
  const groups = /* @__PURE__ */ new Map();
  for (const name of Object.keys(methods)) {
    if (!name.startsWith("mcp:") || name === "mcp:*") continue;
    const tool = name.slice("mcp:".length);
    const effective = normalizedMCPTool(tool);
    const group = groups.get(effective);
    if (group === void 0) groups.set(effective, [name]);
    else group.push(name);
  }
  for (const [effective, names] of groups) {
    if (names.length < 2) continue;
    for (const name of names) {
      context.addIssue({
        code: "custom",
        path: [name],
        message: `collides with ${names.filter((other) => other !== name).join(", ")} after OpenCode rewrites both MCP tool names to ${effective}`
      });
    }
  }
}).describe("Every callable, including pass-through MCP tools.");
var sourcesField = array(source);
var actionsField = array(action);
var eventsField = events;
var top = looseObject({
  version: versionField,
  plugin,
  accounts: accountsInfo.optional(),
  options: optionsField,
  methods: methodsField,
  sources: sourcesField,
  actions: actionsField,
  events: eventsField
});

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-OJKZGBMB.js
var DEFAULT_ALIAS = "default";
var ALIAS_PATTERN = /^[a-z][a-z0-9]{0,31}$/;
function isAlias(value) {
  return typeof value === "string" && ALIAS_PATTERN.test(value);
}
var ACCOUNT_STATES = ["ready", "needs_sign_in", "error"];
var REASON_MAX = 160;
var STATUS_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    host: {
      type: "object",
      properties: {
        version: { type: "string", minLength: 1 },
        range: { type: "string", minLength: 1 },
        tested: { type: "array", minItems: 1, items: { type: "string" } }
      },
      required: ["version", "range", "tested"],
      additionalProperties: false
    },
    state: { type: "string", enum: [...ACCOUNT_STATES] },
    accounts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          alias: { type: "string", minLength: 1 },
          state: { type: "string", enum: [...ACCOUNT_STATES] },
          owner: { type: "object", additionalProperties: true },
          reason: { type: "string", maxLength: REASON_MAX }
        },
        required: ["alias", "state"],
        additionalProperties: false
      }
    },
    unguardedAgents: { type: "array", items: { type: "string" } },
    nextStep: {}
  },
  required: ["name", "version", "host", "state", "accounts", "unguardedAgents", "nextStep"],
  additionalProperties: false
};

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-LJBRNDIR.js
function isMcpMethod(method) {
  return method.startsWith("mcp:");
}
function methodAction(name, method) {
  return `${name}.${method}`;
}
function normalizeToolName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function toolAction(server, tool) {
  const namespace = server.replaceAll(".", "_");
  return tool === "*" ? `${namespace}_*` : `${namespace}_${normalizeToolName(tool)}`;
}
function effectFor(method, level) {
  if (method.effect === "deny") return "deny";
  const base = method.class === "read" ? "allow" : level === "all" ? "allow" : level === "ask-changes" ? "ask" : "deny";
  return method.effect === "ask" && base === "allow" ? "ask" : base;
}
function serverOf(name, alias, aliases) {
  if (!isAlias(alias)) return { ok: false, problems: [`"${alias}" is not an account alias: lowercase letters and digits, starting with a letter`] };
  if (!aliases.includes(alias)) return { ok: false, problems: [`the account alias "${alias}" is not one this plugin declares`] };
  return { ok: true, value: alias === DEFAULT_ALIAS ? name : `${name}-${alias}` };
}
function rulesFor(manifest2, level, aliases = [DEFAULT_ALIAS]) {
  const name = manifest2.plugin.name;
  const declared = aliases.length === 0 ? [DEFAULT_ALIAS] : aliases;
  const methods = Object.entries(manifest2.methods);
  const ordered = [...methods].sort(([left], [right]) => Number(!left.endsWith(":*")) - Number(!right.endsWith(":*")));
  const rules = [];
  const push = (rule) => {
    const existing = rules.findIndex((held) => held.action === rule.action && held.resource === rule.resource);
    if (existing !== -1) rules.splice(existing, 1);
    rules.push(rule);
  };
  for (const [method, item2] of ordered) {
    const effect = effectFor(item2, level);
    if (isMcpMethod(method)) {
      const tool = method.slice("mcp:".length);
      for (const alias of declared) {
        const server = serverOf(name, alias, declared);
        if (!server.ok) throw new Error(`access: ${server.problems.join("; ")}`);
        push({ action: toolAction(server.value, tool), resource: "*", effect });
      }
      continue;
    }
    push({ action: methodAction(name, method), resource: "*", effect });
  }
  return rules;
}
function evaluate(rules, action2, resource = "*") {
  return rules.findLast((rule) => wildcard(rule.action, action2) && wildcard(rule.resource, resource))?.effect ?? "ask";
}
function matches(pattern, value) {
  return wildcard(pattern, value);
}
var wildcard = (pattern, value) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`).test(value);
function sameRule(held, rule) {
  return held.action === rule.action && held.resource === rule.resource && held.effect === rule.effect;
}
var rank = (effect) => effect === "allow" ? 2 : effect === "ask" ? 1 : 0;
var concrete = (action2) => action2.replaceAll("*", "x").replaceAll("?", "x");
function overridden(agent, rule) {
  const index = agent.permissions.findIndex((held) => sameRule(held, rule));
  if (index === -1) return true;
  const action2 = concrete(rule.action);
  if (rank(evaluate(agent.permissions, action2, rule.resource)) > rank(rule.effect)) return true;
  for (const later of agent.permissions.slice(index + 1)) {
    if (rank(later.effect) <= rank(rule.effect)) continue;
    if (later.resource === "*") continue;
    if (matches(later.action, action2) || matches(rule.action, concrete(later.action))) return true;
  }
  return false;
}
function unguardedAgents(agents, rules) {
  return agents.filter((agent) => rules.some((rule) => overridden(agent, rule))).map((agent) => agent.id).sort();
}

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/chunks/chunk-ED3MMWUJ.js
import { TextDecoder } from "node:util";
var decoder = new TextDecoder("utf-8", { fatal: true });

// node_modules/@we-the-rebel-alliance/plugin-contract/dist/register.js
var PLAN_TTL_MS = 15 * 6e4;
var reach = strictObject({ id: string2().min(1).max(320), label: string2().max(200).optional() });
var planAnswer = looseObject({
  method: string2().min(1),
  output: unknown().optional(),
  reaches: array(reach).max(20).optional(),
  changes: array(string2().min(1).max(500)).max(20).optional(),
  cost: unknown().optional(),
  trust: literal("untrusted").optional()
});
var commit = strictObject({ planId: string2().min(1) });
function assertHost(context, manifest2) {
  if (hostInRange(context.app.version) || context.options?.["allowUntestedHost"] === true) return;
  throw new Error(
    `HOST_UNTESTED: ${manifest2.plugin.name} supports ${manifest2.plugin.host.opencode}, and OpenCode ${context.app.version} is outside it. Next step: install OpenCode 2.4.1, or set allowUntestedHost.`
  );
}

// src/provider/endpoint.ts
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
var withoutUrlSecrets = (text3) => text3.replace(/\bhttps?:\/\/[^\s"'<>]+/gi, (url2) => url2.replace(/^(https?:\/\/)[^/?#@]*@/i, "$1").replace(/[?#].*$/s, ""));
var oneLine = (text3) => text3.replace(BIDI, "").replace(CONTROLS, " ").replace(/\s+/g, " ").trim();
function cut(text3, limit) {
  const characters = Array.from(text3);
  return characters.length > limit ? `${characters.slice(0, limit - 1).join("")}\u2026` : text3;
}
function shortReason(text3) {
  const reason = oneLine(SECRETS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), withoutUrlSecrets(text3))).replace(/[.\s]+$/, "");
  if (reason === "") return void 0;
  return cut(reason, REASON_LIMIT);
}

// src/provider/errors.ts
var errorText = (code, message, nextStep) => `${code}: ${message.replace(/[.\s]+$/, "")}. Next step: ${nextStep}`;
var NEXT_STEPS = {
  ENGINE_MISSING: "Voice is optional: run /voice-install to download the pinned speech engine, then run /voice-status.",
  ENGINE_UNVERIFIED: "Run /voice-install to replace the engine; if it persists, report it.",
  ENGINE_INCOMPATIBLE: "Run /voice-install to install the engine version this plugin needs.",
  UNSUPPORTED_PLATFORM: "Use macOS on Apple silicon or Linux, or set the aurumPath option to a local engine.",
  MODEL_MISSING: "Run /voice-install to download the speech models.",
  MODEL_DOWNLOAD_FAILED: "Retry /voice-install; if it persists, check the network or proxy.",
  INTEGRITY_MISMATCH: "Retry /voice-install; if it persists, report it.",
  MIC_DENIED: "Grant microphone access in System Settings \u2192 Privacy & Security \u2192 Microphone.",
  MIC_UNAVAILABLE: "Connect a microphone, then run /voice-dictate again.",
  AUDIO_DEVICE_MISSING: "Connect an output device, then try again.",
  NO_SPEECH: "Speak again, a little closer to the microphone.",
  AUDIO_TOO_LONG: "Shorten the recording or the text.",
  BAD_AUDIO: "Speak again, or pass plain text to speak.",
  BUSY: "Wait for the current dictation to finish, or press escape to cancel it.",
  TIMEOUT: "Try again, then run the doctor in /voice.",
  CANCELLED: "Nothing to do.",
  SIDECAR_FAILED: "Run the doctor in /voice, then try again.",
  ENGINE_EXITED: "Run the doctor in /voice, then try again.",
  UNSUPPORTED: "Use a supported platform and engine."
};
var EngineError = class extends Error {
  code;
  next;
  /** `ENGINE_MISSING` only: the precise value that was absent, never a path or a secret. */
  missing;
  constructor(code, message, next = NEXT_STEPS[code] ?? "Try again.", missing) {
    super(errorText(code, message, next));
    this.name = "EngineError";
    this.code = code;
    this.next = next;
    this.missing = missing;
  }
};
function asEngineError(error2) {
  if (error2 instanceof EngineError) return error2;
  return new EngineError("SIDECAR_FAILED", "The speech engine failed unexpectedly.");
}
var isCancel = (error2) => error2 instanceof EngineError && error2.code === "CANCELLED";
function fromSidecarCategory(category, message) {
  const text3 = shortReason(message) ?? "The speech engine reported an error.";
  switch (category) {
    case "user":
      return new EngineError("BAD_AUDIO", text3);
    case "environment":
      return new EngineError("SIDECAR_FAILED", text3);
    default:
      return new EngineError("SIDECAR_FAILED", text3);
  }
}
function engineFailure(error2) {
  const failure2 = asEngineError(error2);
  const what = shortReason(failure2.message) ?? "The speech engine failed.";
  return {
    what: what.replace(/^[A-Z][A-Z0-9_]*:\s*/, "").replace(/ Next step: [\s\S]*$/, "").replace(/[.\s]+$/, ""),
    next: failure2.next
  };
}

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
  constructor(host2) {
    this.host = host2;
  }
  get state() {
    return this.phase;
  }
  get active() {
    return this.phase === "preparing" || this.phase === "listening" || this.phase === "transcribing" || this.phase === "sending" || this.phase === "reviewing";
  }
  set(phase, text3) {
    this.phase = phase;
    this.host.status(phase, text3);
  }
  cancelled(generation) {
    return generation !== this.generation || this.abort?.signal.aborted === true;
  }
  fail(error2) {
    if (isCancel(error2)) {
      this.set("idle");
      return;
    }
    const failure2 = asEngineError(error2);
    this.set("failed");
    this.host.toast(failure2.message, "error");
  }
  /** Starts listening. A second call while active ends the turn, like a second press. */
  async start() {
    if (this.active) {
      await this.finish();
      return;
    }
    if (this.phase === "playing") this.host.engine.cancel();
    const generation = ++this.generation;
    const abort = new AbortController();
    this.abort = abort;
    this.finishing = false;
    this.set("preparing");
    let created;
    try {
      created = await this.host.engine.recorder(abort.signal);
    } catch (error2) {
      if (!this.cancelled(generation)) this.fail(error2);
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
      onExit: (error2) => {
        if (ended || this.cancelled(generation)) return;
        ended = true;
        if (error2 !== void 0) {
          this.fail(error2);
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
      const text3 = transcript.text.trim();
      this.host.record(text3);
      const sessionID = this.host.activeSession();
      if (sessionID === void 0) {
        this.set("idle");
        this.host.toast("Open a session to send the transcript", "warning");
        return;
      }
      if (this.host.submitMode() === "review") {
        this.set("reviewing");
        const edited = await this.host.review(text3);
        if (this.cancelled(generation) || edited === void 0 || edited.trim() === "") {
          this.set("idle");
          return;
        }
        this.set("sending");
        await this.host.submit(sessionID, edited.trim());
      } else {
        this.set("sending");
        await this.host.submit(sessionID, text3);
      }
      if (this.cancelled(generation)) return;
      this.set("idle");
      this.host.toast("Sent", "success");
    } catch (error2) {
      if (!this.cancelled(generation)) this.fail(error2);
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
  async speak(text3, options = {}) {
    if (this.active) {
      this.host.toast("Finish the dictation first", "warning");
      return;
    }
    if (this.phase === "playing") {
      this.host.toast("A reply is already playing", "warning");
      return;
    }
    const generation = ++this.generation;
    this.set("playing");
    let path;
    try {
      const speech = await this.host.engine.synthesize(text3, {
        ...options.markdown === true ? { markdown: true } : {},
        ...options.rate === void 0 ? {} : { rate: options.rate }
      });
      path = speech.path;
      if (generation !== this.generation) return;
      await this.host.engine.play(speech.path, { ...options.signal === void 0 ? {} : { signal: options.signal }, ...options.rate === void 0 ? {} : { rate: options.rate } });
      if (generation !== this.generation) return;
      this.set("idle");
    } catch (error2) {
      if (generation === this.generation) {
        if (isCancel(error2)) this.set("idle");
        else this.fail(error2);
      }
    } finally {
      if (path !== void 0) await this.host.engine.release(path).catch(() => void 0);
    }
  }
  /** Stops rendering or playback and returns to idle. The child slot and render are fenced before a new turn. */
  stop() {
    if (this.phase === "playing") {
      this.generation += 1;
      this.host.engine.cancel();
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
  add(text3, at = Date.now()) {
    const value = text3.trim();
    if (value === "") return Promise.resolve();
    const entries = [{ text: value, at }, ...this.store.read()].slice(0, HISTORY_LIMIT);
    return this.store.write(entries);
  }
  clear() {
    return this.store.write([]);
  }
};

// src/handlers/doctor.ts
var modelOf = (models, role) => models?.find((asset) => asset.role === role);
var view = (asset) => asset === void 0 ? null : { name: asset.name, bytes: asset.bytes, licence: asset.licence, state: asset.state, path: asset.path };
var byteLabel = (bytes) => bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`;
var nextStepText = (text3) => cut(oneLine(shortReason(text3) ?? text3), 200);
function nextStepOf(facts, engine, stt, tts) {
  const failure2 = facts.engineError;
  if (failure2 !== void 0) return nextStepText(failure2.next);
  if (facts.problems !== void 0 && facts.problems.length > 0) return nextStepText(facts.problems[0]);
  if (engine === void 0) return nextStepText(NEXT_STEPS.ENGINE_MISSING);
  if (!engine.supported) return nextStepText(NEXT_STEPS.UNSUPPORTED_PLATFORM);
  if (!engine.verified && engine.source === "download") return nextStepText(NEXT_STEPS.ENGINE_UNVERIFIED);
  if (facts.probe !== void 0 && !facts.probe.compatible) {
    if (facts.probe.olderSystem !== void 0) {
      return nextStepText(`The speech engine needs ${facts.probe.olderSystem} from this system's libraries, which are older. Use Ubuntu 24.04, Debian 13 or a newer system.`);
    }
    if (facts.probe.missingLibrary !== void 0) {
      return nextStepText(`The speech engine cannot load ${facts.probe.missingLibrary}. Install the ALSA runtime (libasound2; libasound2t64 on Ubuntu 24.04), then run /voice-status.`);
    }
    return nextStepText(NEXT_STEPS.ENGINE_INCOMPATIBLE);
  }
  if (stt === void 0 || stt.state === "missing" || tts === void 0 || tts.state === "missing") {
    return "Run /voice-install to download the speech models.";
  }
  if (facts.microphone === "denied" || facts.microphone === "restricted") return nextStepText(NEXT_STEPS.MIC_DENIED);
  if (facts.microphone === "not_determined") return "Run /voice-dictate once and allow microphone access.";
  if (facts.microphone === "unknown") return "Run the doctor in /voice to check the microphone.";
  const failed = facts.doctor?.find((check2) => !check2.ok);
  if (failed !== void 0) return nextStepText(failed.next === void 0 ? "Run the doctor in /voice." : failed.next);
  return null;
}
function doctorStateOf(facts, engine, hostVersion) {
  if (hostVersion !== "" && !hostInRange(hostVersion)) return "host_untested";
  const failure2 = facts.engineError;
  if (failure2 !== void 0 && failure2.missing !== "not-installed") return "failed";
  if (facts.problems !== void 0 && facts.problems.length > 0) return "failed";
  if (engine === void 0) return "not_configured";
  if (facts.probe !== void 0 && !facts.probe.compatible) return "failed";
  if (!engine.supported) return "failed";
  return "ready";
}
function problemsOf2(facts, probe, engine) {
  const problems = [...facts.problems ?? []];
  if (facts.engineError !== void 0) problems.push(nextStepText(facts.engineError.message));
  if (probe !== void 0 && !probe.compatible) problems.push(nextStepText(NEXT_STEPS.ENGINE_INCOMPATIBLE));
  if (engine !== void 0 && !engine.verified && engine.source === "download") problems.push(nextStepText(NEXT_STEPS.ENGINE_UNVERIFIED));
  for (const check2 of facts.doctor ?? []) if (!check2.ok) problems.push(nextStepText(`${check2.id}: ${check2.detail}`));
  return problems;
}
function buildDoctor(input, facts, unguardedAgents2) {
  const derived2 = { ...facts, options: input.options, keybind: input.keybind };
  const engine = facts.engine;
  const host2 = input.manifest.plugin.host;
  const stt = modelOf(facts.models, "stt");
  const tts = modelOf(facts.models, "tts-model");
  const microphone = facts.microphone;
  const error2 = facts.engineError;
  return {
    name: input.manifest.plugin.name,
    version: input.version,
    host: {
      version: input.hostVersion === "" ? "unknown" : input.hostVersion,
      range: host2.opencode,
      tested: host2.tested.includes(input.hostVersion)
    },
    state: doctorStateOf(derived2, engine, input.hostVersion),
    engine: {
      installed: engine !== void 0,
      version: facts.probe?.version ?? engine?.version ?? null,
      path: engine?.path ?? null,
      verified: engine?.verified ?? false,
      compatible: facts.probe?.compatible ?? (engine?.supported ?? false),
      platform: engine?.platform ?? `${process.platform}-${process.arch}`,
      source: engine?.source ?? null,
      error: error2 === void 0 ? null : {
        code: error2.code,
        what: nextStepText(error2.message.replace(/^[A-Z][A-Z0-9_]*:\s*/, "").replace(/ Next step: [\s\S]*$/, "")),
        next: nextStepText(error2.next)
      }
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
    dictation: { keybind: input.keybind, submit: input.options.submit },
    access: input.options.access,
    tools: {
      registered: Object.keys(input.manifest.methods).length,
      readable: Object.values(input.manifest.methods).filter((method) => method.class === "read").length
    },
    privacy: {
      audioLeavesMachine: false,
      keepRecordings: false,
      transcriptHistory: input.options.keepTranscripts
    },
    unguardedAgents: [...unguardedAgents2],
    nextStep: nextStepOf(derived2, engine, stt, tts),
    problems: problemsOf2(derived2, facts.probe, engine)
  };
}
function formatDoctor(answer) {
  const engine = answer.engine.installed ? `${answer.engine.version ?? "unknown version"} (${answer.engine.verified ? "verified" : "unverified"})` : "not installed";
  const access = `${answer.microphone.permission.replace("_", " ")}${answer.microphone.input === null ? "" : ` \xB7 ${oneLine(answer.microphone.input)}`}`;
  const models = [answer.models.stt, answer.models.tts].filter((model) => model !== null).map((model) => `${model.name} \xB7 ${byteLabel(model.bytes)} \xB7 ${model.state}`).join(" \xB7 ");
  const dictation = `${answer.dictation.submit === "send" ? "Send on pause" : "Review before sending"} \xB7 ${answer.dictation.keybind}`;
  return [
    `Voice ${answer.version}`,
    `Connection: Engine ${engine}`,
    `Account: On-device`,
    `Access: Microphone ${access}`,
    `Models: ${models === "" ? "none" : models}`,
    `Dictation: ${dictation}`,
    `Tools: ${answer.tools.registered} registered \xB7 ${answer.tools.readable} readable`,
    `Agents without default rules: ${answer.unguardedAgents.length === 0 ? "none" : answer.unguardedAgents.map((agent) => oneLine(agent)).join(", ")}`,
    `OpenCode: ${answer.host.version} (${answer.host.tested ? "tested" : "untested"})`,
    `Next step: ${answer.nextStep ?? "Nothing to do."}`
  ].join("\n");
}

// src/constants.ts
var TUI_ID = "voice-tui";
var DEFAULT_KEYBIND_MAC = "ctrl+shift+space";
var DEFAULT_KEYBIND_OTHER = "ctrl+space";
var defaultKeybind = (platform = process.platform) => platform === "darwin" ? DEFAULT_KEYBIND_MAC : DEFAULT_KEYBIND_OTHER;

// src/manifest.ts
var manifest = { "version": 1, "plugin": { "name": "voice", "title": "Voice", "summary": "Local voice: report the speech engine, models, microphone and next step, and speak text aloud on this machine. Dictation happens in the terminal UI, not through a tool. Audio stays on this machine and no recording is kept. Not for transcribing an audio file (a collector plugin) or meetings.", "vendor": { "id": "we-the-rebel-alliance", "name": "We The Rebel Alliance", "domain": "github.com" }, "icons": [{ "src": "assets/icon.svg", "type": "image/svg+xml" }, { "src": "assets/icon-128.png", "type": "image/png" }, { "src": "assets/icon-256.png", "type": "image/png" }], "host": { "opencode": ">=2.4.1 <2.5.0", "tested": ["2.4.1"] } }, "options": { "type": "object", "properties": { "access": { "title": "Access", "type": "string", "enum": ["all", "ask-changes", "read-only"], "default": "all", "description": "How much the plugin's methods may do: everything, ask before a change, or reads only." }, "allowUntestedHost": { "title": "Allow an untested host", "type": "boolean", "default": false, "description": "Start outside the tested OpenCode range." }, "aurumPath": { "title": "Engine binary", "type": "string", "description": "An Aurum binary to use instead of the pinned engine. It is labelled unverified unless its digest matches." }, "assetsDir": { "title": "Pre-seeded model folder", "type": "string", "description": "A pre-seeded model folder. Files are taken from here and nothing is downloaded." }, "submit": { "title": "Dictation submit mode", "type": "string", "enum": ["send", "review"], "default": "send", "description": "Send a transcript at once, or open a prefilled review dialog first." }, "keybind": { "title": "Dictation key", "type": "string", "description": "The dictation key, in OpenCode's keymap syntax. Defaults to ctrl+shift+space on macOS and ctrl+space elsewhere." }, "autoSpeak": { "title": "Read replies aloud", "type": "boolean", "default": false, "description": "Read every completed reply aloud." }, "voice": { "title": "Voice", "type": "string", "default": "Luna", "description": "The local text-to-speech voice, passed to the engine as --voice." }, "sttModel": { "title": "Speech-to-text model", "type": "string", "default": "tiny-q5_1", "description": "The local speech-to-text model, as Aurum names it." }, "language": { "title": "Spoken language", "type": "string", "default": "auto", "description": "A spoken language code such as en or pt-BR, or auto." }, "maxRecordSeconds": { "title": "Longest recording", "type": "integer", "minimum": 5, "maximum": 120, "default": 120, "description": "The longest one recording may run, in whole seconds from 5 to 120." }, "statusIndicator": { "title": "Listening indicator", "type": "string", "enum": ["toast", "footer"], "default": "toast", "description": "Where the listening state shows: a toast, or a row above the prompt." }, "keepTranscripts": { "title": "Keep transcripts", "type": "boolean", "default": false, "description": "Keep the last 20 transcripts as text in the plugin's storage. Audio is never kept." } }, "additionalProperties": false }, "methods": { "status": { "class": "read", "accounts": "none" }, "doctor": { "class": "read", "accounts": "none" }, "speak": { "class": "write", "accounts": "none" } }, "sources": [], "actions": [], "events": {} };
var VERSION = "0.0.0";

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
  "access"
];
var DEFAULTS = {
  submit: "send",
  autoSpeak: false,
  voice: "Luna",
  sttModel: "tiny-q5_1",
  language: "auto",
  maxRecordSeconds: 120,
  statusIndicator: "toast",
  keepTranscripts: false,
  allowUntestedHost: false,
  access: "all"
};
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var fail = (field, message, next) => ({
  ok: false,
  error: { code: "OPTIONS_INVALID", field, message, next }
});
var nonEmpty2 = (value) => typeof value === "string" && value.trim() !== "" && !/\s/.test(value);
function parseOptions(input) {
  const raw = input ?? {};
  if (!isRecord(raw)) return fail("options", "Plugin options must be an object.", "Set options to an object, or remove them.");
  const unknown2 = Object.keys(raw).find((key) => !TOP_KEYS.includes(key));
  if (unknown2 !== void 0) return fail(unknown2, "This option is not supported.", `Remove it. Supported options: ${TOP_KEYS.join(", ")}.`);
  const aurumPath = raw.aurumPath;
  if (aurumPath !== void 0 && (typeof aurumPath !== "string" || aurumPath.trim() === "")) {
    return fail("aurumPath", "Must be a non-empty path.", "Set it to the absolute path of an Aurum binary, or remove it.");
  }
  const assetsDir = raw.assetsDir;
  if (assetsDir !== void 0 && (typeof assetsDir !== "string" || assetsDir.trim() === "")) {
    return fail("assetsDir", "Must be a non-empty path.", "Set it to a folder holding the model files, or remove it.");
  }
  const submit = raw.submit ?? DEFAULTS.submit;
  if (submit !== "send" && submit !== "review") {
    return fail("submit", 'Must be "send" or "review".', 'Set it to "send" to submit at once, or "review" to edit first.');
  }
  const keybind = raw.keybind;
  if (keybind !== void 0 && !nonEmpty2(keybind)) {
    return fail("keybind", "Must be a key combination without spaces.", 'Set it to a combination such as "ctrl+shift+space".');
  }
  const autoSpeak = raw.autoSpeak ?? DEFAULTS.autoSpeak;
  if (typeof autoSpeak !== "boolean") return fail("autoSpeak", "Must be true or false.", "Set it to true to read every completed reply aloud.");
  const voice = raw.voice ?? DEFAULTS.voice;
  if (!nonEmpty2(voice)) return fail("voice", "Must be a local voice name.", "Use a name from the status dialog, such as Luna.");
  const sttModel = raw.sttModel ?? DEFAULTS.sttModel;
  if (!nonEmpty2(sttModel)) return fail("sttModel", "Must be a model name.", "Use a name from the status dialog, such as tiny-q5_1.");
  const language = raw.language ?? DEFAULTS.language;
  if (typeof language !== "string" || !/^(?:auto|[a-z]{2,3}(?:-[A-Z]{2})?)$/.test(language)) {
    return fail("language", "Must be auto or a language code such as en or pt-BR.", "Set it to auto, or an ISO language code.");
  }
  const maxRecordSeconds = raw.maxRecordSeconds ?? DEFAULTS.maxRecordSeconds;
  if (typeof maxRecordSeconds !== "number" || !Number.isInteger(maxRecordSeconds) || maxRecordSeconds < 5 || maxRecordSeconds > 120) {
    return fail("maxRecordSeconds", "Must be a whole number from 5 to 120.", "Set the longest recording, in seconds.");
  }
  const statusIndicator = raw.statusIndicator ?? DEFAULTS.statusIndicator;
  if (statusIndicator !== "toast" && statusIndicator !== "footer") {
    return fail("statusIndicator", 'Must be "toast" or "footer".', 'Leave it "toast", or set "footer" for a listening row above the prompt.');
  }
  const keepTranscripts = raw.keepTranscripts ?? DEFAULTS.keepTranscripts;
  if (typeof keepTranscripts !== "boolean") {
    return fail("keepTranscripts", "Must be true or false.", "Set it to true to keep the last 20 transcripts as text.");
  }
  const allowUntestedHost = raw.allowUntestedHost ?? DEFAULTS.allowUntestedHost;
  if (typeof allowUntestedHost !== "boolean") {
    return fail("allowUntestedHost", "Must be true or false.", "Set it to true only to run on an OpenCode version outside the supported range.");
  }
  const access = raw.access ?? DEFAULTS.access;
  if (access !== "all" && access !== "ask-changes" && access !== "read-only") {
    return fail("access", 'Must be "all", "ask-changes" or "read-only".', 'Set it to "ask-changes" to be asked before each change, or "read-only" to turn changes off.');
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
      access
    }
  };
}

// src/provider/create.ts
import { homedir } from "node:os";
import { join as join5 } from "node:path";

// src/provider/assets.ts
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { open as open2, mkdir, rename, rm, stat, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
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
    const { role, name, file: file2, url: url2, sha256, bytes, licence, revision, group } = entry;
    if (typeof role !== "string" || !ROLES.includes(role) || typeof name !== "string" || typeof file2 !== "string" || typeof url2 !== "string" || !url2.startsWith("https://") || typeof sha256 !== "string" || !HASH.test(sha256) || typeof bytes !== "number" || !Number.isInteger(bytes) || bytes <= 0 || typeof licence !== "string" || typeof revision !== "string" || group !== void 0 && typeof group !== "string") {
      throw new EngineError("MODEL_MISSING", "The model manifest has an entry the plugin cannot use.");
    }
    if ((role === "tts-model" || role === "tts-voices" || role === "tts-config") && typeof group !== "string") {
      throw new EngineError("MODEL_MISSING", "A TTS model entry has no group directory.");
    }
    return { role, name, file: file2, url: url2, sha256, bytes, licence, revision, ...group === void 0 ? {} : { group } };
  });
  if (new Set(models.map((model) => model.role)).size !== models.length) {
    throw new EngineError("MODEL_MISSING", "The model manifest names a role twice.");
  }
  return { version: raw.version, models };
}
function sha256File(path) {
  return stat(path).then(async (info) => {
    if (!info.isFile()) throw new EngineError("MODEL_MISSING", "A speech model is not a regular file.");
    const { readFile: readFile3 } = await import("node:fs/promises");
    return createHash("sha256").update(await readFile3(path)).digest("hex");
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
    return join(this.input.cacheRoot, "engine");
  }
  /** Where a pinned asset lives: the pre-seeded folder when configured, else the engine's own cache layout. */
  pathOf(asset) {
    if (this.input.assetsDir !== void 0) return join(this.input.assetsDir, asset.file);
    if (asset.role === "stt") return join(this.engineRoot, "models", asset.file);
    return join(this.engineRoot, "tts", asset.group ?? "custom", asset.file);
  }
  /** Each asset, its path and whether a file of the pinned size is there. Status never hashes a model. */
  async inspect() {
    const manifest2 = await this.manifest();
    return Promise.all(
      manifest2.models.map(async (asset) => {
        const path = this.pathOf(asset);
        const state = await stat(path).then((info) => info.isFile() && info.size === asset.bytes ? this.input.assetsDir !== void 0 ? "pre-seeded" : "cached" : "missing").catch(() => "missing");
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
    await mkdir(dirname(target), { recursive: true, mode: 448 });
    const temp = join(dirname(target), `.download-${randomUUID()}`);
    const stall = new AbortController();
    const request = AbortSignal.any([signal, stall.signal]);
    let watchdog = setTimeout(() => stall.abort(), STALL_MS);
    const handle = await open2(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
    let renamed = false;
    try {
      const response = await this.fetchPinned(asset, request);
      if (!response.ok || response.body === null) {
        throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} failed with HTTP status ${response.status}.`);
      }
      const hash2 = createHash("sha256");
      let received = 0;
      for await (const chunk of response.body) {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => stall.abort(), STALL_MS);
        received += chunk.byteLength;
        if (received > asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", `The download of ${asset.file} is larger than its pinned size.`);
        hash2.update(chunk);
        await handle.write(chunk);
      }
      if (received !== asset.bytes) throw new EngineError("MODEL_DOWNLOAD_FAILED", `The download of ${asset.file} has the wrong size.`);
      if (hash2.digest("hex") !== asset.sha256) {
        throw new EngineError("INTEGRITY_MISMATCH", `The downloaded ${asset.file} does not match its pinned SHA-256 hash, so it was discarded.`);
      }
      await handle.sync();
      await handle.close();
      if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.");
      await rename(temp, target);
      renamed = true;
      return { ...asset, path: target, state: "cached" };
    } catch (error2) {
      if (error2 instanceof EngineError) throw error2;
      if (signal.aborted) throw new EngineError("CANCELLED", "The download was cancelled.");
      throw new EngineError("MODEL_DOWNLOAD_FAILED", stall.signal.aborted ? `Downloading ${asset.file} stalled.` : `Downloading ${asset.file} was interrupted.`);
    } finally {
      clearTimeout(watchdog);
      await handle.close().catch(() => void 0);
      if (!renamed) await rm(temp, { force: true });
    }
  }
  /**
   * Follows at most three redirects, each to `https` on the asset's pinned host. A redirect elsewhere is refused: the
   * manifest names the host, and the SHA-256 alone is not a reason to fetch from anywhere.
   */
  async fetchPinned(asset, signal) {
    const pinned = new URL(asset.url);
    let url2 = pinned;
    for (let hop = 0; hop <= REDIRECTS; hop += 1) {
      const response = await (this.input.fetchImpl ?? fetch)(url2, { signal, redirect: "manual" });
      if (![301, 302, 303, 307, 308].includes(response.status)) return response;
      const location = response.headers.get("location");
      if (location === null) throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} was redirected without a location.`);
      const next = new URL(location, url2);
      if (next.protocol !== "https:" || !allowedRedirect(pinned.host, next)) {
        throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} was redirected away from ${pinned.host}, so it was refused.`);
      }
      url2 = next;
    }
    throw new EngineError("MODEL_DOWNLOAD_FAILED", `Downloading ${asset.file} was redirected too many times.`);
  }
  /** One install at a time across processes: a lock file in the cache root, stale after ten minutes. */
  async withInstallLock(signal, work) {
    await mkdir(this.input.cacheRoot, { recursive: true, mode: 448 });
    const path = join(this.input.cacheRoot, ".install.lock");
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (; ; ) {
      try {
        const handle = await open2(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 384);
        await handle.write(`${process.pid}
`);
        await handle.close();
        break;
      } catch (error2) {
        const code = error2.code;
        if (code !== "EEXIST") throw error2;
        const info = await stat(path).catch(() => void 0);
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
    const info = await stat(path).catch(() => void 0);
    if (info === void 0 || !info.isFile() || info.size !== asset.bytes) return false;
    return await sha256File(path) === asset.sha256;
  }
  /** Verifies every asset of these roles, and refuses with INTEGRITY_MISMATCH when one does not match. */
  async verifyRoles(roles) {
    const manifest2 = await this.manifest();
    for (const asset of manifest2.models.filter((model) => roles.includes(model.role))) {
      if (!await this.verify(asset)) {
        throw new EngineError("INTEGRITY_MISMATCH", `The model ${asset.file} does not match its pinned SHA-256 hash, so it was not used.`);
      }
    }
  }
};
function defaultCacheRoot(home, platform = process.platform, env = process.env) {
  if (platform === "darwin") return join(home, "Library", "Caches", "voice-plugin");
  return join(env.XDG_CACHE_HOME ?? join(home, ".cache"), "voice-plugin");
}

// src/provider/binary.ts
import { spawn } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { resolve } from "node:path";

// src/provider/platform.ts
var MINIMUM_ENGINE = "0.0.24";
var MODULE = "aurum";
var BINARY_NAME = "aurum";
function platformKey(platform = process.platform, arch = process.arch) {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "linux" && arch === "x64") return "linux-x64-gnu";
  if (platform === "linux" && arch === "arm64") return "linux-arm64-gnu";
  return void 0;
}
var platformLabel = (platform = process.platform, arch = process.arch) => `${platform}-${arch}`;

// src/provider/release.ts
import { createHash as createHash3 } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join as join3 } from "node:path";

// src/provider/native.ts
import { createHash as createHash2, randomUUID as randomUUID2 } from "node:crypto";
import { constants as constants2, createReadStream } from "node:fs";
import { chmod, mkdir as mkdir2, open as open3, readFile, rename as rename2, rm as rm2, stat as stat2 } from "node:fs/promises";
import { dirname as dirname2, join as join2 } from "node:path";
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
var PLATFORM_KEY = /^[a-z0-9-]+$/;
var DEFAULT_STALL_MS = 12e4;
var isRecord3 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var invalid = (what) => {
  throw new NativeError("NATIVE_MANIFEST_INVALID", `the engine pin ${what}`, "Reinstall the plugin from a copy whose manifest/aurum.json is valid.");
};
var text2 = (value, field) => {
  if (typeof value !== "string" || value === "") invalid(`has a bad ${field}`);
  return value;
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
var webUrl = (value, field) => {
  if (typeof value !== "string" || value === "") invalid(`has a bad URL in ${field}`);
  const parsed = (() => {
    try {
      return new URL(value);
    } catch {
      return invalid(`has a bad URL in ${field}`);
    }
  })();
  if (parsed.protocol !== "https:") invalid(`has a non-HTTPS URL in ${field}`);
  return value;
};
function parseNativeManifest(raw) {
  if (!isRecord3(raw)) return invalid("is not an object");
  const version2 = text2(raw.version, "version");
  const tag2 = text2(raw.tag, "tag");
  const commit2 = text2(raw.commit, "commit");
  if (!HEX40.test(commit2)) invalid("has a bad commit");
  const source2 = webUrl(raw.source, "source");
  const licence = text2(raw.licence, "licence");
  if (!isRecord3(raw.assets)) invalid("has no assets");
  const assets = {};
  for (const [key, value] of Object.entries(raw.assets)) {
    if (!PLATFORM_KEY.test(key) || !isRecord3(value)) return invalid(`has a bad entry for ${key}`);
    const name = plain(value.name, key);
    const url2 = webUrl(value.url, key);
    if (!url2.endsWith(`/${name}`)) invalid(`names a URL that is not the ${key} asset`);
    assets[key] = { name, url: url2, bytes: positive(value.bytes, key), sha256: digest(value.sha256, key) };
  }
  return { version: version2, tag: tag2, commit: commit2, source: source2, licence, assets };
}
function entryFor(options) {
  const entry = options.manifest.assets[options.key];
  if (entry === void 0) {
    throw new NativeError(
      "NATIVE_UNSUPPORTED_PLATFORM",
      `the pin has no ${options.key} engine`,
      "Set the plugin's binary path option to an executable of the pinned version, or use a supported platform."
    );
  }
  return entry;
}
function cachePath(options) {
  return join2(options.cacheRoot, "native", options.manifest.tag, MODULE, options.key, BINARY_NAME);
}
async function sha256File2(path) {
  const hash2 = createHash2("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.byteLength;
    hash2.update(chunk);
  }
  return { bytes, sha256: hash2.digest("hex") };
}
async function verifiedFile(path, expected) {
  try {
    const info = await stat2(path);
    if (!info.isFile() || info.size !== expected.bytes) return false;
    return (await sha256File2(path)).sha256 === expected.sha256;
  } catch {
    return false;
  }
}
function fail2(code, what, options) {
  const next = {
    NATIVE_MANIFEST_MISSING: "Set the plugin's binary path option to an executable of the pinned version, or install a release of the plugin.",
    NATIVE_MANIFEST_INVALID: "Reinstall the plugin from a copy whose manifest/aurum.json is valid.",
    NATIVE_UNSUPPORTED_PLATFORM: "Set the plugin's binary path option to an executable of the pinned version, or use a supported platform.",
    NATIVE_NOT_INSTALLED: `Run ${options.installCommand}, which downloads and verifies it.`,
    NATIVE_NETWORK: "Check the network or proxy, then call the tool again.",
    NATIVE_NOT_FOUND: "The pinned upstream release is missing this file. Report it; do not retry.",
    NATIVE_HASH_MISMATCH: "The download was discarded. Call the tool again; if it persists, report that the upstream asset does not match its pin.",
    NATIVE_SIZE_MISMATCH: "Call the tool again; if it persists, report that the upstream asset does not match its pin.",
    NATIVE_STALLED: "Call the tool again.",
    NATIVE_CANCELLED: "Call the tool again if you still need the result.",
    NATIVE_WRITE_FAILED: "Check that the plugin's cache folder is writable, then call the tool again."
  };
  throw new NativeError(code, what, next[code]);
}
async function installNative(options) {
  const entry = entryFor(options);
  const target = cachePath(options);
  if (await verifiedFile(target, { bytes: entry.bytes, sha256: entry.sha256 })) return { path: target, downloaded: false };
  if (options.signal?.aborted) fail2("NATIVE_CANCELLED", `the download of ${entry.name} was cancelled before it started`, options);
  const dir = dirname2(target);
  try {
    await mkdir2(dir, { recursive: true, mode: 448 });
  } catch {
    fail2("NATIVE_WRITE_FAILED", `the cache folder ${dir} cannot be created`, options);
  }
  const partial2 = `${target}.${randomUUID2()}.part`;
  try {
    await download(options, entry, partial2);
    await chmod(partial2, 493);
    await rename2(partial2, target);
    options.log?.(`installed ${entry.name} (${entry.bytes} bytes) for ${MODULE}`);
    return { path: target, downloaded: true };
  } finally {
    await rm2(partial2, { force: true });
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
  const failure2 = (error2) => {
    if (error2 instanceof NativeError) throw error2;
    if (stall.signal.aborted) fail2("NATIVE_STALLED", `the download of ${entry.name} stopped for ${Math.round(limit / 1e3)} seconds`, options);
    if (options.signal?.aborted) fail2("NATIVE_CANCELLED", `the download of ${entry.name} was cancelled`, options);
    fail2("NATIVE_NETWORK", `the download of ${entry.name} failed (${error2.message})`, options);
  };
  let handle;
  try {
    const response = await (options.fetchImpl ?? fetch)(entry.url, { signal: request, redirect: "follow" }).catch(failure2);
    if (response.status === 404) fail2("NATIVE_NOT_FOUND", `${entry.name} is not at the pinned upstream address`, options);
    if (!response.ok || response.body === null) fail2("NATIVE_NETWORK", `the download of ${entry.name} returned HTTP ${response.status}`, options);
    handle = await open3(path, constants2.O_WRONLY | constants2.O_CREAT | constants2.O_EXCL | constants2.O_NOFOLLOW, 384);
    const hash2 = createHash2("sha256");
    let received = 0;
    for await (const chunk of response.body) {
      reset();
      received += chunk.byteLength;
      if (received > entry.bytes) fail2("NATIVE_SIZE_MISMATCH", `${entry.name} is larger than its pinned ${entry.bytes} bytes`, options);
      hash2.update(chunk);
      await handle.write(chunk);
    }
    if (received !== entry.bytes) fail2("NATIVE_SIZE_MISMATCH", `${entry.name} is ${received} bytes, not the pinned ${entry.bytes}`, options);
    if (hash2.digest("hex") !== entry.sha256) fail2("NATIVE_HASH_MISMATCH", `${entry.name} does not match its pinned sha256, so it was discarded`, options);
    await handle.sync();
  } catch (error2) {
    failure2(error2);
  } finally {
    clearTimeout(watchdog);
    await handle?.close().catch(() => void 0);
  }
}

// src/provider/release.ts
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
function toEngineError(error2) {
  if (!(error2 instanceof NativeError)) return error2;
  return new EngineError(CODE_FOR[error2.code] ?? "MODEL_DOWNLOAD_FAILED", error2.message.replace(/^NATIVE_[A-Z_]+: /, ""), error2.next);
}
function digestMatches(path, expected) {
  try {
    return createHash3("sha256").update(readFileSync(path)).digest("hex") === expected;
  } catch {
    return false;
  }
}
function readRelease(packageRoot) {
  let text3;
  try {
    text3 = readFileSync(join3(packageRoot, "manifest", "aurum.json"), "utf8");
  } catch {
    return void 0;
  }
  try {
    return parseNativeManifest(JSON.parse(text3));
  } catch {
    throw new EngineError("ENGINE_MISSING", "The engine pin in this copy of Voice is invalid.", "Reinstall the plugin from a copy whose manifest/aurum.json is valid.", "manifest");
  }
}
function pinnedVersion(packageRoot) {
  try {
    const version2 = JSON.parse(readFileSync(join3(packageRoot, "manifest", "aurum.json"), "utf8")).version;
    return typeof version2 === "string" ? version2 : null;
  } catch {
    return null;
  }
}
function pinnedEngine(packageRoot, platform = process.platform, arch = process.arch) {
  const manifest2 = readRelease(packageRoot);
  if (manifest2 === void 0) {
    throw new EngineError(
      "ENGINE_MISSING",
      "This copy of Voice carries no engine pin, so it has no pinned speech engine.",
      "Set the aurumPath option to an Aurum binary, or install a release of the plugin.",
      "manifest"
    );
  }
  const key = platformKey(platform, arch);
  const entry = key === void 0 ? void 0 : manifest2.assets[key];
  if (key === void 0 || entry === void 0) {
    throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${platformLabel(platform, arch)}.`);
  }
  return { manifest: manifest2, key, entry };
}
function engineOptions(cacheRoot, pinned) {
  return { manifest: pinned.manifest, key: pinned.key, cacheRoot, installCommand: INSTALL_COMMAND };
}
function cachedEngine(cacheRoot, pinned) {
  const path = cachePath(engineOptions(cacheRoot, pinned));
  if (!existsSync(path)) return void 0;
  const current = statSync(path);
  if (!current.isFile() || current.size !== pinned.entry.bytes || !digestMatches(path, pinned.entry.sha256)) {
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
  } catch (error2) {
    throw toEngineError(error2);
  }
}

// src/provider/binary.ts
function resolveEngine(input) {
  const platform = input.platform ?? process.platform;
  const arch = input.arch ?? process.arch;
  const env = input.env ?? process.env;
  const label2 = platformLabel(platform, arch);
  const version2 = pinnedVersion(input.packageRoot);
  const candidate = (path, source2, verified) => ({
    path,
    version: version2,
    source: source2,
    verified,
    platform: label2,
    supported: true
  });
  if (input.optionPath !== void 0) {
    const path = resolve(input.optionPath);
    if (!existsSync2(path)) {
      throw new EngineError(
        "ENGINE_MISSING",
        "The aurumPath option points at a file that does not exist.",
        "Set the aurumPath option to an existing Aurum binary, or remove it to use the pinned install.",
        "override"
      );
    }
    return candidate(path, "option", false);
  }
  const fromEnv = env.VOICE_AURUM_PATH;
  if (fromEnv !== void 0 && fromEnv !== "") {
    const path = resolve(fromEnv);
    if (!existsSync2(path)) {
      throw new EngineError(
        "ENGINE_MISSING",
        "VOICE_AURUM_PATH points at a file that does not exist.",
        "Set VOICE_AURUM_PATH to an existing Aurum binary, or remove it to use the pinned install.",
        "override"
      );
    }
    return candidate(path, "environment", false);
  }
  const key = platformKey(platform, arch);
  if (key === void 0) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no speech engine for ${label2}.`);
  const release = (() => {
    try {
      return readRelease(input.packageRoot);
    } catch (error2) {
      throw toEngineError(error2);
    }
  })();
  if (release === void 0) {
    throw new EngineError(
      "ENGINE_MISSING",
      "This copy of Voice carries no engine pin, so it has no pinned speech engine.",
      "Set the aurumPath option to an Aurum binary, or install a release of the plugin.",
      "manifest"
    );
  }
  const entry = release.assets[key];
  if (entry === void 0) throw new EngineError("UNSUPPORTED_PLATFORM", `There is no Aurum ${MINIMUM_ENGINE} binary for ${label2}.`);
  if (input.cacheRoot !== void 0) {
    const path = cachedEngine(input.cacheRoot, { manifest: release, key, entry });
    if (path !== void 0) return candidate(path, "download", true);
  }
  throw new EngineError("ENGINE_MISSING", "The pinned speech engine is not installed.", void 0, "not-installed");
}
function parseEngineVersion(output) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(output);
  return match === null ? void 0 : `${match[1]}.${match[2]}.${match[3]}`;
}
var parts = (version2) => version2.split(".").map(Number);
function isCompatibleEngine(version2) {
  if (version2 === void 0) return false;
  const [major = 0, minor = 0, patch = 0] = parts(version2);
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
      const version2 = parseEngineVersion(output);
      const missing = /error while loading shared libraries: ([^:\s]+)/.exec(errors)?.[1];
      const older = /version `([A-Z][A-Z0-9_.]*)' not found/.exec(errors)?.[1];
      resolveProbe({
        version: version2 ?? null,
        compatible: isCompatibleEngine(version2),
        ...version2 === void 0 && missing !== void 0 ? { missingLibrary: missing } : {},
        ...version2 === void 0 && older !== void 0 ? { olderSystem: older } : {}
      });
    });
  });
}

// src/provider/doctor.ts
import { spawn as spawn2 } from "node:child_process";
var TIMEOUT_MS = 2e4;
var KILL_MS = 1e3;
var isRecord4 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function runDoctor(bin, options = {}) {
  return new Promise((resolve2, reject) => {
    let child;
    const args = ["doctor", "--json", ...options.cacheDir === void 0 ? [] : ["--cache-dir", options.cacheDir]];
    try {
      child = spawn2(bin, args, { env: { ...process.env, ...options.env }, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error2) {
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error2)}`));
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
    child.on("error", (error2) => {
      clearTimeout(timer);
      clearTimeout(kill);
      reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${error2.message}`));
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
  const list2 = Array.isArray(value) ? value : isRecord4(value) && Array.isArray(value.checks) ? value.checks : void 0;
  if (list2 === void 0) return void 0;
  const checks = list2.flatMap((entry) => {
    if (!isRecord4(entry) || typeof entry.id !== "string" || typeof entry.ok !== "boolean") return [];
    const detail2 = typeof entry.summary === "string" ? entry.summary : typeof entry.detail === "string" ? entry.detail : "";
    const next = typeof entry.hint === "string" ? entry.hint : typeof entry.next === "string" ? entry.next : void 0;
    return [{ id: entry.id, ok: entry.ok, detail: detail2, ...next === void 0 ? {} : { next } }];
  });
  if (isRecord4(value) && isRecord4(value.microphone)) {
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
  if (isRecord4(value) && isRecord4(value.models)) {
    const stt = typeof value.models.stt === "string" ? value.models.stt : "the STT model";
    if (value.models.stt_cached === false) checks.push({ id: "models", ok: false, detail: `${stt} is not cached`, next: "Run /voice-install." });
    else if (value.models.stt_cached === true) checks.push({ id: "models", ok: true, detail: `${stt} cached` });
  }
  return checks;
}
function microphonePermission(checks) {
  const check2 = checks.find((entry) => entry.id === "microphone" || entry.id === "mic");
  if (check2 === void 0) return "unknown";
  const text3 = `${check2.detail} ${check2.next ?? ""}`.toLowerCase();
  if (/not determined|notdetermined|not yet/.test(text3)) return "not_determined";
  if (/denied/.test(text3)) return "denied";
  if (/restricted/.test(text3)) return "restricted";
  if (check2.ok || /authorized|granted/.test(text3)) return "authorized";
  return "unknown";
}
function deviceName(checks, id) {
  const check2 = checks.find((entry) => entry.id === id);
  if (check2 === void 0) return null;
  const detail2 = check2.detail.trim();
  return detail2 === "" ? null : detail2.slice(0, 120);
}

// src/provider/index.ts
import { randomUUID as randomUUID3 } from "node:crypto";
import { mkdir as mkdir3, readFile as readFile2, rm as rm3 } from "node:fs/promises";
import { join as join4 } from "node:path";

// src/provider/play.ts
import { spawn as spawn3 } from "node:child_process";
var ignoreError = () => void 0;
var Player = class {
  current;
  options;
  constructor(options) {
    this.options = options;
  }
  get playing() {
    return this.current !== void 0 && this.current.child.exitCode === null;
  }
  play(path, options = {}) {
    const { signal } = options;
    if (this.playing) return Promise.reject(new EngineError("BUSY", "A reply is already playing."));
    if (signal?.aborted === true) return Promise.reject(new EngineError("CANCELLED", "Playback was stopped."));
    const args = ["play", path];
    const rate = options.rate ?? this.options.rate;
    if (rate !== void 0 && rate !== 1) args.push("--rate", String(rate));
    let child;
    try {
      child = spawn3(this.options.bin, args, { env: { ...process.env, ...this.options.env }, stdio: ["ignore", "ignore", "pipe"] });
    } catch (error2) {
      return Promise.reject(new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error2)}`));
    }
    return new Promise((resolve2, reject) => {
      let settled = false;
      let released = false;
      let escalation;
      let done;
      const exited = new Promise((resolveDone) => {
        done = resolveDone;
      });
      let stderr = "";
      const onData = (chunk) => {
        stderr += chunk.toString("utf8");
      };
      child.stderr?.on("data", onData);
      const settle2 = (error2) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", abort);
        child.stderr?.removeListener("data", onData);
        if (error2 === void 0) resolve2();
        else reject(error2);
      };
      const release = () => {
        if (released) return;
        released = true;
        if (escalation !== void 0) {
          clearTimeout(escalation);
          escalation = void 0;
        }
        child.removeListener("error", onError);
        child.removeListener("exit", onExit);
        child.on("error", ignoreError);
        if (this.current === playback) this.current = void 0;
        done();
      };
      const kill = () => {
        if (child.exitCode !== null) return;
        child.kill("SIGTERM");
        if (escalation !== void 0) return;
        escalation = setTimeout(() => {
          escalation = void 0;
          if (child.exitCode === null) child.kill("SIGKILL");
        }, 1e3);
        escalation.unref?.();
      };
      const abort = () => {
        if (settled) return;
        try {
          kill();
        } finally {
          settle2(new EngineError("CANCELLED", "Playback was stopped."));
        }
      };
      const onError = (error2) => {
        settle2(new EngineError("ENGINE_MISSING", `The speech engine could not play audio: ${error2.message}`));
        if (child.pid === void 0 || child.exitCode !== null) release();
      };
      const onExit = (code) => {
        if (signal?.aborted === true) settle2(new EngineError("CANCELLED", "Playback was stopped."));
        else if (code === 0) settle2();
        else {
          settle2(
            /no (?:default )?(?:output|speaker)|device not found/i.test(stderr) ? new EngineError("AUDIO_DEVICE_MISSING", "No output device is available.") : new EngineError("SIDECAR_FAILED", "The reply could not be played.")
          );
        }
        release();
      };
      const playback = { child, stop: abort, done: exited };
      this.current = playback;
      signal?.addEventListener("abort", abort, { once: true });
      child.on("error", onError);
      child.on("exit", onExit);
      if (signal?.aborted === true) abort();
    });
  }
  /** Stops the current playback at once, escalating SIGTERM to SIGKILL. Only that playback's exact child is signalled,
   * and its pending `play` is rejected as `CANCELLED`, so a caller never reports a stopped reply as played. */
  stop() {
    this.current?.stop();
  }
  /** Stop the exact current child and resolve only after it has exited or its spawn has failed. */
  stopAndWait() {
    const current = this.current;
    this.stop();
    return current === void 0 ? Promise.resolve() : current.done;
  }
};

// src/provider/record.ts
import { spawn as spawn4 } from "node:child_process";
import { chmod as chmod2, stat as stat3 } from "node:fs/promises";
import { createInterface } from "node:readline";
var STOP_MS = 3e3;
var KILL_MS2 = 1e3;
function captureFailure(text3) {
  if (/permission denied|not authorized|TCC/i.test(text3)) {
    return new EngineError("MIC_DENIED", "The operating system refused microphone access.");
  }
  if (/no (?:default )?(?:input|microphone)|device not found|no such device/i.test(text3)) {
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
    } catch (error2) {
      this.started = false;
      throw new EngineError("ENGINE_MISSING", `The speech engine could not start: ${String(error2)}`);
    }
    this.child = child;
    if (child.stdout !== null) {
      this.lines = createInterface({ input: child.stdout });
      let lastT;
      this.lines.on("line", (line) => {
        try {
          const event = JSON.parse(line);
          if (typeof event !== "object" || event === null) return;
          const record3 = event;
          let dbfs;
          if (typeof record3.level_dbfs === "number") dbfs = record3.level_dbfs;
          else if (record3.type === "level" && typeof record3.rms === "number") {
            dbfs = record3.rms <= 0 ? Number.NEGATIVE_INFINITY : 20 * Math.log10(record3.rms);
          }
          if (dbfs === void 0) return;
          const at = typeof record3.t_ms === "number" ? record3.t_ms : void 0;
          const delta = at !== void 0 && lastT !== void 0 ? Math.min(1e3, Math.max(20, at - lastT)) : typeof record3.level_dbfs === "number" ? 20 : 100;
          if (at !== void 0) lastT = at;
          handlers.onLevel(dbfs, delta);
        } catch {
        }
      });
    }
    if (child.stderr !== null) child.stderr.on("data", (chunk) => this.stderr.push(chunk.toString("utf8")));
    this.exited = new Promise((resolve2) => {
      child.on("error", (error2) => {
        this.options.log?.("warn", `recorder error: ${error2.message}`);
        handlers.onExit?.(new EngineError("ENGINE_MISSING", "The speech engine could not start."));
        resolve2(null);
      });
      child.on("exit", (code) => {
        this.started = false;
        this.options.onEnd?.();
        if (this.stopped) return resolve2(code);
        const error2 = code === 0 ? void 0 : captureFailure(this.stderr.join(" "));
        handlers.onExit?.(error2);
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

// src/provider/sidecar.ts
import { spawn as spawn5 } from "node:child_process";
import { createInterface as createInterface2 } from "node:readline";
var READY_TIMEOUT = 6e4;
var TRANSCRIBE_TIMEOUT = 12e4;
var SYNTHESIZE_TIMEOUT = 3e4;
var STOP_GRACE = 2e3;
var KILL_GRACE = 1e3;
var STDERR_TAIL = 3;
var isRecord5 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
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
  childDone;
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
  closed = false;
  quarantined = false;
  startEpoch = 0;
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
  /** True while a request may still be on the wire; a cancelled one can emit a late event. */
  get hasPending() {
    return this.pending !== void 0;
  }
  setState(next) {
    if (next === this.state) return;
    this.state = next;
    try {
      this.options.onState?.(next);
    } catch (error2) {
      this.options.log?.("warn", `state listener failed: ${String(error2)}`);
    }
  }
  /** Starts the sidecar and waits for `ready`. Safe to call again while ready. */
  start() {
    if (this.closed) return Promise.reject(new EngineError("CANCELLED", "The engine has been shut down."));
    if (this.quarantined) return Promise.reject(new EngineError("CANCELLED", "The cancelled request's engine is being replaced."));
    if (this.ready !== void 0) return Promise.resolve(this.ready);
    if (this.state === "starting") return new Promise((resolve2, reject) => this.waiters.push({ resolve: resolve2, reject }));
    if (this.state === "failed") return Promise.reject(this.failure ?? new EngineError("SIDECAR_FAILED", "The speech engine failed to start."));
    return this.launch();
  }
  launch() {
    if (this.closed) return Promise.reject(new EngineError("CANCELLED", "The engine has been shut down."));
    const epoch = ++this.startEpoch;
    this.failure = void 0;
    this.ready = void 0;
    this.setState("starting");
    if (this.closed || this.stopping || epoch !== this.startEpoch) {
      return Promise.reject(new EngineError("CANCELLED", "The engine start was cancelled."));
    }
    let child;
    try {
      child = spawn5(this.options.bin, sidecarArgs(this.options), {
        env: { ...process.env, ...this.options.env },
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (error2) {
      const failure2 = new EngineError("SIDECAR_FAILED", `The speech engine could not start: ${String(error2)}`);
      this.failure = failure2;
      this.setState("failed");
      return Promise.reject(failure2);
    }
    this.child = child;
    let complete;
    let completed = false;
    const done = new Promise((resolve2) => {
      complete = resolve2;
    });
    const finish = () => {
      if (completed) return;
      completed = true;
      complete();
    };
    this.childDone = done;
    child.once("error", () => {
      if (child.pid === void 0) finish();
    });
    child.once("exit", finish);
    if (child.exitCode !== null || child.signalCode !== null) finish();
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
    this.stdout.on("line", (line) => {
      if (this.child !== child || this.closed || this.stopping || this.state === "failed") return;
      this.onLine(line);
    });
    child.on("error", (error2) => {
      if (this.child !== child || this.closed || this.stopping) return;
      this.fail(new EngineError("SIDECAR_FAILED", `The speech engine failed: ${error2.message}`));
    });
    child.on("exit", (code) => {
      if (this.child !== child || this.closed || this.stopping) return;
      this.fail(new EngineError("ENGINE_EXITED", `The speech engine exited with code ${code ?? "unknown"}.`));
    });
    const promise2 = new Promise((resolve2, reject) => this.waiters.push({ resolve: resolve2, reject }));
    this.readyTimer = setTimeout(() => this.fail(new EngineError("TIMEOUT", "The speech engine did not become ready in time.")), this.options.readyMs ?? READY_TIMEOUT);
    return promise2;
  }
  onLine(line) {
    if (this.closed || this.stopping || this.child === void 0 || this.state === "failed") return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      this.options.log?.("warn", "the speech engine wrote a line that is not JSON");
      return;
    }
    if (!isRecord5(event) || typeof event.type !== "string") return;
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
      if (this.readyTimer !== void 0) {
        clearTimeout(this.readyTimer);
        this.readyTimer = void 0;
      }
      this.setState("ready");
      for (const waiter of this.waiters.splice(0)) waiter.resolve(this.ready);
      return;
    }
    if (event.type === "error") {
      const category = typeof event.category === "string" ? event.category : "internal";
      const message = typeof event.message === "string" ? event.message : "The speech engine reported an error.";
      const error2 = fromSidecarCategory(category, message);
      this.settle(error2);
      if (this.state === "starting") this.fail(error2);
      return;
    }
    const pending = this.pending;
    if (pending === void 0 || event.type !== pending.expected) return;
    try {
      const value = pending.read(event);
      this.settle(void 0, value);
    } catch (error2) {
      this.settle(error2 instanceof EngineError ? error2 : new EngineError("SIDECAR_FAILED", "The speech engine sent an unusable event."));
    }
  }
  settle(error2, value) {
    const pending = this.pending;
    if (pending === void 0) return;
    this.pending = void 0;
    if (pending.timer !== void 0) clearTimeout(pending.timer);
    this.setState("ready");
    if (error2 !== void 0) pending.reject(error2);
    else pending.resolve(value);
  }
  fail(error2) {
    if (this.closed || this.stopping) return;
    if (error2.code === "TIMEOUT") this.quarantined = true;
    this.failure = error2;
    const pending = this.pending;
    this.pending = void 0;
    if (pending?.timer !== void 0) clearTimeout(pending.timer);
    pending?.reject(error2);
    if (this.readyTimer !== void 0) {
      clearTimeout(this.readyTimer);
      this.readyTimer = void 0;
    }
    for (const waiter of this.waiters.splice(0)) waiter.reject(error2);
    this.ready = void 0;
    this.setState("failed");
    this.detachOutputs();
  }
  /** Stop publishing from a failed child but retain its handle for the owned shutdown. */
  detachOutputs() {
    if (this.readyTimer !== void 0) {
      clearTimeout(this.readyTimer);
      this.readyTimer = void 0;
    }
    this.stdout?.close();
    this.stderr?.close();
    this.stdout = void 0;
    this.stderr = void 0;
  }
  /** Clear the retained handle only after the exact child has exited. */
  cleanup() {
    this.detachOutputs();
    const child = this.child;
    this.child = void 0;
    this.childDone = void 0;
    if (child !== void 0 && child.exitCode === null) child.kill("SIGTERM");
  }
  /**
   * One request at a time. The second waits for the first to settle before it takes `pending`, so a `user_final` can
   * never resolve the wrong promise. The request is pending at once, so a cancel in the same tick can settle it.
   */
  send(pending, request) {
    if (this.closed) return Promise.reject(new EngineError("CANCELLED", "The engine has been shut down."));
    if (this.quarantined) return Promise.reject(new EngineError("CANCELLED", "The cancelled request's engine is being replaced."));
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
          this.quarantined = true;
          this.settle(new EngineError("TIMEOUT", "The speech engine did not answer in time."));
          this.setState("failed");
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
          } catch (error2) {
            this.settle(new EngineError("SIDECAR_FAILED", `The speech engine could not be written to: ${String(error2)}`));
          }
        }).catch((error2) => this.settle(error2 instanceof EngineError ? error2 : new EngineError("SIDECAR_FAILED", "The speech engine did not start.")));
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
  async synthesize(text3, path, options = {}) {
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
      { type: "synthesize", text: text3, path, ...rate === void 0 || rate === 1 ? {} : { speaking_rate: rate } }
    );
  }
  /** Aborts the in-flight request, and any queued request issued before now, then tells the engine. */
  cancel() {
    this.cancelEpoch += 1;
    if (this.pending !== void 0) {
      this.settle(new EngineError("CANCELLED", "The request was cancelled."));
      this.quarantined = true;
    }
    const child = this.child;
    if (child?.stdin !== null && child?.stdin !== void 0 && child.stdin.writable) {
      try {
        child.stdin.write(`${JSON.stringify({ v: 1, type: "abort" })}
`);
      } catch {
      }
    }
  }
  /** Fences this sidecar for good: no start, restart or dispatch, and every waiter rejects. */
  async close() {
    if (!this.closed) {
      this.closed = true;
      this.cancel();
    }
    await this.stop();
  }
  rejectWaiters(error2) {
    for (const waiter of this.waiters.splice(0)) waiter.reject(error2);
  }
  /** Asks the engine to exit, then escalates SIGTERM to SIGKILL; the promise is bounded whatever the child does. */
  async stop() {
    this.startEpoch += 1;
    const stopped = new EngineError("CANCELLED", "The engine was shut down.");
    if (this.readyTimer !== void 0) {
      clearTimeout(this.readyTimer);
      this.readyTimer = void 0;
    }
    if (this.pending !== void 0) this.settle(stopped);
    this.rejectWaiters(stopped);
    const child = this.child;
    if (child === void 0) {
      this.quarantined = false;
      this.setState("idle");
      return;
    }
    this.stopping = true;
    const completed = this.childDone;
    try {
      child.stdin?.write(`${JSON.stringify({ v: 1, type: "shutdown" })}
`);
    } catch {
    }
    const terminate = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    }, this.options.stopMs ?? STOP_GRACE);
    const kill = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }, (this.options.stopMs ?? STOP_GRACE) + KILL_GRACE);
    await completed;
    clearTimeout(terminate);
    clearTimeout(kill);
    this.cleanup();
    this.ready = void 0;
    this.quarantined = false;
    this.stopping = false;
    this.setState("idle");
  }
  /** Restarts once after a crash; a second failure is reported as it is. */
  async restart() {
    if (this.closed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    if (this.restarts >= 1) throw new EngineError("SIDECAR_FAILED", "The speech engine failed twice; it will not be restarted again.");
    this.restarts += 1;
    await this.stop().catch(() => void 0);
    this.failure = void 0;
    await this.start();
  }
};

// src/provider/wav.ts
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

// src/provider/speakable.ts
var DEFAULT_LIMIT = 4e3;
var stripFences = (text3) => text3.replace(/```[\s\S]*?```/g, " code block ");
var stripInline = (text3) => text3.replace(/`([^`]+)`/g, "$1");
var stripImages = (text3) => text3.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
var stripLinks = (text3) => text3.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
var stripHtml = (text3) => text3.replace(/<[^>]+>/g, " ");
var stripHeadings = (text3) => text3.replace(/^#{1,6}\s+/gm, "");
var stripEmphasis = (text3) => text3.replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2");
var stripRules = (text3) => text3.replace(/^\s*([-*_])\1{2,}\s*$/gm, " ");
var stripQuotes = (text3) => text3.replace(/^\s*>\s?/gm, "");
var stripBullets = (text3) => text3.replace(/^\s*[-*+]\s+/gm, "");
var stripNumbers = (text3) => text3.replace(/^\s*\d+[.)]\s+/gm, "");
var stripTable = (text3) => text3.split("\n").filter((line) => !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line)).map((line) => line.includes("|") ? line.replace(/\s*\|\s*/g, ", ").replace(/^,\s*|,\s*$/g, "") : line).join("\n");
function speakable(text3, limit = DEFAULT_LIMIT) {
  let value = text3;
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

// src/provider/index.ts
var SIDECAR_UTTERANCE_SECONDS = 30;
var SpeechEngine = class {
  sidecar;
  player;
  options;
  temp;
  checked = /* @__PURE__ */ new Set();
  retiring = /* @__PURE__ */ new Set();
  renderEpoch = 0;
  disposing;
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
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    this.checked.add(role);
  }
  /** Retire a sidecar that may still emit a cancelled or timed-out event; a new request starts a fresh child. */
  retire(sidecar) {
    const closing = sidecar.close().catch(() => void 0);
    this.retiring.add(closing);
    void closing.finally(() => this.retiring.delete(closing));
  }
  retireIfOwned(sidecar) {
    if (this.sidecar !== sidecar) return;
    this.sidecar = void 0;
    this.retire(sidecar);
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
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    await this.preflight(role);
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    if (this.sidecar === void 0) {
      let sidecar;
      const own2 = () => this.sidecar === sidecar;
      sidecar = new AurumSidecar({
        bin: this.options.bin,
        model: this.options.model,
        language: this.options.language,
        voice: this.options.voice,
        cacheDir: this.cacheDir,
        ...this.options.env === void 0 ? {} : { env: this.options.env },
        log: (level, message) => {
          if (own2()) this.options.log?.(level, message);
        },
        onState: (state) => {
          if (own2()) this.options.onState?.(state);
        },
        ...this.options.timeouts?.readyMs === void 0 ? {} : { readyMs: this.options.timeouts.readyMs },
        ...this.options.timeouts?.transcribeMs === void 0 ? {} : { transcribeMs: this.options.timeouts.transcribeMs },
        ...this.options.timeouts?.synthesizeMs === void 0 ? {} : { synthesizeMs: this.options.timeouts.synthesizeMs },
        ...this.options.timeouts?.stopMs === void 0 ? {} : { stopMs: this.options.timeouts.stopMs }
      });
      this.sidecar = sidecar;
    }
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    return this.sidecar;
  }
  /** Starts the sidecar and loads the model, so the first dictation does not pay the cold start. */
  async warmup() {
    const sidecar = await this.ensureSidecar();
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    try {
      await sidecar.start();
    } catch (error2) {
      if (error2 instanceof EngineError && error2.code === "TIMEOUT") this.retireIfOwned(sidecar);
      throw error2;
    }
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
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    this.assertLength(sidecar, wav.seconds);
    try {
      const result = await sidecar.transcribe(path);
      return { ...result, silent: false, wav };
    } catch (error2) {
      if (error2 instanceof EngineError && error2.code === "TIMEOUT") this.retireIfOwned(sidecar);
      throw error2;
    }
  }
  /** Synthesizes text to a temp WAV and returns its path; the caller plays it and calls `release`. */
  async synthesize(text3, options = {}) {
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    const epoch = this.renderEpoch;
    const spoken = options.markdown === true ? speakable(text3) : text3.trim();
    if (spoken === "") throw new EngineError("BAD_AUDIO", "There is nothing to read aloud.");
    const path = await this.newPath("wav");
    let sidecar;
    try {
      if (this.disposed || epoch !== this.renderEpoch) throw new EngineError("CANCELLED", "The render was cancelled.");
      sidecar = await this.ensureSidecar("tts");
      if (this.disposed || epoch !== this.renderEpoch) throw new EngineError("CANCELLED", "The render was cancelled.");
      const result = await sidecar.synthesize(spoken, path, options.rate === void 0 ? {} : { rate: options.rate });
      if (this.disposed || epoch !== this.renderEpoch) throw new EngineError("CANCELLED", "The render was cancelled.");
      return { path, spoken, durationMs: result.durationMs, voice: result.voice || this.options.voice };
    } catch (error2) {
      if (sidecar !== void 0 && error2 instanceof EngineError && error2.code === "TIMEOUT") this.retireIfOwned(sidecar);
      await rm3(path, { force: true });
      throw error2;
    }
  }
  /** Plays a WAV, at an optional speaking rate, or rejects with `CANCELLED` when the caller aborts or the engine is
   * already shut down. */
  async play(path, options = {}) {
    if (this.disposed) throw new EngineError("CANCELLED", "The engine has been shut down.");
    await this.player.play(path, { ...options.signal === void 0 ? {} : { signal: options.signal }, ...options.rate === void 0 ? {} : { rate: options.rate } });
  }
  stopPlayback() {
    this.player.stop();
  }
  cancel() {
    this.renderEpoch += 1;
    const sidecar = this.sidecar;
    if (sidecar?.hasPending === true) {
      this.sidecar = void 0;
      this.retire(sidecar);
    } else {
      sidecar?.cancel();
    }
    this.player.stop();
    this.activeRecorder?.cancel();
    this.activeRecorder = void 0;
  }
  async release(path) {
    if (path === "") return;
    await rm3(path, { force: true });
  }
  /** Every concurrent call shares one teardown, which awaits the exact owned children. */
  dispose() {
    if (this.disposing !== void 0) return this.disposing;
    this.disposing = this.teardown();
    return this.disposing;
  }
  async teardown() {
    this.disposed = true;
    const sidecar = this.sidecar;
    this.sidecar = void 0;
    const playback = this.player.stopAndWait();
    this.activeRecorder?.cancel();
    this.activeRecorder = void 0;
    if (this.recorderPath !== void 0) await rm3(this.recorderPath, { force: true }).catch(() => void 0);
    await sidecar?.close().catch(() => void 0);
    await Promise.allSettled([...this.retiring]);
    await playback;
    await rm3(this.temp, { recursive: true, force: true }).catch(() => void 0);
  }
};

// src/provider/install.ts
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
    files: [...engineMissing ? [pinned.entry.name] : [], ...missing.map((item2) => item2.file)],
    bytes: (engineMissing ? pinned.entry.bytes : 0) + missing.reduce((total, item2) => total + item2.bytes, 0),
    hosts: [.../* @__PURE__ */ new Set([...engineMissing ? [new URL(pinned.entry.url).host] : [], ...missing.map((item2) => new URL(item2.url).host)])],
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

// src/provider/create.ts
var PROBE_TTL_MS = 3e4;
function createProvider(input) {
  const platform = input.platform ?? process.platform;
  const arch = input.arch ?? process.arch;
  const env = input.env ?? process.env;
  const cacheRoot = input.cacheRoot ?? defaultCacheRoot(input.home ?? homedir(), platform, env);
  const engineCacheDir = join5(cacheRoot, "engine");
  const options = input.options;
  let engineInfo;
  let engineError;
  try {
    engineInfo = resolveEngine({
      packageRoot: input.packageRoot,
      cacheRoot,
      env,
      platform,
      arch,
      ...options.aurumPath === void 0 ? {} : { optionPath: options.aurumPath }
    });
  } catch (error2) {
    engineError = error2 instanceof EngineError ? error2 : new EngineError("ENGINE_MISSING", "The speech engine could not be resolved.");
  }
  const store = new ModelStore({
    cacheRoot,
    manifestPath: env.VOICE_MODELS_MANIFEST ?? join5(input.packageRoot, "manifest", "models.json"),
    ...options.assetsDir === void 0 ? {} : { assetsDir: options.assetsDir },
    ...input.fetchImpl === void 0 ? {} : { fetchImpl: input.fetchImpl }
  });
  const engine = engineInfo === void 0 ? void 0 : new SpeechEngine({
    bin: engineInfo.path,
    model: options.sttModel,
    language: options.language,
    cacheRoot,
    voice: options.voice,
    maxRecordSeconds: options.maxRecordSeconds,
    env,
    preflight: (role) => store.verifyRoles(role === "stt" ? ["stt"] : ["tts-model", "tts-voices", "tts-config"])
  });
  let probe;
  const probeFor = async (info) => {
    if (probe !== void 0 && Date.now() - probe.at < PROBE_TTL_MS) return probe;
    const [version2, check2] = await Promise.all([
      probeEngine(info.path, env),
      runDoctor(info.path, { env, cacheDir: engineCacheDir }).catch(() => void 0)
    ]);
    probe = { at: Date.now(), version: version2, check: check2 };
    return probe;
  };
  return {
    packageRoot: input.packageRoot,
    cacheRoot,
    engineCacheDir,
    engine,
    engineInfo,
    store,
    async facts() {
      const live = engineInfo === void 0 ? void 0 : await probeFor(engineInfo);
      const problems = [];
      const manifest2 = await store.manifest().catch((error2) => {
        problems.push(engineFailure(error2).what);
        return void 0;
      });
      const models = await store.inspect().catch((error2) => {
        problems.push(engineFailure(error2).what);
        return void 0;
      });
      return {
        ...problems.length === 0 ? {} : { problems },
        ...engineInfo === void 0 ? {} : { engine: engineInfo },
        ...live === void 0 ? {} : { probe: live.version },
        ...models === void 0 ? {} : { models },
        ...manifest2 === void 0 ? {} : { modelsVersion: manifest2.version },
        ...live?.check === void 0 ? {} : { doctor: live.check },
        microphone: live?.check === void 0 ? "unknown" : microphonePermission(live.check),
        ...live?.check === void 0 ? {} : { input: deviceName(live.check, "input") ?? void 0 },
        ...live?.check === void 0 ? {} : { output: deviceName(live.check, "output") ?? void 0 },
        ...engineError === void 0 ? {} : { engineError }
      };
    },
    installRequest: () => installRequest({
      packageRoot: input.packageRoot,
      cacheRoot,
      platform,
      arch,
      store
    }),
    install: (signal, ask) => installAll({ packageRoot: input.packageRoot, cacheRoot, platform, arch, store }, signal, ask),
    async dispose() {
      await engine?.dispose();
    }
  };
}

// src/tui.tsx
var PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
function activeSession(context) {
  const route = context.ui.router.current();
  return typeof route === "object" && route !== null && route.type === "session" ? route.sessionID : void 0;
}
var tui_default = Plugin.define({
  id: TUI_ID,
  async setup(context) {
    assertHost(context, manifest);
    const parsed = parseOptions(context.options);
    if (parsed.ok === false) {
      context.ui.toast.show({
        message: `${parsed.error.code}: ${parsed.error.message}`,
        variant: "error"
      });
      return;
    }
    const options = parsed.options;
    const keybind = options.keybind ?? defaultKeybind();
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
      write: async (entries) => {
        await updateHistoryState((draft) => {
          draft.entries = [...entries];
        });
      }
    });
    const provider = createProvider({
      packageRoot: PACKAGE_ROOT,
      options
    });
    const engine = provider.engine;
    const [, setPhase] = createSignal("idle");
    const [line, setLine] = createSignal(void 0);
    const [conflict, setConflict] = createSignal(void 0);
    const toast = (message, variant = "info") => context.ui.toast.show({
      message,
      variant
    });
    const status = (next, text3) => {
      if (next === "idle") {
        setPhase("idle");
        setLine(void 0);
      } else {
        setPhase(next);
        setLine(text3 === void 0 ? label(next) : `${label(next)}${text3 === "pause" ? " \xB7 pause" : ""}`);
      }
    };
    const flow = new DictationFlow({
      engine,
      activeSession: () => activeSession(context),
      submit: (sessionID, text3) => context.client.session.prompt({
        sessionID,
        text: text3
      }).then(() => void 0),
      review: (text3) => context.ui.dialog.prompt({
        title: "Voice transcript",
        description: "Edit before sending",
        value: text3
      }),
      toast,
      status,
      submitMode: () => settings().submit,
      record: (text3) => {
        if (options.keepTranscripts) void history.add(text3);
      }
    });
    let footerDispose;
    if (options.statusIndicator === "footer") {
      footerDispose = context.ui.slot({
        append: "prompt.footer.status",
        render: () => {
          const text3 = line();
          return text3 === void 0 ? (() => {
            var _el$ = _$createElement("text");
            _$insertNode(_el$, _$createTextNode(` `));
            return _el$;
          })() : (() => {
            var _el$3 = _$createElement("text");
            _$insert(_el$3, `Voice: ${text3}`);
            _$effect((_$p) => _$setProp(_el$3, "fg", context.theme.text.muted, _$p));
            return _el$3;
          })();
        }
      });
    }
    const requireEngine = () => {
      if (engine === void 0) {
        toast("UNAVAILABLE: The speech engine is not installed. Run /voice-install.", "error");
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
        const text3 = (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n");
        if (text3.trim() === "") continue;
        await flow.speak(text3, {
          markdown: true
        });
        return;
      }
      toast("There is no reply to read aloud", "info");
    };
    const readDoctor = async () => {
      const rules = rulesFor(manifest, options.access);
      const agents = context.data.location.agent.list(context.location) ?? [];
      return buildDoctor({
        provider,
        manifest,
        version: VERSION,
        options,
        keybind,
        hostVersion: context.app.version
      }, await provider.facts(), unguardedAgents(agents, rules));
    };
    const doctorLines = async () => {
      const answer = await readDoctor();
      const facts = await provider.facts();
      const checks = (facts.doctor ?? []).map((check2) => `${check2.ok ? "ok" : "failed"} \xB7 ${check2.id}: ${cut(oneLine(check2.detail), 120)}`);
      return [formatDoctor(answer), ...checks].join("\n");
    };
    const openStatus = () => {
      const [text3, setText] = createSignal("Reading the voice status\u2026");
      const [busy, setBusy] = createSignal(false);
      const [current, setCurrent] = createSignal(void 0);
      let stopped = false;
      const stops2 = [];
      const refresh = () => {
        if (stopped) return;
        setBusy(true);
        void readDoctor().then((answer) => {
          if (stopped) return;
          setCurrent(answer);
          const rows = formatDoctor(answer).split("\n").slice(1).join("\n");
          setText(conflict() === void 0 ? rows : `Keybind: ${conflict().key} is also used by ${conflict().command}
${rows}`);
        }, (error2) => setText(cut(oneLine(asEngineError(error2).message), 400))).then(() => setBusy(false));
      };
      const install = async () => {
        const request = await provider.installRequest().catch((error2) => {
          setText(cut(oneLine(asEngineError(error2).message), 400));
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
        void provider.install(new AbortController().signal, async () => void 0).then((result) => {
          toast(result.downloaded.length === 0 ? "Everything is already installed" : "Speech installed", "success");
          refresh();
        }, (error2) => setText(cut(oneLine(asEngineError(error2).message), 400)));
      };
      const doctor = async () => {
        setText("Running the voice doctor\u2026");
        const answer = await doctorLines().catch((error2) => cut(oneLine(asEngineError(error2).message), 400));
        setText(answer);
      };
      const toggleSubmit = () => {
        const next = settings().submit === "send" ? "review" : "send";
        updateStored((draft) => {
          draft.submit = next;
        });
        toast(next === "review" ? "Voice: review before sending" : "Voice: send on pause", "info");
        refresh();
      };
      const toggleAutoSpeak = () => {
        const next = !settings().autoSpeak;
        updateStored((draft) => {
          draft.autoSpeak = next;
        });
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
          _$insert(_el$9, text3);
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
        id: `${TUI_ID}.dictate`,
        title: "Voice: Dictate",
        description: "Start dictation; a pause or a second press sends it",
        group: "Voice",
        palette: true,
        bind: keybind,
        slash: {
          name: "voice-dictate"
        },
        run: () => void dictate()
      }, {
        id: `${TUI_ID}.status`,
        title: "Voice: Status",
        description: "The engine, the models, the microphone and the next step",
        group: "Voice",
        palette: true,
        slash: {
          name: "voice"
        },
        run: () => openStatus()
      }, {
        id: `${TUI_ID}.speak`,
        title: "Voice: Speak last response",
        description: "Read the last assistant reply aloud",
        group: "Voice",
        palette: true,
        slash: {
          name: "voice-speak"
        },
        run: () => void speakLast()
      }, {
        id: `${TUI_ID}.cancel`,
        title: "Voice: Cancel",
        description: "Stop the recording, transcription or playback",
        group: "Voice",
        bind: "escape",
        enabled: () => flow.active || flow.state === "playing",
        run: () => flow.cancel()
      }]
    }));
    const owner = context.keymap.commands().find((command) => command.bind === keybind && command.id !== `${TUI_ID}.dictate`);
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
          const text3 = (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n");
          if (text3.trim() === "") continue;
          spoken.add(message.id);
          if (spoken.size > 100) spoken = new Set([...spoken].slice(-50));
          void flow.speak(text3, {
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
      await provider.dispose();
    };
  }
});
function historySummary(answer, count) {
  return answer.privacy.transcriptHistory ? `history ${count}/20` : "history off";
}
export {
  tui_default as default
};
