var fs = require('fs'),
  path = require('path'),
  jsmin = require('njsmin').jsmin,
  pug = require('pug'),
  merge = require('merge');

var args = process.argv.slice(2);

args.forEach(function(filename, index, array) {
  console.log(index + ': ' + filename);
  processLessonDescriptor(filename)
});

function processLessonDescriptor(filename) {
  console.log("Processing file " + filename)
    //create or open an output directory for the lesson
  var srcDir = '../src',
    outputDirectoryName = path.parse(filename).name,
    destinationDir = path.join(srcDir, outputDirectoryName)

  var basePath = path.dirname(filename)

  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir);
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

  console.log("Parsing input file: " + filename)
  var lesson = JSON.parse(jsmin(fs.readFileSync(filename, "utf8")));

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
      return processSectionDescriptor(basePath, section)
    }) //curry?

  descriptors.map(function(descriptor) {
    console.log(descriptor)
  })
}

function processSectionDescriptor(basePath, section) {
  if (typeof section["section-ref"] !== 'undefined') {
    return processSectionDescriptionFromFile(basePath, section["section-ref"])
  } else {
    return processSectionDescriptionNode(section)
  }
}

function processSectionDescriptionFromFile(basepath, sectionFilename) {
  var section = JSON.parse(jsmin(fs.readFileSync(path.join(basepath, sectionFilename), "utf8")));
  return processSectionDescriptionNode(basepath, section)
}

function processSectionDescriptionNode(basepath, section) {
  var templateName = section.templateName
  var templateFilename,
    dependencies = []
  switch (templateName) {
    case 'text':
      templateFilename = 'template/text.pug'
      dependencies = [{
        "css": "css/base.css"
      }, {
        "javascript": "js/base.js"
      }]
      break;
    case 'audio-with-transcript':
      templateFilename = 'template/audio-with-transcript.pug'
      dependencies = [{
        "css": "css/base.css"
      }, {
        "css": "css/voice.css"
      }, {
        "javascript": "js/audio-transcript.js"
      }]
      break;
    case 'picture-with-text':
      templateFilename = 'template/picture-with-text.pug'
      dependencies = [{
        "css": "css/base.css"
      }, {
        "css": "css/picture-with-text.css"
      }, {
        "javascript": "js/jquery.loupe.min.js"
      }, {
        "javascript": "js/picture-with-text.js"
      }]
      break;
  }
  var html = pug.renderFile(templateFilename, section)

  //write out html
  var outputFilename = path.format({
    dir: basepath,
    base: section.name + ".html"
  })

  fs.writeFile(outputFilename, html, function(err) {
    if (err) {
      console.log(err);
    }
  });

  return {
    "filename": outputFilename,
    "dependencies": dependencies.concat(section.dependencies || [])
  }
}
