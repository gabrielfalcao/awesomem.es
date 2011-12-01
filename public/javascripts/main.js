$(function(){
    var socket = io.connect();
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
    $("#chat-form").submit(function(event){
        var $self = $(this);
        var splitted = $("#msg").val().split(/\s*[;]\s*/);
        var bg = $('#background-images a.active:first').attr('rel');
        socket.emit("new-message", {
            top_text: splitted[0],
            bottom_text: splitted[1],
        });
        return false;
    });
});