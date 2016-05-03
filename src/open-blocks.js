var fs = require('fs'),
  path = require('path'),
  jsmin = require('njsmin').jsmin,
  pug = require('pug'),
  merge = require('deepmerge');

//expose as module
module.exports = function() {
  function processLessonDescriptorFile(filename) {
    console.log("Parsing input file: " + filename)
    var lesson = JSON.parse(jsmin(fs.readFileSync(filename, "utf8")));

    //create or open an output directory for the lesson
    var filenamePathElements = path.parse(filename)

    var sourceDirectoryName = filenamePathElements.dir
    var outputDirectoryName = path.join(filenamePathElements.dir, filenamePathElements.name)

    ensureOutputDirectory(outputDirectoryName)

    processLessonDescriptorElement(lesson, sourceDirectoryName, outputDirectoryName)
  }

  function ensureOutputDirectory(outputDirectoryName) {
    if (!fs.existsSync(outputDirectoryName)) {
      fs.mkdirSync(outputDirectoryName);
    }
  }

  function processLessonDescriptorElement(lessonElement, sourceDirectoryName, outputDirectoryName) {
    //keep a running log of which include files (css, js, media elements)
    //should be bundled with the lesson
    var includes = [{
      type: "text/css",
      location: "template/css/main.css"
    }, {
      type: "text/javascript",
      location: "template/js/main.js"
    }]

    //required elements
    var title = lessonElement["title"],
      culture = lessonElement["culture"],
      name = lessonElement["name"],
      timespan = lessonElement["timespan"],
      sections = lessonElement["sections"]

    //optional elements
    var description = lessonElement["description"] || "",
      teachingNotes = lessonElement["teaching-notes"] || "",
      instructorLed = lessonElement["instructor-led"] || false,
      lessonDependencies = lessonElement["lesson-dependencies"] || [],
      physicalDependencies = lessonElement["physical-dependencies"] || []

    var descriptors = sections.map(function(section) {
        return processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section)
      }) //curry?

      //generate main page

  }

  function processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section) {
    var descriptor
    if (typeof section["section-ref"] !== 'undefined') {
      descriptor = processSectionDescriptionFromFile(sourceDirectoryName, outputDirectoryName, section["section-ref"])
    } else {
      descriptor = processSectionDescriptionNode(section, outputDirectoryName)
    }

    resolveDependencies(descriptor)
    return descriptor
  }

  function resolveDependencies(dependencies, outputDirectoryName) {
    //move css,js, and media files to the correct place

  }

  function processSectionDescriptionFromFile(sourceDirectoryName, outputDirectoryName, sectionFilename) {
    var section = JSON.parse(jsmin(fs.readFileSync(path.join(sourceDirectoryName, sectionFilename), "utf8")));
    return processSectionDescriptionElement(sourceDirectoryName, outputDirectoryName, section)
  }

  function resolveTemplateDependencies(templateName) {
    switch (templateName) {
      case 'text':
        return [{
          type: "css",
          location: "css/base.css"
        }, {
          type: "javascript",
          location: "js/base.js"
        }]
      case 'audio-with-transcript':
        return [{
          type: "css",
          location: "css/base.css"
        }, {
          type: "css",
          location: "css/voice.css"
        }, {
          type: "javascript",
          location: "js/audio-transcript.js"
        }]
      case 'picture-with-text':
        return [{
          type: "css",
          location: "css/base.css"
        }, {
          type: "css",
          location: "css/picture-with-text.css"
        }, {
          type: "javascript",
          location: "js/jquery.loupe.min.js"
        }, {
          type: "javascript",
          location: "js/picture-with-text.js"
        }]
    }
  }

  function resolveTemplateFilename(templateName) {
    switch (templateName) {
      case 'text':
        return 'template/text.pug'
      case 'audio-with-transcript':
        return 'template/audio-with-transcript.pug'
      case 'picture-with-text':
        return 'template/picture-with-text.pug'
    }
  }

  function processSectionDescriptionElement(sourceDirectoryName, outputDirectoryName, sectionElement) {
    var sectionName = sectionElement["page-title"]
    var outputFilename = sectionElement.name
    var sectionDependencies = sectionElement.dependencies || []

    var templateName = sectionElement.templateName
    var templateFilename = resolveTemplateFilename(templateName)
    var templateDependencies = resolveTemplateDependencies(templateName) || []

    var blockDependencies = templateDependencies.concat(sectionDependencies)

    var body = generatePageElement(pug.renderFile, templateFilename, merge(sectionElement, {
      pretty: true
    }))

    var html = generatePageElement(pug.renderFile, "template/header.pug", merge(sectionElement, {
      pretty: true,
      blockDependencies: blockDependencies,
      body: body
    }))

    //write out html
    var fullOutputFilename = generateOutputFilename(outputDirectoryName, outputFilename, ".html")
    writeFile(fs.writeFile, outputFilename, html)

    return {
      "filename": fullOutputFilename,
      "dependencies": blockDependencies,
      "sectionName" : sectionName
    }
  }

  function generateOutputFilename(outputDirectoryName, filename, extension) {
    return path.format({
      dir: outputDirectoryName,
      base: filename + extension
    })
  }

  function generatePageElement(generator, templateFilename, options) {
    return generator(templateFilename, options);
  }

  function writeFile(generator, outputFilename, content) {
    generator(outputFilename, content)
  }

  return {
    processLessonDescriptorFile: processLessonDescriptorFile,
    processLessonDescriptorElement: processLessonDescriptorElement,
    processSectionDescriptionElement: processSectionDescriptionElement
  }
}();
