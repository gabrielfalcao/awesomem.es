$(function(){
    var socket = io.connect();
    $("#msg").popover({
        placement: "above",
        trigger: "manual",
        html: true,
        offset: 20
    }).keydown(function(e){
        if (e.keyCode >= 48) {
            $(this).popover("hide");
            $(".popover").remove();
        }
    });
    $('#background-images').jflow({
        itens: 9,
        mode: 'horizontal',
        prev: '.bg-navigation .previous',
        item: '#background-images ul li',
        next: '.bg-navigation .next'
    });
    $('#background-images li.bg-image > a').click(function(){
        $(this).parents('ul').find('li a.active').removeClass('active');
        $(this).addClass('active');
        return false;
    });
    $("#msg").keypress(function(event){
        if (event.keyCode === 13) {
            var $self = $(this);
            var raw_message = $("#msg").val();

            if (/^\s*$/.test(raw_message)) {
                $("#msg")
                    .attr("data-original-title", 'You should type a message')
                    .attr("data-content", "The rule is simple: use a text separated by <strong class='good'>only one</strong> semi-colon<p class='big'><strong>Example:</strong></p><pre>This on top;This on bottom</pre>")
                    .popover("show");

                event.preventDefault();
                return false;
            } else if (/^[^;]*$/.test(raw_message)) {
                $("#msg")
                    .attr("data-original-title", 'Missing the bottom text')
                    .attr("data-content",
                          "<p class='big good'>Your message should look like this:</p><pre>" + raw_message + ";and bottom text</pre>"
                         )
                    .popover("show");
                    event.preventDefault();
                return false;
            }
            var splitted = raw_message.split(/\s*[;]\s*/);
            var top_text = (splitted[0] || "").trim();
            var bottom_text = (splitted[1] || "").trim();

            if (top_text.length === 0) {
                var example_last = bottom_text.length > 0 ? bottom_text : "and another";

                $("#msg")
                    .attr("data-original-title", 'The top text is empty')
                    .attr("data-content",
                          "<p class='big good'>Your message should look like this:</p><pre>some text;" + example_last + "</pre>" +
                          "<p class='big bad'>Not like this:</p><pre>;" + example_last + "</pre>"
                         )
                    .popover("show");

                event.preventDefault();
                return false;
            }

            if (bottom_text.length === 0) {
                $("#msg")
                    .attr("data-original-title", 'The bottom text is empty')
                    .attr("data-content",
                          "<p class='big good'>Your message should look like this:</p><pre>" + top_text + ";some other text</pre>" +
                          "<p class='big bad'>Not like this:</p><pre>" + top_text + ";</pre>"
                         )
                    .popover("show");
                event.preventDefault();
                return false;
            }
            switch (splitted.length) {
                case 1:
                    $("#msg")
                        .attr("data-original-title", 'Missing the ";"')
                        .attr("data-content", "A <strong class='good'>semi-colon</strong> is what separates the top text from the bottom text. Make sure to add <strong>one</strong>, and <strong class='bad'>only</strong> one")
                        .popover("show");
                break;
                case 2:
                    /* everything is right, move on */
                    var bg = $('#background-images a.active:first').attr('rel');
                    socket.emit("new-message", {
                        top_text: splitted[0],
                        bottom_text: splitted[1],
                    });
                break;
                default:
                    var num = splitted.length - 1;
                    $("#msg")
                        .attr("data-original-title", 'Too many semi-colons')
                        .attr("data-content", "There should be <strong>ONLY</strong> one semi-colon, though you have used it <strong>"+num+"</strong> times below")
                        .popover("show");
                break;

            }
            event.preventDefault();
        }
    });
});