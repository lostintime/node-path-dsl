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

import { expect } from "chai"
import { PathSegment } from "../src"

describe("PathSegment", () => {
  describe(".parse()", () => {
    it("returns Success<PathSegment> for valid path segments", () => {
      expect(PathSegment.parse("").isSuccess()).is.true
      expect(PathSegment.parse(" ").isSuccess()).is.true
      expect(PathSegment.parse(".").isSuccess()).is.true
      expect(PathSegment.parse("..").isSuccess()).is.true
      expect(PathSegment.parse("ssss").isSuccess()).is.true
      expect(PathSegment.parse("hello/there", "\\").isSuccess()).is.true
    })

    it("returns Failure<Error> for invalid path segments", () => {
      expect(PathSegment.parse(null as any).isFailure()).is.true
      expect(PathSegment.parse(undefined as any).isFailure()).is.true
      expect(PathSegment.parse(10 as any).isFailure()).is.true
      expect(PathSegment.parse({} as any).isFailure()).is.true
      expect(PathSegment.parse(true as any).isFailure()).is.true
    })

    it("can be exhaistively matched using swich statement", () => {
      const segment: PathSegment = PathSegment.parse("..").get()
      const getSegmentStr = (s: PathSegment): string => {
        switch (s._tag) {
          case "Empty": return ""
          case "Current": return "."
          case "Up": return ".."
          case "Custom": return s.toString()
        }
      }

      expect(getSegmentStr(segment)).equals("..")
    })

    it("fails when segment string contains separator", () => {
      expect(PathSegment.parse("hello/there", "/").isFailure()).is.true
      expect(PathSegment.parse("hello\\there", "\\").isFailure()).is.true
    })
  })

  describe(".toString()", () => {
    it("returns \"\" for Empty path segment", () => {
      expect(PathSegment.parse("").get().toString()).equals("")
    })

    it("returns \".\" for Current path segment", () => {
      expect(PathSegment.parse(".").get().toString()).equals(".")
    })

    it("returns \"..\" for Up path segment", () => {
      expect(PathSegment.parse("..").get().toString()).equals("..")
    })

    it("returns segment string for Custom path segment", () => {
      expect(PathSegment.parse("hello").get().toString()).equals("hello")
    })
  })
})
