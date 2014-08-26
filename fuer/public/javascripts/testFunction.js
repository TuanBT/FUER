function clicks(value) {
    var link = $('#txtLink').val();
    $.post('/getLink', {
        form: {
            value: link
        }
    }, function (data) {
        $("#data").html(data.success);
    });
}


