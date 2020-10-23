window.onload = function(){
$("form").submit(function(){
var query = "?note="+$("#note").val()+"&user_id="+$("#user_id").val()+"&film_id="+$("#film_id").val();
$.ajax({
    url: "/new_note"+query,
    type:"POST",
    success:function(res){
	if (res !== 'notok'){
$('.notes-du-film').append(`Note de ${res.username} : ${res.note}/5 - ${res.date}`);
	}
    }
});






return false;
});

};
