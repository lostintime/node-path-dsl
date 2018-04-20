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
import * as Path from "../src"

describe("Examples", () => {
  describe("parse", () => {
    it("can be parsed from string", () => {
      Path.parse("path/to/my/file")
    })
  })

  describe("join", () => {
    it("can be appended", () => {
      const path = Path.join("path/to/my/file", "hello/world")

      expect(path.isSuccess()).is.true
      expect(path.get().toString()).equals("path/to/my/file/hello/world")
    })
  })
})
