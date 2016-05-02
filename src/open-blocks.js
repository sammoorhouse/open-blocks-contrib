var fs = require('fs'),
  path = require('path'),
  jsmin = require('njsmin').jsmin,
  pug = require('pug');

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

  sections.map(function(section) {
      processSectionDescriptor(basePath, section)
    }) //curry?
}

function processSectionDescriptor(basePath, section) {
  if (typeof section["section-ref"] !== 'undefined') {
    processSectionDescriptionFromFile(basePath, section["section-ref"])
  } else {
    processSectionDescriptionNode(section)
  }
}

function processSectionDescriptionFromFile(basepath, sectionFilename) {
  // var section = JSON.parse(jsmin(fs.readFileSync(sectionFilename, "utf8")));
  var section = JSON.parse(fs.readFileSync(path.join(basepath, sectionFilename), "utf8"));
  processSectionDescriptionNode(basepath, section)
}

function processSectionDescriptionNode(basepath, section) {
  var templateName = section.templateName
  var templateFilename
  switch (templateName) {
    case 'text':
      templateFilename = 'template/text.pug'
      break;
    case 'audio-with-transcript':
      templateFilename = 'template/audio-with-transcript.pug'
      break;
    case 'picture-with-text':
      templateFilename = 'template/picture-with-text.pug'
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
      return console.log(err);
    }
  });

  var dependencies = section.dependencies
}
