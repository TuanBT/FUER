$(document).ready(function () {

    var fuStatisticsRef = new Firebase('https://fuerdb.firebaseio.com/Admin/Statistics');
    fuStatisticsRef.once('value', function (snapshots) {
        var connect = snapshots.val()["Connect"];
        var connectCount = connect + 1;
        fuStatisticsRef.child('Connect').set(connectCount);
    });

    $("#register-form").submit(function (e) {
        //$("#submit-button").attr('disabled', true);
        e.preventDefault();
        var challengeField = $("input#recaptcha_challenge_field").val();
        var responseField = $("input#recaptcha_response_field").val();
        var canSubmit = true;
        var emailRegex = new RegExp(/^([\w-\s]+)(@fpt\.edu\.vn)$/i);
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
                    $('#regImg').hide();
                    if (data.success) {
                        $('#student-id').val("");
                        $('#email').val("");
                    }
                    $("#register-container").fadeOut('slow', function () {
                        $('#outputContainer').html(data.html).fadeIn('slow');
                        $('#returnBtn').show();
                    });
                    /* $("#register-container").fadeOut('slow', function () {
                     $("#register-container").html(data.html).fadeIn('slow');
                     });*/
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

function returnLoginFrom() {
    $('#outputContainer').hide();
    $('#returnBtn').hide();
    Recaptcha.reload();
    $('#register-container').fadeIn();

}

function loginForm() {
    $('#returnBtn').hide();
    $('#outputContainer').hide();
    Recaptcha.reload();
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
    var fuinfoSnap = null;
    var fuinfoSearchRef = new Firebase('https://fuerdb.firebaseio.com/FUInfo/Search');

    fuinfoSearchRef.once('value', function (fuinfoSearchSnap) {
        if (fuinfoSearchSnap.numChildren() > 0) {
            fuinfoSearchSnap.forEach(function (infoSearchSnap) {
                $('#typeSearchBox .left').html(infoSearchSnap.name().replaceAll('_', '/') + " - " + infoSearchSnap.numChildren());
                fuinfoSnap = infoSearchSnap;
            })
        }
        $('#searchDiv').hide();
        $('#searchInput').show();
        $('#loadingImg').fadeOut();
        $('#register-form').show();
    })

    function acceptSearch() {
        $('#searchDiv').hide();
        $('#searchInput').show();
        $('#loadingImg').fadeOut();
    }

    var fuinfoSnapsTemp = null;
    var fuinfoSearchSnapTemp = null;

    //function changeTypeSearch() {
    $scope.changeTypeSearch = function () {
        $scope.list = [];
        $("#searchInput").val("");
        $('#searchInput').hide();
        $('#loadingImg').show();
        $('#searchDiv').show();
        //true is max
        if ($('#typeSearch').prop('checked')) {
            if (fuinfoSnapsTemp == null) {
                fuinfoRef.once('value', function (fuinfoSnaps) {
                    fuinfoSnap = fuinfoSnaps;
                    $('#typeSearchBox .right').html("All - " + fuinfoSnaps.numChildren());
                    acceptSearch();
                })
            } else {
                fuinfoSnap = fuinfoSnapsTemp;
                acceptSearch();
            }
        }
        //false is min
        else {
            if (fuinfoSearchSnapTemp == null) {
                fuinfoSearchRef.once('value', function (fuinfoSearchSnap) {
                    if (fuinfoSearchSnap.numChildren() > 0) {
                        fuinfoSearchSnap.forEach(function (infoSearchSnap) {
                            fuinfoSnap = infoSearchSnap;
                            $('#typeSearchBox .left').html(infoSearchSnap.name().replaceAll('_', '/') + " - " + infoSearchSnap.numChildren());
                            acceptSearch();
                        })
                    }
                })
            } else {
                fuinfoSnap = fuinfoSearchSnapTemp
                acceptSearch();
            }
        }
    }

    var arrAnimation = ["toggle", "spin-toggle", "scale-fade", "scale-fade-in", "bouncy-scale-in", "flip-in", "slide-left",
        "slide-right", "slide-top", "slide-down", "bouncy-slide-left", "bouncy-slide-right", "bouncy-slide-top", "bouncy-slide-down", "rotate-in"];
    $scope.isShow = true;

    var odometer = document.getElementById("odometer");
    var smallCounter = document.getElementById("counter-small");
    var fuerRootRef = new Firebase('https://fuerdb.firebaseio.com/');
    var regRef = fuerRootRef.child('Registers');
    var countRef = fuerRootRef.child('RegisterCount');

    $scope.Registers = [];
    $scope.RegistersShow = [];

    countRef.on('value', function (snapshot) {
        var num = snapshot.child('Count').val();
        odometer.innerHTML = num;
        smallCounter.innerHTML = num;
        var regListQuery = regRef.limit(8);
        regListQuery.once('value', function (snapshot) {
            $scope.Registers = [];
            snapshot.forEach(function (snap) {
                $scope.Registers.push(snap.val());
            });
            $scope.RegistersShow = [];
            $scope.animation = arrAnimation[Math.floor(Math.random() * arrAnimation.length)];
            var index = 0;
            for (var i = 0; i < $scope.Registers.length; i++) {
                $timeout(function () {
                    $scope.RegistersShow.push($scope.Registers[index]);
                    index++;
                }, 100 * i);
            }
        });
    });

    //Trả về mảng các sinh viên phù hợp yêu cầu
    function getStudents(str) {
        var students = new Array();
        str = locDau(str);
        if (str != "") {
            try {
                /*fuinfoSnap.forEach(function (student) {
                 var searchAtt = ["MSSV", "Name", "Class"];
                 for (var j = 0; j < searchAtt.length; j++) {
                 if (locDau(student.val()[searchAtt[j]].toLowerCase()).indexOf(str) > -1) {
                 students.push(student.val());
                 break;
                 }
                 }
                 });*/
                var searchArea = fuinfoSnap.val();
                var searchAtt = ["MSSV", "Name", "Class"];
                for (var i = 0; i < searchArea.length; i++) {
                    for (var j = 0; j < searchAtt.length; j++) {
                        if (locDau(searchArea[i][searchAtt[j]].toString().toLowerCase()).indexOf(str) > -1) {
                            students.push(searchArea[i]);
                            students[students.length-1]["Class"]="Lớp "+students[students.length-1]["Class"];
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

    //Sự kiện thay đổi giá trị
    $scope.change = function () {
        $scope.animation = arrAnimation[Math.floor(Math.random() * arrAnimation.length)];
        $scope.students = getStudents($("#searchInput").val());
        index = 0;
       // $scope.cleanList();
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
    $scope.displayExam = function (studentId) {
        if(studentId==undefined) return;
        //localStorage.setItem('gbStrSearch', student.MSSV);
        //window.open("/search?" + student.MSSV);
        window.location.href = "/search?" + studentId;
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
        $('#typeSearchBox .slideThree').css({background: '#9b59b6'});
    }
    else {
        div.className = "active-color right-active-color";
        var logoContainer = document.getElementById("logo-inner");
        logoContainer.className = "right-active-color";
        var logo = document.getElementById("svg-icon");
        logo.className = "svg-active";
        $('#typeSearchBox .slideThree').className = "right-active-color";
        $('#typeSearchBox .slideThree').css({background: '#1abc9c'});
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

// Replaces all instances of the given substring.
String.prototype.replaceAll = function (strTarget, // The substring you want to replace
                                        strSubString // The string you want to replace in.
    ) {
    var strText = this;
    var intIndexOfMatch = strText.indexOf(strTarget);

    // Keep looping while an instance of the target string
    // still exists in the string.
    while (intIndexOfMatch != -1) {
        // Relace out the current instance.
        strText = strText.replace(strTarget, strSubString)

        // Get the index of any next matching substring.
        intIndexOfMatch = strText.indexOf(strTarget);
    }

    // Return the updated string with ALL the target strings
    // replaced out with the new substring.
    return( strText );
}