var should = require('should');
require("./extensions");

exports["test chunkify string on 26 characters"] = function(){
    var result = "Will now split exactly his expectations".chunkify(26);
    result.should.be.an.instanceof(Array);
    result.should.eql(["Will now split exactly his", "expectations"]);
}

