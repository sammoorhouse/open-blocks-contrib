var test = require("unit.js"),
openBlocks = require("../open-blocks.js")

describe("openblocks", function(){
  describe("lesson construction", function(){
    it("resolves the correct dependencies")
    it("fails if required dependencies don't exist")
    it("resolves the correct number and location of sections")
    it("resolves the correct output directory")
  })
  describe("section construction", function(){
    it("resolves the name of the lesson")
    it("resolves the description of the lesson")
    it("resolves the dependencies of the lesson")
  })
  describe("template resolution", function(){
    it("determines the correct template for a section")
    describe("audio-with-transcript built-in template", function(){
      it("creates the body html")
      it("creates the wrapper html")
    })
    describe("picture-with-text built-in template", function(){
      it("creates the body html")
      it("creates the wrapper html")
    })
    describe("quiz built-in template", function(){
      it("creates the body html")
      it("creates the wrapper html")
    })
    describe("text built-in template", function(){
      it("creates the body html")
      it("creates the wrapper html")
    })
    it("successfully writes to the output directory")
  })
});
