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

import { Try, Success, Failure } from "funfix-core"
import { isString } from "typematcher"

export type PathSegmentEmpty = {
  readonly _tag: "Empty"

  toString(): string
}

export const PathSegmentEmpty: PathSegmentEmpty = {
  _tag: "Empty",
  toString: () => ""
}

export type PathSegmentCurrent = {
  readonly _tag: "Current"

  toString(): string
}

export const PathSegmentCurrent: PathSegmentCurrent = {
  _tag: "Current",
  toString: () => "."
}

export type PathSegmentUp = {
  readonly _tag: "Up"

  toString(): string
}

export const PathSegmentUp: PathSegmentUp = {
  _tag: "Up",
  toString: () => ".."
}

export class PathSegmentCustom {
  readonly _tag = "Custom"

  private constructor(private readonly value: string) {
  }

  toString(): string {
    return this.value
  }

  static parse(segment: string, sep: string = "/"): Try<PathSegmentCustom> {
    if (segment.includes(sep)) {
      return Failure(new Error(`Invalid path segment "${segment}": may not include path separator "${sep}"`))
    } else {
      return Success(new PathSegmentCustom(segment))
    }
  }
}

/**
 * Path segment ADT, values may be one of:
 *
 *   - "" - empty path segment, ex. "/hello///there"
 *   - "." - "current path" segment, ex. "/hello/././there"
 *   - ".." - "parent folder" segment, ex. "/hello/../there"
 *   - custom segments - any string not containing segments separator
 */
export type PathSegment =
  | PathSegmentEmpty
  | PathSegmentCurrent
  | PathSegmentUp
  | PathSegmentCustom

/**
 * Parse path segment
 *
 * @param segment segment string
 * @param sep segments separator
 */
export function parse(segment: string, sep: string = "/"): Try<PathSegment> {
  if (isString(segment)) {
    if (segment === "") {
      return Success<PathSegment>(PathSegmentEmpty)
    } else if (segment === ".") {
      return Success<PathSegment>(PathSegmentCurrent)
    } else if (segment === "..") {
      return Success<PathSegment>(PathSegmentUp)
    } else {
      return PathSegmentCustom.parse(segment, sep)
    }
  }

  return Failure(new Error(`Invalid path segment "${segment}"`))
}

/**
 * PathSegment object
 */
export const PathSegment = {
  parse: parse
}
