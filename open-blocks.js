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

  function resolveHeadingSectionDetails(sections, currentSectionName) {
    return sections.map(function(sectionDescriptor) {
      return {
        "sectionTitle": sectionDescriptor.sectionName,
        "sectionUrl": sectionDescriptor.relativeUrl,
        "isCurrentSection": sectionDescriptor.sectionName === currentSectionName
      }
    })
  }

  function resolveTypedDepencies(sectionDescriptor, outputDirectoryName, hasTransitions) {
    var conditionalDependencies = hasTransitions ? [{
      type: "css",
      location: "resources/css/section-transitions.css"
    }, {
      type: "javascript",
      location: "resources/js/jquery.smoothState.min.js"
    }, {
      type: "javascript",
      location: "resources/js/smoothState-init.js"
    }] : []
    var globalDependencies = [{
        type: "css",
        location: "resources/css/base.css"
      }, {
        type: "javascript",
        location: "resources/js/jquery/2.2.2/jquery.min.js"
      }, {
        type: "img",
        location: "resources/img/crumbs.gif"
      }]
      .concat(conditionalDependencies)
      .map(function(dependency) {
        return resolveDependencyPaths(dependency, __dirname, outputDirectoryName)
      })

    var blockDependencies = globalDependencies
      .concat(sectionDescriptor.dependencies)

    var jsDependencies = blockDependencies.filter(function(dep) {
      return dep.type === "javascript"
    })
    var cssDependencies = blockDependencies.filter(function(dep) {
      return dep.type === "css"
    })

    return merge(sectionDescriptor, {
      "jsDependencies": jsDependencies,
      "cssDependencies": cssDependencies,
      "allDependencies": blockDependencies
    })
  }

  function processLessonDescriptorElement(lessonElement, sourceDirectoryName, outputDirectoryName) {
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
      physicalDependencies = lessonElement["physical-dependencies"] || [],
      hasTransitions = lessonElement["has-transitions"] || false

    var sectionDescriptors = sections.map(function(section) {
      var sectionDescriptor = processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section)
      var filename = sectionDescriptor.filename + ".html"
      var augmentedDescriptor = merge(
        resolveTypedDepencies(sectionDescriptor, outputDirectoryName, hasTransitions), {
          "url": generateOutputFilename(outputDirectoryName, filename),
          "relativeUrl": filename
        })

      augmentedDescriptor.allDependencies.forEach(function(dependency) {
        fs.copySync(dependency.resolvedSource, dependency.resolvedDestination);
      })
      return augmentedDescriptor
    })

    //render page element
    sectionDescriptors.map(function(sectionDescriptor) {
      //generate header
      var headingSectionDetails = resolveHeadingSectionDetails(sectionDescriptors, sectionDescriptor.sectionName)
      var html = generatePageElement(pug.renderFile, "template/header.pug", {
        pretty: true,
        lessonTitle: title,
        js: sectionDescriptor.jsDependencies,
        css: sectionDescriptor.cssDependencies,
        body: sectionDescriptor.body,
        pageTitle: sectionDescriptor.sectionName,
        headingSectionDetails: headingSectionDetails,
        hasTransitions: hasTransitions
      })
      console.log(headingSectionDetails)
      writeFile(sectionDescriptor.url, html)
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
        return []
      case 'audio-with-transcript':
        return [{
          type: "css",
          location: "resources/css/voice.css"
        }, {
          type: "javascript",
          location: "resources/js/audio-transcript.js"
        }]
      case 'picture-with-text':
        return [{
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

  function resolveDependencyPaths(dependency, sourceDirectoryName, outputDirectoryName) {
    //move css,js, and media files to the correct place
    var type = dependency.type
    var filename = path.parse(dependency.location).base
    var resolvedDestination = path.resolve(path.join(outputDirectoryName, type, filename))
    var resolvedSource = path.resolve(path.join(sourceDirectoryName, dependency.location))
    return merge(dependency, {
      "resolvedDestination": resolvedDestination,
      "resolvedSource": resolvedSource,
      "filename": filename
    })
  }

  function processSectionDescriptionElement(sectionElement, outputDirectoryName, sectionSourceDirectoryName) {
    var sectionName = sectionElement.pageTitle
    var outputFilename = sectionElement.name
    var sectionDependencies = sectionElement.dependencies || []
    var sectionDependenciesWithPathsResolved = sectionDependencies
      .map(function(dependency) {
        return resolveDependencyPaths(dependency, sectionSourceDirectoryName, outputDirectoryName)
      })

    var templateName = sectionElement.templateName
    var templateFilename = resolveTemplateFilename(templateName)
    var templateDependencies = resolveTemplateDependencies(templateName) || []
    var templateDependenciesWithPathsResolved = templateDependencies
      .map(function(dependency) {
        return resolveDependencyPaths(dependency, __dirname, outputDirectoryName)
      })

    //we copy all dependencies to the appropriate output directory,
    //but only include js and css in the header
    var blockDependencies = templateDependenciesWithPathsResolved
      .concat(sectionDependenciesWithPathsResolved)

    var body = generatePageElement(pug.renderFile, templateFilename, merge(sectionElement, {
      pretty: true
    }))

    return {
      "filename": outputFilename,
      "dependencies": blockDependencies,
      "sectionName": sectionName,
      "body": body
    }
  }

  function generateOutputFilename(outputDirectoryName, filename) {
    return path.format({
      dir: outputDirectoryName,
      base: filename
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
