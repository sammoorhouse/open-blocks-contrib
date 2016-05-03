var fs = require('fs'),
  path = require('path'),
  jsmin = require('njsmin').jsmin,
  pug = require('pug'),
  merge = require('deepmerge');

//expose as module
module.exports = function() {
  function processLessonDescriptor(filename) {
    console.log("Parsing input file: " + filename)
    var lesson = JSON.parse(jsmin(fs.readFileSync(filename, "utf8")));

    //create or open an output directory for the lesson
    var filenamePathElements = path.parse(filename)

    var sourceDirectoryName = filenamePathElements.dir
    var outputDirectoryName = path.join(filenamePathElements.dir, filenamePathElements.name)

    console.log("dir name: " + outputDirectoryName)
    if (!fs.existsSync(outputDirectoryName)) {
      fs.mkdirSync(outputDirectoryName);
    }

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
    var title = lesson.title,
      culture = lesson.culture,
      name = lesson.name,
      timespan = lesson.timespan,
      sections = lesson.sections

    //optional elements
    var description = lesson.description || "",
      teachingNotes = lesson["teaching-notes"] || "",
      instructorLed = lesson["instructor-led"] || false,
      lessonDependencies = lesson["lesson-dependencies"] || [],
      physicalDependencies = lesson["physical-dependencies"] || []

    var descriptors = sections.map(function(section) {
        return processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section)
      }) //curry?
  }

  function processSectionDescriptor(sourceDirectoryName, outputDirectoryName, section) {
    var descriptor
    if (typeof section["section-ref"] !== 'undefined') {
      descriptor = processSectionDescriptionFromFile(sourceDirectoryName, outputDirectoryName, section["section-ref"])
    } else {
      descriptor = processSectionDescriptionNode(section, outputDirectoryName)
    }

    var dependencies = descriptor.dependencies
  }

  function processSectionDescriptionFromFile(sourceDirectoryName, outputDirectoryName, sectionFilename) {
    var section = JSON.parse(jsmin(fs.readFileSync(path.join(sourceDirectoryName, sectionFilename), "utf8")));
    return processSectionDescriptionNode(sourceDirectoryName, outputDirectoryName, section)
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

  function processSectionDescriptionNode(sourceDirectoryName, outputDirectoryName, section) {
    var templateName = section.templateName
    var templateFilename = resolveTemplateFilename(templateName)
    var templateDependencies = resolveTemplateDependencies(templateName) || []

    var sectionDependencies = (section.dependencies || []).map(function(dep) {
      return merge(dep, {
        "blockDependency": true
      })
    })

    var blockDependencies = templateDependencies.concat(sectionDependencies)

    var body = pug.renderFile(templateFilename, merge(section, {
      pretty: true
    }));

    var html = pug.renderFile("template/header.pug", merge(section, {
      pretty: true,
      blockDependencies: blockDependencies,
      body: body
    }));

    //write out html
    var outputFilename = path.format({
      dir: outputDirectoryName,
      base: section.name + ".html"
    })

    fs.writeFile(outputFilename, html, function(err) {
      if (err) {
        console.log(err);
      }
    });

    return {
      "filename": outputFilename,
      "dependencies": blockDependencies
    }
  }

  return {
    processLessonDescriptor: processLessonDescriptor,
    processSectionDescriptionNode: processSectionDescriptionNode
  }
}
