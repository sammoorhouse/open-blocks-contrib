var fs = require('fs-extra'),
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

  function processLessonDescriptorFile(lessonDescriptorFilename) {
    console.log("Parsing input file: " + lessonDescriptorFilename)

    var lesson = JSON.parse(jsmin(readFile(lessonDescriptorFilename)));
    var lessonDescriptorFilenamePathElements = path.parse(lessonDescriptorFilename)
    var sourceDirectoryName = lessonDescriptorFilenamePathElements.dir
    var outputDirectoryName = getOutputDirectoryName(lessonDescriptorFilenamePathElements)
    ensureDirectory(outputDirectoryName)
    processLessonDescriptorElement(lesson, sourceDirectoryName, outputDirectoryName)
  }

  function getOutputDirectoryName(lessonDescriptorFilenamePathElements) {
    return path.join(lessonDescriptorFilenamePathElements.dir, lessonDescriptorFilenamePathElements.name)
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
      var descriptor = processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section)
      var fullOutputFilename = generateOutputFilename(outputDirectoryName, descriptor.filename, ".html")

      writeFile(fullOutputFilename, descriptor.html)

      descriptor.dependencies.forEach(function(dependency) {
        fs.copySync(dependency.resolvedSource, dependency.resolvedDestination);
      })
    })

    //generate main page

  }

  function processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section) {
    var descriptor
    if (typeof section["section-ref"] !== 'undefined') {
      descriptor = processSectionDescriptionFromFile(sourceDirectoryName, outputDirectoryName, section["section-ref"])
    } else {
      descriptor = processSectionDescriptionElement(section, outputDirectoryName, sourceDirectoryName)
    }

    return descriptor
  }

  function processSectionDescriptionFromFile(sourceDirectoryName, outputDirectoryName, sectionFilename) {
    var sectionSourceDirectoryName = path.parse(path.join(sourceDirectoryName, sectionFilename)).dir
    var section = JSON.parse(jsmin(readFile(path.join(sourceDirectoryName, sectionFilename), "utf8")));
    return processSectionDescriptionElement(section, outputDirectoryName, sectionSourceDirectoryName)
  }

  function resolveTemplateDependencies(templateName) {
    switch (templateName) {
      case 'text':
        return [{
          type: "css",
          location: "resources/css/base.css"
        }]
      case 'audio-with-transcript':
        return [{
          type: "css",
          location: "resources/css/base.css"
        }, {
          type: "css",
          location: "resources/css/voice.css"
        }, {
          type: "javascript",
          location: "resources/js/audio-transcript.js"
        }]
      case 'picture-with-text':
        return [{
          type: "css",
          location: "resources/css/base.css"
        }, {
          type: "css",
          location: "resources/css/picture-with-text.css"
        }, {
          type: "javascript",
          location: "resources/js/jquery.loupe.min.js"
        }, {
          type: "javascript",
          location: "resources/js/picture-with-text.js"
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

  function resolveDependencyPaths(dependencies, sourceDirectoryName, outputDirectoryName) {
    //move css,js, and media files to the correct place
    return dependencies.map(function(dep) {
      var type = dep.type
      var filename = path.parse(dep.location).base
      var resolvedDestination = path.resolve(path.join(outputDirectoryName, type, filename))
      var resolvedSource = path.resolve(path.join(sourceDirectoryName, dep.location))
      return merge(dep, {
        "resolvedDestination": resolvedDestination,
        "resolvedSource": resolvedSource
      })
    })
  }

  function processSectionDescriptionElement(sectionElement, outputDirectoryName, sectionSourceDirectoryName) {
    var sectionName = sectionElement.pageTitle
    var outputFilename = sectionElement.name
    var sectionDependencies = sectionElement.dependencies || []
    var sectionDependenciesWithPathsResolved = resolveDependencyPaths(sectionDependencies, sectionSourceDirectoryName, outputDirectoryName)

    var templateName = sectionElement.templateName
    var templateFilename = resolveTemplateFilename(templateName)
    var templateDependencies = resolveTemplateDependencies(templateName) || []
    var templateDependenciesWithPathsResolved = resolveDependencyPaths(templateDependencies, __dirname, outputDirectoryName)

    //we copy all dependencies to the appropriate output directory,
    //but only include js and css in the header
    var blockDependencies = templateDependenciesWithPathsResolved.concat(sectionDependenciesWithPathsResolved)

    var jsDependencies = blockDependencies.filter(function(dep) {
      return dep.type === "javascript"
    })
    var cssDependencies = blockDependencies.filter(function(dep) {
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
      "dependencies": blockDependencies,
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
    resolveDependencyPaths: resolveDependencyPaths,
    getOutputDirectoryName: getOutputDirectoryName
  }
}();
