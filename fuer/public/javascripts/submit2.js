$(document).ready(function () {
    $("#register-form").submit(function (e) {
        $("#submit-button").attr('disabled', true);
        e.preventDefault();
        var challengeField = $("input#recaptcha_challenge_field").val();
        var responseField = $("input#recaptcha_response_field").val();
        var canSubmit = true;
        var emailRegex = new RegExp(/^([\w-\s]+)(@fpt.edu.vn)$/i);
        //var regexStuId = new RegExp(/^(SE|SB|BA|FB|GC)?\d{5}$/i)
        var studentidField = document.getElementById("student-id");
        var emailField =    document.getElementById("email");
        var email =   emailField.value.trim().toLowerCase();
        var errorMessage = "";
        var studentId =   studentidField.value.trim().toUpperCase();
        if (studentId == "") {
            studentidField.className = 'input-validation-error';
            errorMessage += "<li>Hãy nhập mã sinh viên.</li>";
            canSubmit = false;
        }/* else if (!regexStuId.test(studentId)){
            studentidField.className = 'input-validation-error';
            errorMessage += "<li>Hãy nh?p ?úng ??nh d?ng MSSV c?a FU.</li>";
            canSubmit = false;

        }*/ else {
            studentidField.className = '';
        }
        if (email == "") {
            canSubmit = false;
            emailField.className = 'input-validation-error';
            errorMessage += "<li>Hãy nhập email của bạn.</li>";
        } else if (!emailRegex.test(email)) {
            canSubmit = false;
            emailField.className = 'input-validation-error';
            errorMessage += "<li>Hãy nhập mail fpt.edu.vn của bạn</li>";
        }  else if (email.toString().indexOf(studentId.toLowerCase()) == -1) {
            canSubmit = false;
            emailField.className = 'input-validation-error';
            errorMessage += "<li>Đây không phải mail fpt.edu.vn của bạn</li>";
        } else {
            emailField.className = '';
        }
        if (responseField.trim() == "")
        {
            canSubmit = false;
            errorMessage += "<li>Hãy nhập mã xác nhận</li>";
        }
        $("#error-message").html(errorMessage);
        if(canSubmit){
            var postingData = $.post('/'
                                    ,{
                                        form :
                                                {
                                                    studentid: studentId,
                                                    email: email,
                                                    recaptcha_challenge_field:challengeField,
                                                    recaptcha_response_field :responseField
                                                }
                                     }
                                    , function( data ) {
                                            $( "#register-form").fadeOut('slow',function(){
                                                $("#register-form").html(data.html).fadeIn('slow');
                                            });
                                     });
        } else {
            $("#submit-button").attr('disabled', false);
        }

    });
});