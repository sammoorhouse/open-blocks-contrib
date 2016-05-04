var test = require("unit.js"),
  fs = require("fs-extra")
openBlocks = require("../open-blocks.js"),
  expect = require("chai").expect;

var audioWithTranscriptExample = require("./examples/audio-with-transcript.json")
var pictureWithTextExample = require("./examples/picture-with-text.json")
var textExample = require("./examples/text.json")
var sectionSourceDirectoryName = "fake-testing-src-directory"

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
    var descriptor = openBlocks.processSectionDescriptionElement(pictureWithTextExample, sectionSourceDirectoryName)
    it("resolves the name of the section", function() {
      expect(descriptor.sectionName).to.equal("Discovering Van Gogh");
    })
    it("resolves the dependencies of the section", function() {
      expect(descriptor.dependencies).to.be.an("array")
      expect(descriptor.dependencies).to.have.lengthOf(5)
        .and.to.contain({
          "type": "css",
          "location": "resources/css/base.css",
          "resolvedDestination": "/Users/samm/Documents/dev/open-blocks-contrib/css/base.css",
          "resolvedSource": "/Users/samm/Documents/dev/open-blocks-contrib/resources/css/base.css"
        })
        .and.to.contain({
          "type": "img",
          "location": "img/VanGogh-starry_night.jpg",
          "resolvedDestination": "/Users/samm/Documents/dev/open-blocks-contrib/img/VanGogh-starry_night.jpg",
          "resolvedSource": "/Users/samm/Documents/dev/open-blocks-contrib/fake-testing-src-directory/img/VanGogh-starry_night.jpg"
        })
        .and.to.contain({
          "type": "javascript",
          "location": "resources/js/jquery.loupe.min.js",
          "resolvedDestination": "/Users/samm/Documents/dev/open-blocks-contrib/javascript/jquery.loupe.min.js",
          "resolvedSource": "/Users/samm/Documents/dev/open-blocks-contrib/resources/js/jquery.loupe.min.js"
        })
    })
    it("successfully creates the output directory", function() {
      expect(fs.existsSync(directoryName)).to.be.true
    })
    it("successfully outputs to the output directory", function() {
      expect(fs.existsSync(directoryName)).to.be.true
    })
  })

  describe("template resolution", function() {
    describe("audio-with-transcript built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(audioWithTranscriptExample.templateName))
          .to.equal("template/audio-with-transcript.pug")
      })
      it("creates the html", function() {
        expect(openBlocks.processSectionDescriptionElement(audioWithTranscriptExample, sectionSourceDirectoryName))
          .to.have.property("html")
          .and.to.be.ok
      })
    })
    describe("picture-with-text built-in template", function() {
      it("determines the correct template for the section", function() {
        var name = openBlocks.resolveTemplateFilename(pictureWithTextExample.templateName)
        expect(name)
          .to.equal("template/picture-with-text.pug")
      })
      it("creates the html", function() {
        expect(openBlocks.processSectionDescriptionElement(pictureWithTextExample, sectionSourceDirectoryName))
          .to.have.property("html")
          .and.to.be.ok
      })
    })
    describe.skip("quiz built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(quizExample.templateName))
          .to.equal("template/quiz.pug")
      })
      it("creates the html", function() {
        expect(openBlocks.processSectionDescriptionElement(quizExample, sectionSourceDirectoryName))
          .to.have.property("html")
          .and.to.be.ok
      })
    })
    describe("text built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(textExample.templateName))
          .to.equal("template/text.pug")
        expect(openBlocks.processSectionDescriptionElement(textExample, sectionSourceDirectoryName))
          .to.have.property("html")
          .and.to.be.ok
      })
      it("creates the html", function() {})
    })
  })

});
