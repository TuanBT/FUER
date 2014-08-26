$(document).ready(function () {

    var fuStatisticsRef = new Firebase('https://fuerdb.firebaseio.com/Admin/Statistics');
    fuStatisticsRef.once('value', function (snapshots) {
        var connect = snapshots.val()["Connect"];
        var connectCount = connect + 1;
        fuStatisticsRef.child('Connect').set(connectCount);
    });

    $("#register-form").submit(function (e) {
        $("#submit-button").attr('disabled', true);
        e.preventDefault();
        var challengeField = $("input#recaptcha_challenge_field").val();
        var responseField = $("input#recaptcha_response_field").val();
        var canSubmit = true;
        var emailRegex = new RegExp(/^([\w-\s]+)(@fpt.edu.vn)$/i);
        //var regexStuId = new RegExp(/^(SE|SB|BA|FB|GC)?\d{5}$/i)
        var studentidField = document.getElementById("student-id");
        var emailField = document.getElementById("email");
        var email = emailField.value.trim().toLowerCase();
        var errorMessage = "";
        var studentId = studentidField.value.trim().toUpperCase();
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
            errorMessage += "<li>Phải là email @fpt.edu.vn</li>";
        } else if (email.toString().indexOf(studentId.toLowerCase()) < 2) {
            canSubmit = false;
            emailField.className = 'input-validation-error';
            errorMessage += "<li>Email sai MSSV hoặc thiếu tên</li>";
        } else {
            emailField.className = '';
        }
        if (responseField.trim() == "") {
            canSubmit = false;
            errorMessage += "<li>Hãy nhập mã xác nhận</li>";
        }
        $("#error-message").html(errorMessage);
        if (canSubmit) {
            $('#regImg').fadeIn();
            var postingData = $.post('/'
                , {
                    form: {
                        studentid: studentId,
                        email: email,
                        recaptcha_challenge_field: challengeField,
                        recaptcha_response_field: responseField
                    }
                }
                , function (data) {
                    $("#register-container").fadeOut('slow', function () {
                        $("#register-container").html(data.html).fadeIn('slow');
                    });
                });
        } else {
            $("#submit-button").attr('disabled', false);
        }

    });

    $('#loginContainer').submit(function (e) {
        $('#liImg').show();
        $('#liSttData').html("");
        var name = $('#liName').val().toLowerCase();
        var password = $('#liPass').val();
        $.post('/login', {
            form: {
                name: name,
                passwords: password
            }
        }, function (data) {
            if (data.success == false) {
                $('#liSttData').html(data.value);
                $('#liPass').val("");
            } else {
                $('#loginContainer').html("<div id='liStt'>" + data.value + "</div>");
            }
            $('#liImg').hide();
        });
    })
});

function loginForm() {
    if ($('#loginContainer').is(":visible")) {
        $('#loginContainer').hide();
        $('#register-container').fadeIn();
    } else {
        $('#loginContainer').fadeIn();
        $('#liName').val("");
        $('#liPass').val("");
        $('#liSttData').html("");
        $('#register-container').hide();
    }
}

var app = angular.module('app', ['ngAnimate']);

