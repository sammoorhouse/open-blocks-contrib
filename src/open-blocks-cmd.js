var openBlocks = require("./open-blocks.js")

var args = process.argv.slice(2);

args.forEach(function(filename, index, array) {
  console.log(index + ': ' + filename);
  openBlocks.processLessonDescriptorFile(filename)
});
