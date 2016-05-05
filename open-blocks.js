var fs = require('fs-extra'),
  path = require('path'),
  jsmin = require('njsmin').jsmin,
  pug = require('pug'),
  merge = require('deepmerge'),
  winston = require('winston').cli();

//expose as module
module.exports = function() {

  var readFile = function(filename) {
    winston.debug("reading from file %s", filename)
    return fs.readFileSync(filename, "utf8")
  }

  var writeFile = function(outputFilename, content) {
    winston.debug("writing %d bytes to file %s", content.length, outputFilename)
    fs.writeFile(outputFilename, content)
  }

  var ensureDirectory = function(directoryName) {
    var emptyFolderRecursive = function(path) {
      fs.readdirSync(path).forEach(function(file, index) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          emptyFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    };

    if (fs.existsSync(directoryName)) {
      winston.info("Cleaning existing output directory: %s", directoryName)
      emptyFolderRecursive(directoryName)

    } else {
      winston.info("Creating new output directory: %s", directoryName)
      fs.mkdirSync(directoryName);
    }
  }


  function processLessonDescriptorFile(lessonDescriptorFilename) {
    winston.info("Parsing input file: " + lessonDescriptorFilename)

    var lesson = JSON.parse(jsmin(readFile(lessonDescriptorFilename)));
    winston.debug("lesson descriptor: %s", lesson)
    var lessonDescriptorFilenamePathElements = path.parse(lessonDescriptorFilename)
    var sourceDirectoryName = lessonDescriptorFilenamePathElements.dir
    winston.debug("resolved sourceDirectoryName: %s", sourceDirectoryName)
    var outputDirectoryName = getOutputDirectoryName(lessonDescriptorFilenamePathElements)
    winston.debug("resolved outputDirectoryName: %s", outputDirectoryName)
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
    winston.debug("resolved javascript dependencies: %s", jsDependencies)
    var cssDependencies = blockDependencies.filter(function(dep) {
      return dep.type === "css"
    })
    winston.debug("resolved css dependencies: %s", cssDependencies)

    winston.info("resolved total %d dependencies for section '%s'", blockDependencies.length, sectionDescriptor.sectionName)
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
    winston.info("resolved lesson title: '%s'", title)
    winston.info("resolved lesson culture: '%s'", culture)
    winston.info("resolved lesson name: '%s'", name)
    winston.info("resolved lesson timespan: '%s'", timespan)
    winston.info("resolved %d sections", sections.length)

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
      winston.info("writing section file: '%s'", sectionDescriptor.url)
      writeFile(sectionDescriptor.url, html)
    })

    //generate main page
    winston.info("done.")
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
    var templateDependencies = []
    switch (templateName) {
      case 'text':
        templateDependencies = []
        break
      case 'audio-with-transcript':
        templateDependencies = [{
          type: "css",
          location: "resources/css/voice.css"
        }, {
          type: "javascript",
          location: "resources/js/audio-transcript.js"
        }]
        break
      case 'picture-with-text':
        templateDependencies = [{
          type: "css",
          location: "resources/css/picture-with-text.css"
        }, {
          type: "javascript",
          location: "resources/js/jquery.loupe.min.js"
        }, {
          type: "javascript",
          location: "resources/js/picture-with-text.js"
        }]
        break
    }
    winston.info("resolved %d template dependencies for '%s'", templateDependencies.length, templateName)
    winston.debug("dependencies: %s", templateDependencies)
    return templateDependencies
  }

  function resolveTemplateFilename(templateName) {
    var templateFilename = ""
    switch (templateName) {
      case 'text':
        templateFilename = 'template/text.pug'
        break
      case 'audio-with-transcript':
        templateFilename = 'template/audio-with-transcript.pug'
        break
      case 'picture-with-text':
        templateFilename = 'template/picture-with-text.pug'
        break
    }
    winston.info("resolved template for '%s': '%s'", templateName, templateFilename)
    return templateFilename
  }

  function resolveDependencyPaths(dependency, sourceDirectoryName, outputDirectoryName) {
    winston.info("resolving dependency paths for '%s'", dependency.location)
      //move css,js, and media files to the correct place
    var type = dependency.type
    winston.debug("dependency type: %s", type)
    var filename = path.parse(dependency.location).base
    winston.debug("dependency filename: %s", filename)
    var resolvedDestination = path.resolve(path.join(outputDirectoryName, type, filename))
    winston.debug("dependency resolvedDestination: %s", resolvedDestination)
    var resolvedSource = path.resolve(path.join(sourceDirectoryName, dependency.location))
    winston.debug("dependency resolvedSource: %s", resolvedSource)
    return merge(dependency, {
      "resolvedDestination": resolvedDestination,
      "resolvedSource": resolvedSource,
      "filename": filename
    })
  }

  function processSectionDescriptionElement(sectionElement, outputDirectoryName, sectionSourceDirectoryName) {
    var sectionName = sectionElement.pageTitle
    winston.info("processing section element for '%s'", sectionName)

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
