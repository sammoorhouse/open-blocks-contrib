var fs = require('fs'),
  path = require('path'),
  jsmin = require('njsmin').jsmin,
  pug = require('pug'),
  merge = require('deepmerge');

//expose as module
module.exports = function() {

  var readFile = function(filename) {
    return fs.readFileSync(filename, "utf8")
  }

  var writeFile = function(outputFilename, content) {
    fs.writeFile(outputFilename, content)
  }

  var ensureDirectory = function(directoryName) {
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
    }
  }

  function processLessonDescriptorFile(filename) {
    console.log("Parsing input file: " + filename)
    var lesson = JSON.parse(jsmin(readFile(filename)));

    //create or open an output directory for the lesson
    var filenamePathElements = path.parse(filename)

    var sourceDirectoryName = filenamePathElements.dir
    var outputDirectoryName = path.join(filenamePathElements.dir, filenamePathElements.name)

    ensureDirectory(outputDirectoryName)

    processLessonDescriptorElement(lesson, sourceDirectoryName, outputDirectoryName)
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
      descriptor = processSectionDescriptionFromFile(sourceDirectoryName, section["section-ref"])
    } else {
      descriptor = processSectionDescriptionElement(section)
    }

    //write out html
    var fullOutputFilename = generateOutputFilename(outputDirectoryName, descriptor.filename, ".html")

    writeFile(fullOutputFilename, descriptor.html)
    resolveDependencies(descriptor.dependencies, sourceDirectoryName, outputDirectoryName)
    return descriptor
  }

  function processSectionDescriptionFromFile(sourceDirectoryName, sectionFilename) {
    var section = JSON.parse(jsmin(readFile(path.join(sourceDirectoryName, sectionFilename), "utf8")));
    return processSectionDescriptionElement(section)
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

  function resolveDependencyDestinations(dependencies, sourceDirectoryName, outputDirectoryName) {
    //move css,js, and media files to the correct place
    return dependencies.map(function(dep) {
      var type = dep.type
      var filename = path.parse(dep.location).name
      var destinationName = path.join(type, filename)
      return merge(dep, {
        "destination": destinationName
      })
    })
  }

  function processSectionDescriptionElement(sectionElement) {
    var sectionName = sectionElement.pageTitle
    var outputFilename = sectionElement.name
    var sectionDependencies = sectionElement.dependencies || []

    var templateName = sectionElement.templateName
    var templateFilename = resolveTemplateFilename(templateName)
    var templateDependencies = resolveTemplateDependencies(templateName) || []

    //we copy all dependencies to the appropriate output directory,
    //but only include js and css in the header
    var blockDependencies = templateDependencies.concat(sectionDependencies)

    var blockDependenciesWithDestinations = resolveDependencyDestinations(blockDependencies)
    var jsDependencies = blockDependenciesWithDestinations.filter(function(dep) {
      return dep.type === "javascript"
    })
    var cssDependencies = blockDependenciesWithDestinations.filter(function(dep) {
      return dep.typ === "css"
    })

    var body = generatePageElement(pug.renderFile, templateFilename, merge(sectionElement, {
      pretty: true
    }))

    var html = generatePageElement(pug.renderFile, "template/header.pug", merge(sectionElement, {
      pretty: true,
      js: jsDependencies,
      css: cssDependencies,
      body: body
    }))

    return {
      "filename": outputFilename,
      "dependencies": blockDependenciesWithDestinations,
      "sectionName": sectionName,
      "html": html
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

  return {
    processLessonDescriptorFile: processLessonDescriptorFile,
    processLessonDescriptorElement: processLessonDescriptorElement,
    processSectionDescriptionElement: processSectionDescriptionElement,
    readFile: readFile,
    writeFile: writeFile,
    resolveTemplateFilename: resolveTemplateFilename,
    ensureDirectory: ensureDirectory,
    resolveDependencyDestinations: resolveDependencyDestinations
  }
}();
