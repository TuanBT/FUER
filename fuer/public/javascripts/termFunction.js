function show(id){
    $('.boxContent').hide();
    $('#contentList').hide();
    $('#contentList').fadeIn();
    $("#c"+id).fadeIn('slow');
    $(".boxTitle").css({background:"#B1E0EC"});
    $("#t"+id).css({background:"white"});
}
