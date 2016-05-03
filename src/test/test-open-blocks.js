var test = require("unit.js"),
openBlocks = require("../open-blocks.js")

describe("open-blocks", function(){
  var openBlocks = require("open-blocks")
  test
      .function(openBlocks)
        .hasName('open-blocks')
      .object(myModule())
        .isInstanceOf(openBlocks)
});
