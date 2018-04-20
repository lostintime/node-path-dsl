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
import { Path } from "../src"
import { RelRoot, AbsRoot, AbsPath, RelPath } from "../src/path"
import { PathSegmentCustom, PathSegmentUp } from "../src/segment"

describe("AbsRoot", () => {
  describe("Object", () => {
    it("is tagged with AbsRoot", () => {
      expect(AbsRoot._tag).equals("AbsRoot")
    })

    it("is absolue", () => {
      expect(AbsRoot.isAbsolute).is.true
    })
  })

  describe(".child()", () => {
    it("returns AbsPath instance", () => {
      const segment = PathSegmentCustom.parse("hello-there").get()
      let path = AbsRoot.child(segment)
      expect(path._tag).equals("AbsPath")
      expect(path.prev).equals(AbsRoot)
      expect(path.isAbsolute).is.true
      expect(path.segment.toString()).equals("hello-there")
    })
  })

  describe(".append()", () => {
    it("returns this for RelRoot", () => {
      const path = AbsRoot.append(RelRoot).get()
      expect(path).equals(AbsRoot)
    })

    it("returns appended path for child RelPath", () => {
      const rel = RelRoot.child(PathSegmentCustom.parse("hello").get())
      expect(rel.toString()).equals("hello")
      const path = AbsRoot.append(rel).get()
      expect(path.toString()).equals("/hello")
    })

    it("returns failure for paths going up", () => {
      const rel = RelRoot
        .child(PathSegmentUp)
        .child(PathSegmentCustom.parse("hello").get())
      expect(rel.toString()).equals("../hello")

      const path = AbsRoot.append(rel)
      expect(path.isFailure()).is.true
    })
  })

  describe(".toString()", () => {
    it("returns \"/\"", () => {
      expect(AbsRoot.toString()).equals("/")
    })
  })
})

describe("AbsPath", () => {
  describe("instance", () => {
    it("can be created using (only) Custom path segment", () => {
      const path = new AbsPath(AbsRoot, PathSegmentCustom.parse("hello").get())
      expect(path._tag).equals("AbsPath")
      expect(path.isAbsolute).equals(true)
      expect(path.prev).equals(AbsRoot)
      const getSegment = (path: AbsPath): PathSegmentCustom => {
        return path.segment
      }
      expect(getSegment(path).toString()).equals("hello")
    })
  })

  describe(".child()", () => {
    it("returns AbsPath instance", () => {
      const path = new AbsPath(AbsRoot, PathSegmentCustom.parse("hello").get())
      const child = path.child(PathSegmentCustom.parse("there").get())
      expect(child._tag).equals("AbsPath")
      expect(child.segment.toString()).equals("there")
      expect(child.prev).equals(path)
    })
  })

  describe(".parent()", () => {

  })

  describe(".fold()", () => {
    it("traverses all segments starting from root", () => {
      const segments = AbsRoot
        .child(PathSegmentCustom.parse("hello").get())
        .child(PathSegmentCustom.parse("there").get())
        .fold([] as Array<string>)((arr, segment) => {
          arr.push(segment.toString())
          return arr
        })

      expect(segments.length).equals(2)
      expect(segments[0]).equals("hello")
      expect(segments[1]).equals("there")
    })
  })

  describe(".append()", () => {
    it("returns this for RelRoot", () => {
      const path = AbsRoot
        .child(PathSegmentCustom.parse("hello").get())
      expect(path.toString()).equals("/hello")

      expect(path.append(RelRoot).get()).equals(path)
    })

    it("returns appended path for child RelPath", () => {
      const base = AbsRoot.child(PathSegmentCustom.parse("hello").get())
      expect(base.toString()).equals("/hello")

      const rel = RelRoot.child(PathSegmentCustom.parse("world").get())
      expect(rel.toString()).equals("world")

      const path = base.append(rel).get()
      expect(path.toString()).equals("/hello/world")
    })

    it("returns appended path if not reaching root", () => {
      const base = AbsRoot.child(PathSegmentCustom.parse("hello").get())
      expect(base.toString()).equals("/hello")

      const rel = RelRoot
        .child(PathSegmentUp)
        .child(PathSegmentCustom.parse("aloha").get())
      expect(rel.toString()).equals("../aloha")

      const path = base.append(rel).get()
      expect(path.toString()).equals("/aloha")
    })

    it("returns failure for paths going up", () => {
      const base = AbsRoot.child(PathSegmentCustom.parse("hello").get())
      expect(base.toString()).equals("/hello")

      const rel = RelRoot
        .child(PathSegmentUp)
        .child(PathSegmentUp)
        .child(PathSegmentCustom.parse("world").get())
      expect(rel.toString()).equals("../../world")

      const path = base.append(rel)
      expect(path.isFailure()).is.true
    })
  })

  describe(".toString()", () => {
    it("returns paths joined and starting with sep", () => {
      const path: AbsPath = AbsRoot.child(PathSegmentCustom.parse("hello").get())

      const child = path.child(PathSegmentCustom.parse("there").get())

      expect(path.toString()).equals("/hello")
      expect(child.toString()).equals("/hello/there")
    })
  })
})

