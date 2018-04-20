/*!
 * Copyright (c) 2018 by The Node Path DSL Project Developers.
 * Some rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Try, Failure, Success } from "funfix-core"
import { isString } from "typematcher"
import { PathSegment } from "."
import { PathSegmentCustom, PathSegmentUp } from "./segment"

/**
 * Default path separator string
 */
const DEFAULT_SEP = "/"

/**
 * Absolute path root node type ("/")
 */
export type AbsRoot = {
  readonly _tag: "AbsRoot"

  readonly isAbsolute: true

  child(segment: AbsPath["segment"]): AbsPath

  fold<A>(acc: A): (fn: (acc: A, p: AbsPath["segment"]) => A) => A

  append(path: RelRoot | RelPath): Try<AbsRoot | AbsPath>

  toString(sep?: string): string
}

/**
 * Absolute path root node object
 */
export const AbsRoot: AbsRoot = {
  _tag: "AbsRoot",
  isAbsolute: true,
  child: (segment: AbsPath["segment"]): AbsPath => {
    return new AbsPath(AbsRoot, segment)
  },
  fold: <A>(acc: A) => (fn: (acc: A, p: AbsPath["segment"]) => A) => acc,
  append(path: RelRoot | RelPath): Try<AbsRoot | AbsPath> {
    switch (path._tag) {
      case "RelRoot": return Success(this)
      case "RelPath": return path.fold(Success(this as AbsRoot | AbsPath))(
        (acc, s) => acc.flatMap(acc => {
          switch (s._tag) {
            case "Up": return Failure(new Error("Cannot go up from root"))
            case "Custom": return Success(acc.child(s))
          }
        })
      )
    }
  },
  toString: (sep: string = DEFAULT_SEP) => sep
}

/**
 * Absolute path (starts with root path)
 */
export class AbsPath {
  readonly _tag: "AbsPath" = "AbsPath"

  readonly isAbsolute: true = true

  constructor(readonly prev: AbsRoot | AbsPath,
              readonly segment: PathSegmentCustom) {
  }

  child(segment: AbsPath["segment"]): AbsPath {
    return new AbsPath(this, segment)
  }

  fold<A>(acc: A): (fn: (acc: A, p: AbsPath["segment"]) => A) => A {
    return (fn) => fn(this.prev.fold(acc)(fn), this.segment)
  }

  append(path: RelRoot | RelPath): Try<AbsRoot | AbsPath> {
    switch (path._tag) {
      case "RelRoot": return Success(this)
      case "RelPath": {
        const acc = this as AbsRoot | AbsPath
        return path.fold(Success(acc))((acc, s) => acc.flatMap(acc => {
          // Have to use ifs because switch exhaustivity checking doesn't work for nested switch statements
          if (s._tag === "Custom") {
            return Success(acc.child(s))
          } else {
            return absoluteUp(acc)
          }
        }))
      }
    }
  }

  toString(sep: string = DEFAULT_SEP): string {
    switch (this.prev._tag) {
      case "AbsRoot": return `${sep}${this.segment}`
      case "AbsPath": return `${this.prev.toString(sep)}${sep}${this.segment}`
    }
  }
}

/**
 * Relative path root node type ("")
 */
export type RelRoot = {
  readonly _tag: "RelRoot"

  readonly isAbsolute: false

  child: (segment: RelPath["segment"]) => RelPath

  parent: () => RelPath

  fold: <A>(acc: A) => (fn: (acc: A, p: RelPath["segment"]) => A) => A

  append(path: RelRoot | RelPath): Try<RelRoot | RelPath>

  toString(sep?: string): string
}

/**
 * Relative path root node object
 */
export const RelRoot: RelRoot = {
  _tag: "RelRoot",
  isAbsolute: false,
  child: (segment: RelPath["segment"]): RelPath => {
    return new RelPath(RelRoot, segment)
  },
  parent: (): RelPath => {
    return new RelPath(RelRoot, PathSegmentUp)
  },
  fold: <A>(acc: A) => (fn: (acc: A, p: RelPath["segment"]) => A) => acc,
  append: (path: RelRoot | RelPath): Try<RelRoot | RelPath> => {
    switch (path._tag) {
      case "RelRoot": return Success(RelRoot)
      case "RelPath": return Success(path)
    }
  },
  toString: (sep: string = DEFAULT_SEP) => ""
}

/**
 * Relative path (starts with empty path)
 */
export class RelPath {
  readonly _tag: "RelPath" = "RelPath"

  readonly isAbsolute: false = false

  constructor(readonly prev: RelPath | RelRoot,
              readonly segment: PathSegmentUp | PathSegmentCustom) {
  }