function studentController($scope, $rootScope, $http, $timeout) {

    var fuinfoRef = new Firebase('https://fuerdb.firebaseio.com/FUInfo/Students');
    var fuinfoSnap;
    fuinfoRef.once('value', function (fuinfoSnaps) {
        fuinfoSnap = fuinfoSnaps;
        $('#searchDiv').hide();
        $('#searchInput').fadeIn();
        $('#loadingImg').fadeOut();
        $('#register-form').fadeIn();
    });

    //Trả về mảng các sinh viên phù hợp yêu cầu
    function getStudents(str) {
        var students = new Array();
        str = locDau(str);
        if (str != "") {
            try {
                var searchArea = fuinfoSnap.val();
                var searchAtt = ["MSSV", "Name", "Class"];
                for (var i = 0; i < searchArea.length; i++) {
                    for (var j = 0; j < searchAtt.length; j++) {
                        if (locDau(searchArea[i][searchAtt[j]].toLowerCase()).indexOf(str) > -1) {
                            students.push(searchArea[i]);
                            break;
                        }
                    }
                }

            } catch (e) {
                console.debug("No data - (TuânBT - Trang chưa load xong firebase)");
                //$("#searchInput").val("");
            }
        }
        return students;
    }

    //Number of result want to show
    var numList = 4;
    $scope.students = [];
    $scope.list = [];
    var index = 0;
    var arrAnimation = ["toggle", "spin-toggle", "scale-fade", "scale-fade-in", "bouncy-scale-in", "flip-in", "slide-left",
        "slide-right", "slide-top", "slide-down", "bouncy-slide-left", "bouncy-slide-right", "bouncy-slide-top", "bouncy-slide-down", "rotate-in"];
    //$scope.animation = arrAnimation[Math.floor(Math.random() * arrAnimation.length)];
    $scope.isShow = true;

    //Sự kiện thay đổi giá trị
    $scope.change = function () {
        $scope.animation = arrAnimation[Math.floor(Math.random() * arrAnimation.length)];
        $scope.students = getStudents($("#searchInput").val());
        index = 0;
        $scope.list = [];

        var loop = 0;
        if ($scope.students.length < numList) {
            loop = $scope.students.length;
        } else {
            loop = numList;
        }
        for (var j = 0; j < loop; j++) {
            $timeout(function () {
                if (index < loop) {
                    $scope.list.push($scope.students[index]);
                }
                index++;
            }, 100 * j);
        }
    };

    $scope.cleanList = function () {
        for (var i = 0; i < $scope.list.length; i++) {
            $timeout(function () {
                $scope.list.pop();
            }, 30 * i);
        }
    }

    $scope.toggle = function () {
        $scope.isShow = !$scope.isShow;
    }

    /**
     * Hiển thị sinh viên có lịch thi
     */
    $scope.displayExam = function (student) {
        //localStorage.setItem('gbStrSearch', student.MSSV);
        //window.open("/search?" + student.MSSV);
        window.location.href = "/search?" + student.MSSV;
    }

    /**
     * Xử lý sự kiện gõ chữ cho ô text
     */
    $("#searchInput").keydown(function (e) {
        //ENTER
        if (e.keyCode == 13) {
            //alert(e.keyCode);
        }
        //ESC
        if (e.keyCode == 27) {
            for (var i = 0; i < $scope.list.length; i++) {
                $timeout(function () {
                    $scope.list.pop();
                }, 30 * i);
            }
            ;
            $("#searchInput").val("");
        }
    });
}


var RecaptchaOptions = {
    theme: 'clean'
};


function toggleActive(div, position) {
    if (position == 0) {
        div.className = "active-color left-active-color";
        var logoContainer = document.getElementById("logo-inner");
        logoContainer.className = "left-active-color";
        var logo = document.getElementById("svg-icon");
        logo.className = "svg-active";
    }
    else {
        div.className = "active-color right-active-color";
        var logoContainer = document.getElementById("logo-inner");
        logoContainer.className = "right-active-color";
        var logo = document.getElementById("svg-icon");
        logo.className = "svg-active";
    }
}
function toggleInactive(div) {
    div.className = "inactive-color";
    //var logoContainer = document.getElementById("logo-inner");
    //logoContainer.className = "inactive-logo";
}

function facebookClick() {
    if ($('#facebookComment').css("display") != "none") {
        $('#facebookComment').fadeOut();
    }
    else {
        $('#facebookComment').fadeIn();
        $("html, body").animate({ scrollTop: $(document).height() });
    }
};


/**
 *    Hàm loại bỏ dấu tiếng Việt
 */
function locDau(str) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    //Các ký tự khác thì chuyển thành -
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|\$|_/g, "-");
    //thay thế 2- thành 1-
    str = str.replace(/-+-/g, "-");
    //cắt bỏ ký tự - ở đầu và cuối chuỗi
    str = str.replace(/^\-+|\-+$/g, "");
    //Các ký tự - ở giữa thì chuyển thành " "
    str = str.replace(/-/g, " ");
    return str;
}