describe("RelRoot", () => {
  describe("Object", () => {
    it("is tagged with RelRoot", () => {
      expect(RelRoot._tag).equals("RelRoot")
    })

    it("is not absolute", () => {
      expect(RelRoot.isAbsolute).is.false
    })
  })

  describe(".child()", () => {
    it("returns new RelativePath instance for Up segment type", () => {
      const path = RelRoot.child(PathSegmentUp)
      expect(path._tag).equals("RelPath")
      if (path._tag === "RelPath") { // refine
        expect(path.prev).equals(RelRoot)
        expect(path.segment).equals(PathSegmentUp)
      }
    })

    it("returns new RelativePath instance for Custom segment type", () => {
      expect(RelRoot.child(PathSegmentCustom.parse("hello").get())._tag).equals("RelPath")
    })
  })

  describe(".append()", () => {
    it("returns RelRoot for RelRoot", () => {
      const path = RelRoot.append(RelRoot).get()
      expect(path).equals(RelRoot)
    })

    it("returns given path for RelPah", () => {
      const rel = RelRoot.child(PathSegmentCustom.parse("hello").get())
      const path = RelRoot.append(rel).get()
      expect(path).equals(rel)
    })
  })

  describe(".toString()", () => {
    it("returns \"\"", () => {
      expect(RelRoot.toString()).equals("")
    })
  })
})

