// Adapted from oc-aurum (https://github.com/cesar-alves/oc-aurum), src/speakable.ts
// Copyright (c) 2026 Cesar Alves. MIT. See NOTICE.
//
// Markdown to what should be spoken: code and links become their words, a table is read as rows, headings lose their
// hashes, and the result is cut at a word boundary. It never claims to be a summary; it is a reading of the text.

const DEFAULT_LIMIT = 4_000

const stripFences = (text: string) => text.replace(/```[\s\S]*?```/g, " code block ")
const stripInline = (text: string) => text.replace(/`([^`]+)`/g, "$1")
const stripImages = (text: string) => text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
const stripLinks = (text: string) => text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
const stripHtml = (text: string) => text.replace(/<[^>]+>/g, " ")
const stripHeadings = (text: string) => text.replace(/^#{1,6}\s+/gm, "")
const stripEmphasis = (text: string) => text.replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2")
const stripRules = (text: string) => text.replace(/^\s*([-*_])\1{2,}\s*$/gm, " ")
const stripQuotes = (text: string) => text.replace(/^\s*>\s?/gm, "")
const stripBullets = (text: string) => text.replace(/^\s*[-*+]\s+/gm, "")
const stripNumbers = (text: string) => text.replace(/^\s*\d+[.)]\s+/gm, "")
const stripTable = (text: string) =>
  text
    .split("\n")
    .filter((line) => !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line))
    .map((line) => (line.includes("|") ? line.replace(/\s*\|\s*/g, ", ").replace(/^,\s*|,\s*$/g, "") : line))
    .join("\n")

/** The text as it should be spoken, at most `limit` characters, cut between words. */
export function speakable(text: string, limit = DEFAULT_LIMIT): string {
  let value = text
  value = stripFences(value)
  value = stripImages(value)
  value = stripLinks(value)
  value = stripTable(value)
  value = stripHtml(value)
  value = stripHeadings(value)
  value = stripRules(value)
  value = stripQuotes(value)
  value = stripBullets(value)
  value = stripNumbers(value)
  value = stripInline(value)
  value = stripEmphasis(value)
  value = value.replace(/\s+/g, " ").trim()
  if (value.length <= limit) return value
  const cut = value.slice(0, limit - 1)
  const at = cut.lastIndexOf(" ")
  return `${(at > limit / 2 ? cut.slice(0, at) : cut).trimEnd()}…`
}

