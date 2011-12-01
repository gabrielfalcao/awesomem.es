String.prototype.chunkify = function(index) {
    var begin = 0, end = index;
    var result = [];

    while (result.length < (this.length / parseFloat(index))) {
        result.push(this.substring(begin, end).trim())
        begin = end;
        end = end + index;
    }
    return result;
}