describe("RelPath", () => {
  describe("instance", () => {
    it("can be created using Up path segment", () => {
      const path = new RelPath(RelRoot, PathSegmentUp)
      expect(path._tag).equals("RelPath")
      expect(path.isAbsolute).is.false
      expect(path.prev).equals(RelRoot)
    })

    it("can be created using Custom path segment", () => {
      const path = new RelPath(RelRoot, PathSegmentCustom.parse("hello").get())
      expect(path._tag).equals("RelPath")
      expect(path.isAbsolute).is.false
      expect(path.prev).equals(RelRoot)
    })

    it("can contain only Up or Custom segment types", () => {
      const path = new RelPath(RelRoot, PathSegmentCustom.parse("hello").get())
      const getSegment = (path: RelPath): PathSegmentUp | PathSegmentCustom => {
        return path.segment
      }
      expect(getSegment(path).toString()).equals("hello")
    })

    it("is tagged with RelPath", () => {
      const path = new RelPath(RelRoot, PathSegmentCustom.parse("hello").get())
      expect(path._tag).equals("RelPath")
    })
  })

  describe(".child()", () => {
    it("returns new RelPah instance for Up segment type", () => {
      const path = new RelPath(RelRoot, PathSegmentCustom.parse("hello").get())
      const child = path.child(PathSegmentCustom.parse("there").get())
      if (child._tag === "RelPath") {
        expect(child.segment.toString()).equals("there")
        expect(child.prev).equals(path)
      } else {
        expect(true).is.false
      }
    })

    it("returns new RelPath instance for Custom segment type", () => {
      expect(RelRoot.child(PathSegmentCustom.parse("hello").get())._tag).equals("RelPath")
    })

    it("normalizes Up segment (returns RelRoot for \"hello/..\" path)", () => {
      const segment = PathSegmentCustom.parse("hello").get()
      const path = new RelPath(RelRoot, segment)
      const child = path.child(PathSegmentUp)
      expect(child).equals(RelRoot)
      expect(child._tag).equals("RelRoot")

      const child2 = path.child(segment).child(PathSegmentUp).child(PathSegmentUp)
      expect(child2).equals(RelRoot)
      expect(child2._tag).equals("RelRoot")
    })

    it("can go Up from RelRoot", () => {
      const path = RelRoot.child(PathSegmentUp).child(PathSegmentUp)

      expect(path._tag).equals("RelPath")
      if (path._tag === "RelPath") {
        expect(path.segment).equals(PathSegmentUp)
        expect(path.prev._tag).equals("RelPath")
        if (path.prev._tag === "RelPath") {
          expect(path.prev.segment).equals(PathSegmentUp)
          expect(path.prev.prev).equals(RelRoot)
        }
      } else {
        expect(false).is.true("prev is not RelPath")
      }
    })
  })

  describe(".fold()", () => {
    it("traverses all segments starting from root", () => {
      const segments = RelRoot
        .child(PathSegmentCustom.parse("hello").get())
        .child(PathSegmentCustom.parse("there").get())
        .fold([] as Array<string>)((arr, segment) => {
          arr.push(segment.toString())
          return arr
        })

      expect(segments.length).equals(2)
      expect(segments[0]).equals("hello")
      expect(segments[1]).equals("there")
    })
  })

  describe(".append()", () => {
    it("returns this for RelRoot", () => {
      const path = RelRoot.child(PathSegmentCustom.parse("hello").get())
      const appended = path.append(RelRoot).get()
      expect(appended).equals(path)
    })

    it("returns appended path for RelPath", () => {
      const base = RelRoot
        .child(PathSegmentCustom.parse("hello").get())
        .child(PathSegmentCustom.parse("there").get())
      expect(base.toString()).equals("hello/there")

      const next = RelRoot
        .child(PathSegmentUp)
        .child(PathSegmentCustom.parse("world").get())
      expect(next.toString()).equals("../world")

      const path = base.append(next).get()
      expect(path.toString()).equals("hello/world")
    })
  })

  describe(".toString()", () => {
    it("returns paths joined and starting with sep", () => {
      const path1: RelPath = RelRoot.parent()
      const path2 = path1.parent()

      const path3 = path2.child(PathSegmentCustom.parse("hello").get())
      const path4 = path3.child(PathSegmentCustom.parse("there").get())

      expect(path1.toString()).equals("..")
      expect(path2.toString()).equals("../..")
      expect(path3.toString()).equals("../../hello")
      expect(path4.toString()).equals("../../hello/there")
    })
  })
})

