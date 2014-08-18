$(document).ready(function() {
    $('.toggle').each(function() {
        $(this).click(function(e) {
            e.preventDefault();
            parent = $(this).parent()
            $.get('/toggle/'+parent.attr('id'), {}, function(data) {
                $.getJSON("/list/all.json", {}, function(data) {
                    $.each(data, function(k, v) {
                        $('#img'+k).attr('src', v["image"])
                    })
                });
            });
        });
    });
});
(function infotextrefresh() {
    $.ajax({
        url: '/ajax/infoarea',
        success: function(data) {
            $('#infoarea').html(data);
        },
        complete: function() {
            setTimeout(infotextrefresh, 10000);
        }
    });
})();

(function imgrefresh() {
    $.getJSON("/list/all.json", {}, function(data) {
        $.each(data, function(k, v) {
            $('#img'+k).attr('src', v["image"])
        })
    });
    setTimeout(imgrefresh, 5000);
})();