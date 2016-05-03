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
      name: "template/css/main.css"
    }, {
      type: "text/javascript",
      name: "template/js/main.js"
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
    var ret = processSectionDescriptionNode(sourceDirectoryName, outputDirectoryName, section)
      //console.log(ret.dependencies)
    return ret
  }

  function processSectionDescriptionNode(sourceDirectoryName, outputDirectoryName, section) {
    var templateName = section.templateName
    var templateFilename,
      templateDependencies = []
    var locals = {}
    switch (templateName) {
      case 'text':
        templateFilename = 'template/text.pug'
        templateDependencies = [{
          type: "css",
          location: "css/base.css"
        }, {
          type: "javascript",
          location: "js/base.js"
        }]
        break;
      case 'audio-with-transcript':
        templateFilename = 'template/audio-with-transcript.pug'
        templateDependencies = [{
          type: "css",
          location: "css/base.css"
        }, {
          type: "css",
          location: "css/voice.css"
        }, {
          type: "javascript",
          location: "js/audio-transcript.js"
        }]
        break;
      case 'picture-with-text':
        templateFilename = 'template/picture-with-text.pug'
        templateDependencies = [{
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
        break;
    }

    var variables = merge(section, locals)
    var blockDependencies = templateDependencies.concat(
      (section.dependencies || []).map(function(dep) {
        return merge(dep, {
          "blockDependency": true
        })
      })
    )

    var body = pug.renderFile(templateFilename, merge(section, {
      pretty: true
    }));

    var html = pug.renderFile("template/header.pug", merge(variables, {
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
    processLessonDescriptor: processLessonDescriptor
  }
}

//use as script
var args = process.argv.slice(2);

args.forEach(function(filename, index, array) {
  console.log(index + ': ' + filename);
  module.exports().processLessonDescriptor(filename)
});
