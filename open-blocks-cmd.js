var openBlocks = require("./open-blocks.js")

var args = process.argv.slice(2);

args.forEach(function(filename, index, array) {
  openBlocks.processLessonDescriptorFile(filename)
});