describe("Path", () => {
  describe(".parse()", () => {
    it("returns RelRoot object for \"\" (empty) string", () => {
      const path = Path.parse("").get()
      expect(path).equals(RelRoot)
      expect(path === RelRoot).is.true
    })

    it("returns AbsRoot object for \"/\" string", () => {
      const path = Path.parse("/").get()
      expect(path).equals(AbsRoot)
      expect(path === AbsRoot).is.true
    })

    it("returns RelPath for \"hello\" string", () => {
      const path = Path.parse("hello").get()
      expect(path.isAbsolute).is.false
      expect(path._tag).equals("RelPath")
      if (path._tag === "RelPath") {
        expect(path.segment.toString()).equals("hello")
      } else {
        expect(true).is.false
      }

      const path2 = Path.parse("there").get()
      expect(path2._tag).equals("RelPath")
    })

    it("returns AbsPath for \"/hello\" string", () => {
      const path = Path.parse("/hello").get()
      expect(path.isAbsolute).is.true
      expect(path._tag).equals("AbsPath")
      if (path._tag === "AbsPath") {
        expect(path.segment.toString()).equals("hello")
      } else {
        expect(true).is.true
      }

      const path2 = Path.parse("/there").get()
      expect(path2._tag).equals("AbsPath")
    })

    it("returns RelPath for \"a/b/c/d\"", () => {
      const path = Path.parse("a/b/c/d").get()
      expect(path.isAbsolute).is.false
      expect(path._tag).equals("RelPath")
    })

    it("returns AbsPath for \"/a/b/c/d/e\"", () => {
      const path = Path.parse("/a/b/c/d").get()
      expect(path.isAbsolute).is.true
      expect(path._tag).equals("AbsPath")
    })

    it("supports custom separators", () => {
      const path = Path.parse("\\a\\b\\c", "\\").get()
      expect(path.isAbsolute).is.true
      expect(path._tag).equals("AbsPath")
    })

    it("returns Failure<Error> going higher than root", () => {
      expect(Path.parse("/..").isFailure()).is.true
      expect(Path.parse("/hello/there/../../../../../again").isFailure()).is.true
    })

    it("returns Failure<Error> on failure", () => {
      expect(Path.parse(null as any).isFailure()).is.true
      expect(Path.parse(undefined as any).isFailure()).is.true
      expect(Path.parse(10 as any).isFailure()).is.true
      expect(Path.parse({} as any).isFailure()).is.true
      expect(Path.parse(true as any).isFailure()).is.true
    })
  })

  describe(".concat()", () => {
    it("returns failure when trying to concat AbsRoot", () => {
      const left = Path.parse("hello/there").get()
      expect(Path.concat(left, AbsRoot).isFailure()).is.true
    })

    it("returns failure when trying to concat AbsPath", () => {
      const left = Path.parse("hello/there").get()
      expect(Path.concat(left, AbsRoot).isFailure()).is.true
    })

    it("returns success when trying to concat RelRoot", () => {
      const left = Path.parse("hello/there").get()
      expect(Path.concat(left, RelRoot).isSuccess()).is.true
    })

    it("returns success when trying to concat RelPath", () => {
      const left = Path.parse("hello/here").get()
      const right = Path.parse("../world").get()
      expect(Path.concat(left, right).isSuccess()).is.true
    })
  })

  describe(".join()", () => {
    it("fails when there is an absolute path to append", () => {
      const path = Path.join("/a/b/c", "d/e/f", "/g/h")
      expect(path.isFailure()).is.true

      const path2 = Path.join("a/b/c", "/d")
      expect(path2.isFailure()).is.true

      const path3 = Path.join("a/b/c", "/")
      expect(path3.isFailure()).is.true

      const path4 = Path.join("/a/b", "..", "..", "../hello")
      expect(path4.isFailure()).is.true
    })

    it("works for valid combinations", () => {
      const path = Path.join("/a/b/c/", "d/e/f", "g/h")
      expect(path.isSuccess()).is.true
      expect(path.get().isAbsolute).is.true
      expect(path.get().toString()).equals("/a/b/c/d/e/f/g/h")

      const path2 = Path.join("a/b/c/", "", ".", "d/e/f")
      expect(path2.isSuccess()).is.true
      expect(path2.get().isAbsolute).is.false
      expect(path2.get().toString()).equals("a/b/c/d/e/f")

      const path3 = Path.join("/a/b/c", "..", "..", "../d/e/f/..", "g")
      expect(path3.isSuccess()).is.true
      expect(path3.get().isAbsolute).is.true
      expect(path3.get().toString()).equals("/d/e/g")

      const path4 = Path.join()
      expect(path4.isSuccess()).is.true
      expect(path4.get()).equals(RelRoot)

      const path5 = Path.join("a", "b")
      expect(path5.isSuccess()).is.true
      expect(path5.get().toString()).equals("a/b")
    })
  })

  describe(".toString()", () => {
    it("returns same or normalized input path string", () => {
      // Some relative paths
      expect(Path.parse("").get().toString()).equals("")
      expect(Path.parse(".").get().toString()).equals("") // normalized
      expect(Path.parse("./").get().toString()).equals("")
      expect(Path.parse(".//").get().toString()).equals("")
      expect(Path.parse(".///").get().toString()).equals("")

      expect(Path.parse("./hello").get().toString()).equals("hello")
      expect(Path.parse("../hello").get().toString()).equals("../hello")
      expect(Path.parse("hello/there/again/..").get().toString()).equals("hello/there")
      expect(Path.parse("./hello/there/again/../../world").get().toString()).equals("hello/world")
      expect(Path.parse("./../../../../hello/there/again/..").get().toString()).equals("../../../../hello/there")
      expect(Path.parse("hello/./././././there").get().toString()).equals("hello/there")

      // some absolute paths
      expect(Path.parse("/hello/there/again/../../world").get().toString()).equals("/hello/world")
      expect(Path.parse("/hello/././././there/again/../../world").get().toString()).equals("/hello/world")
      expect(Path.parse("/one/././two////.././three").get().toString()).equals("/one/three")

      // custom separator
      expect(Path.parse("/one/././two////.././three").get().toString("\\")).equals("\\one\\three")
      expect(Path.parse("one/two/three").get().toString("\\")).equals("one\\two\\three")
    })
  })
})
