var test = require("unit.js"),
  fs = require("fs-extra"),
  path = require('path'),
  openBlocks = require("../open-blocks.js"),
  expect = require("chai").expect;

var audioWithTranscriptExample = require("./examples/audio-with-transcript.json")
var pictureWithTextExample = require("./examples/picture-with-text.json")
var textExample = require("./examples/text.json")
var sectionSourceDirectoryName = "fake-testing-source-directory"
var sectionOutputDirectoryName = "fake-testing-output-directory"

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
    var descriptor = openBlocks.processSectionDescriptionElement(pictureWithTextExample, sectionOutputDirectoryName, sectionSourceDirectoryName)
    it("resolves the name of the section", function() {
      expect(descriptor.sectionName).to.equal("Discovering Van Gogh");
    })
    it("resolves the dependencies of the section", function() {
      expect(descriptor.dependencies).to.be.an("array")
      console.log(descriptor.dependencies)
      expect(descriptor.dependencies).to.have.lengthOf(5)
        .and.to.contain({
          "type": "css",
          "location": "resources/css/base.css",
          "resolvedDestination": path.join(__dirname, "..", sectionOutputDirectoryName, "css/base.css"),
          "resolvedSource": path.join(__dirname, "..", "resources/css/base.css")
        })
        .and.to.contain({
          "type": "img",
          "location": "img/VanGogh-starry_night.jpg",
          "resolvedDestination": path.join(__dirname, "..", sectionOutputDirectoryName, "img/VanGogh-starry_night.jpg"),
          "resolvedSource": path.join(__dirname, "..", sectionSourceDirectoryName, "img/VanGogh-starry_night.jpg")
        })
        .and.to.contain({
          "type": "javascript",
          "location": "resources/js/jquery.loupe.min.js",
          "resolvedDestination": path.join(__dirname, "..", sectionOutputDirectoryName, "javascript/jquery.loupe.min.js"),
          "resolvedSource": path.join(__dirname, "..", "resources/js/jquery.loupe.min.js")
        })
    })
    it("successfully establishes the output directory name", function() {
      var currentDir = __dirname
      var fakeLessonName = "foo.json"
      var lessonFilePath = path.join(currentDir, fakeLessonName)
      expect(openBlocks.getOutputDirectoryName(path.parse(lessonFilePath))).to.equal(path.join(__dirname, "foo" ))
    })
  })

  describe("template resolution", function() {
    describe("audio-with-transcript built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(audioWithTranscriptExample.templateName))
          .to.equal("template/audio-with-transcript.pug")
      })
      it("creates the html", function() {
        expect(openBlocks.processSectionDescriptionElement(audioWithTranscriptExample, sectionOutputDirectoryName, sectionSourceDirectoryName))
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
        expect(openBlocks.processSectionDescriptionElement(pictureWithTextExample, sectionOutputDirectoryName, sectionSourceDirectoryName))
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
        expect(openBlocks.processSectionDescriptionElement(quizExample, sectionOutputDirectoryName, sectionSourceDirectoryName))
          .to.have.property("html")
          .and.to.be.ok
      })
    })
    describe("text built-in template", function() {
      it("determines the correct template for the section", function() {
        expect(openBlocks.resolveTemplateFilename(textExample.templateName))
          .to.equal("template/text.pug")
        expect(openBlocks.processSectionDescriptionElement(textExample, sectionOutputDirectoryName, sectionSourceDirectoryName))
          .to.have.property("html")
          .and.to.be.ok
      })
      it("creates the html", function() {})
    })
  })

});
