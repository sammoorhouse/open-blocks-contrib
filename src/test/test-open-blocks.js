var test = require("unit.js"),
  openBlocks = require("../open-blocks.js"),
  expect = require("chai").expect;

describe("openblocks", function() {
  describe("lesson construction", function() {
    it("resolves the correct dependencies")
    it("fails if required dependencies don't exist")
    it("resolves the correct number and location of sections")
    it("resolves the correct output directory")
    it("resolves the name of the lesson")
    it("resolves the description of the lesson")
  })
  describe("section construction", function() {
    var section = {
      "templateName": "picture-with-text",
      "pageTitle": "Discovering Cezanne",
      "name": "Discovering-Cezanne",
      "dependencies": [{
        "type": "img",
        "location": "img/Card_Players-Paul_Cezanne.jpg"
      }],
      "imageTitle": "The Card Players",
      "imageSubtitle": "Paul Cezanne",
      "credit": {
        "uri": "https://en.wikipedia.org/wiki/The_Card_Players",
        "text": "Wikipedia"
      },
      "imageFile": {
        "name": "img/Card_Players-Paul_Cezanne.jpg",
        "type": "image/jpeg"
      },
      "commentary": [{
        "text": "The Card Players is a series of oil paintings by the French Post-Impressionist artist Paul Cézanne. Painted during Cézanne's final period in the early 1890s, there are five paintings in the series. The versions vary in size and in the number of players depicted. Cézanne also completed numerous drawings and studies in preparation for The Card Players series. One version of The Card Players was sold in 2011 to the Royal Family of Qatar for a price variously estimated at between $250 million and $300 million, making it the second most expensive work of art ever sold."
      }, {
        "text": "While there are, in total, five paintings of card players by Cézanne, the final three works were similar in composition and number of players (two), causing them to sometimes be grouped together as one version. The exact dates of the paintings are uncertain, but it is long believed Cézanne began with larger canvases and pared down in size with successive versions, though research in recent years has cast doubt on this assumption."
      }]
    }
    var descriptor = openBlocks.processSectionDescriptionElement("src", "out", section)
    it("resolves the name of the section", function() {
      expect(descriptor.sectionName).to.equal("Discovering Cezanne");
    })
    it("resolves the name of the output file", function() {
      expect(descriptor.filename).to.equal("out/Discovering-Cezanne.html");
    })
    it("resolves the dependencies of the section", function() {
      expect(descriptor.dependencies).to.be.an("array")
      expect(descriptor.dependencies).to.have.lengthOf(5)
        .and.to.contain({
          "type": "css",
          "location": "css/base.css"
        })
        .and.to.contain({
          "type": "img",
          "location": "img/Card_Players-Paul_Cezanne.jpg"
        })
    })
  })
  describe("template resolution", function() {
    it("determines the correct template for a section")
    describe("audio-with-transcript built-in template", function() {
      it("creates the body html")
      it("creates the wrapper html")
    })
    describe("picture-with-text built-in template", function() {
      it("creates the body html")
      it("creates the wrapper html")
    })
    describe("quiz built-in template", function() {
      it("creates the body html")
      it("creates the wrapper html")
    })
    describe("text built-in template", function() {
      it("creates the body html")
      it("creates the wrapper html")
    })
    it("successfully writes to the output directory")
  })
});
