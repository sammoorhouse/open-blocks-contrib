var test = require("unit.js"),
  openBlocks = require("../open-blocks.js"),
  expect = require("chai").expect;

var audioWithTranscriptExample = require("./examples/audio-with-transcript.json")
var pictureWithTextExample = require("./examples/picture-with-text.json")
var textExample = require("./examples/text.json")

describe("openblocks", function() {
  describe("lesson construction", function() {
    it("resolves the correct lesson dependencies")
    it("fails if required dependencies don't exist")
    it("resolves the correct number and location of sections")
    it("resolves the correct output directory")
    it("resolves the name of the lesson")
    it("resolves the description of the lesson")
  })
  describe("section construction", function() {
    var descriptor = openBlocks.processSectionDescriptionElement(pictureWithTextExample)
    it("resolves the name of the section", function() {
      expect(descriptor.sectionName).to.equal("Discovering Van Gogh");
    })
    it("resolves the dependencies of the section", function() {
      expect(descriptor.dependencies).to.be.an("array")
      expect(descriptor.dependencies).to.have.lengthOf(5)
        .and.to.contain({
          "type": "css",
          "location": "css/base.css",
          "destination": "css/base"
        })
        .and.to.contain({
          "type": "img",
          "location": "img/VanGogh-starry_night.jpg",
          "destination": "img/VanGogh-starry_night"
        })
        .and.to.contain({
          "type": "javascript",
          "location": "js/jquery.loupe.min.js",
          "destination": "javascript/jquery.loupe.min"
        })
    })
    it("successfully writes to the output directory")
  })

  describe("template resolution", function() {
    describe("audio-with-transcript built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(audioWithTranscriptExample.templateName))
          .to.equal("template/audio-with-transcript.pug")
      })
      it("creates the html", function() {
        expect(openBlocks.processSectionDescriptionElement(audioWithTranscriptExample))
          .to.have.property("html")
          .and.to.be.ok
      })
    })
    describe("picture-with-text built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(pictureWithTextExample.templateName))
          .to.equal("template/picture-with-text.pug")
        expect(openBlocks.processSectionDescriptionElement(pictureWithTextExample))
          .to.have.property("html")
          .and.to.be.ok
      })
      it("creates the html", function() {})
    })
    describe.skip("quiz built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(quizExample.templateName))
          .to.equal("template/quiz.pug")
        expect(openBlocks.processSectionDescriptionElement(quizExample))
          .to.have.property("html")
          .and.to.be.ok
      })
      it("creates the html", function() {})
    })
    describe("text built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(textExample.templateName))
          .to.equal("template/text.pug")
        expect(openBlocks.processSectionDescriptionElement(textExample))
          .to.have.property("html")
          .and.to.be.ok
      })
      it("creates the html", function() {})
    })
  })

});