  child(segment: RelPath["segment"]): RelPath | RelRoot {
    switch (segment._tag) {
      case "Up": return this.parent()
      case "Custom": return new RelPath(this, segment)
    }
  }

  parent(): RelPath | RelRoot {
    switch (this.segment._tag) {
      case "Up": return new RelPath(this, PathSegmentUp)
      case "Custom": return this.prev
    }
  }

  fold<A>(acc: A): (fn: (acc: A, p: RelPath["segment"]) => A) => A {
    return (fn) => fn(this.prev.fold(acc)(fn), this.segment)
  }

  append(path: RelRoot | RelPath): Try<RelRoot | RelPath> {
    switch (path._tag) {
      case "RelRoot": return Success(this)
      case "RelPath": return Success(path.fold(this as RelPath | RelRoot)((acc, s) => acc.child(s)))
    }
  }

  toString(sep: string = DEFAULT_SEP): string {
    switch (this.prev._tag) {
      case "RelRoot": return this.segment.toString()
      case "RelPath": return `${this.prev.toString(sep)}${sep}${this.segment.toString()}`
    }
  }
}

/**
 * Path ADT
 */
export type Path =
  | AbsRoot
  | AbsPath
  | RelRoot
  | RelPath

/**
 * Fold a list of segments into a Relative path
 */
function foldRelative(path: RelRoot | RelPath, segments: Array<string>, sep: string): Try<RelRoot | RelPath> {
  if (segments.length === 0) {
    return Success(path)
  } else {
    return PathSegment
      .parse(segments[0], sep)
      .flatMap(segment => {
        switch (segment._tag) {
          case "Empty": return foldRelative(path, segments.slice(1), sep)
          case "Current": return foldRelative(path, segments.slice(1), sep)
          case "Up": return foldRelative(path.child(segment), segments.slice(1), sep)
          case "Custom": return foldRelative(path.child(segment), segments.slice(1), sep)
        }
      })
  }
}

/**
 * Try to return "up" path for an absolute path
 */
function absoluteUp(path: AbsRoot | AbsPath): Try<AbsRoot | AbsPath> {
  switch (path._tag) {
    case "AbsRoot": return Failure("Cannot go up from AbsRoot")
    case "AbsPath": return Success(path.prev)
  }
}

/**
 * Fold a list of segments into an Absolute path
 */
function foldAbsolute(path: AbsRoot | AbsPath, segments: Array<string>, sep: string): Try<AbsRoot | AbsPath> {
  if (segments.length === 0) {
    return Success(path)
  } else {
    return PathSegment
      .parse(segments[0], sep)
      .flatMap(segment => {
        switch (segment._tag) {
          case "Empty": return foldAbsolute(path, segments.slice(1), sep)
          case "Current": return foldAbsolute(path, segments.slice(1), sep)
          case "Up": return absoluteUp(path).flatMap(p => foldAbsolute(p, segments.slice(1), sep))
          case "Custom": return foldAbsolute(path.child(segment), segments.slice(1), sep)
        }
      })
  }
}

/**
 * Parses path using given separator
 *
 * @param path path string to parse
 * @param sep path segments separator
 */
export function parse(path: string, sep: string = DEFAULT_SEP): Try<Path> {
  if (isString(path)) {
    const parts = path.split(sep)
    if (parts.length > 1 && parts[0] === "") {
      return foldAbsolute(AbsRoot, parts.slice(1), sep)
    } else {
      return foldRelative(RelRoot, parts, sep)
    }
  } else {
    return Failure(new Error("path is not a string"))
  }
}

export function concat(left: Path, right: Path): Try<Path> {
  switch (right._tag) {
    case "AbsRoot": return Failure(new Error("Cannot append absolute path"))
    case "AbsPath": return Failure(new Error("Cannot append absolute path"))
    case "RelRoot": return left.append(right)
    case "RelPath": return left.append(right)
  }
}

/**
 * Parses and joins given paths using provided separaor
 */
export function joinUsing(sep: string = DEFAULT_SEP): (...paths: Array<string>) => Try<Path> {
  return (...paths) => {
    if (paths.length === 0) {
      // No elements - using RelativeRoot by default
      return Success(RelRoot)
    } else if (paths.length === 1) {
      // Single element - just parsing it
      return parse(paths[0], sep)
    } else {
      // Two or more elemnts - parse head and concat with tail
      return parse(paths[0], sep)
        .flatMap(head => Path
          .join(...paths.slice(1))
          .flatMap(tail => Path.concat(head, tail))
        )
    }
  }
}

/**
 * Prases and joins paths using default separator: "/"
 */
export const join: (...paths: Array<string>) => Try<Path> = joinUsing()

export const Path = {
  parse: parse,
  concat: concat,
  join: join,
  joinUsing: joinUsing
}
