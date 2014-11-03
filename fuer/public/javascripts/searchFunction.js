var fuExamsRef = new Firebase('https://fuerdb.firebaseio.com/Exams');
var fuCounterRef = new Firebase('https://fuerdb.firebaseio.com/RegisterCount');
var fuPositionRef = new Firebase('https://fuerdb.firebaseio.com/Positions');
var fuRegisRef = new Firebase('https://fuerdb.firebaseio.com/Registers');
var fuLogsRef = new Firebase('https://fuerdb.firebaseio.com/Admin/Logs');
var snapshot;
var fuLogsSnap = null;
var o;
var objPosition;
var objStudentRegis;

var strSearch;

fuCounterRef.on('value', function (snapshots) {
    snapshot = snapshots;
    $('#counter-small').html(snapshot.val().Count.toString());
});

fuLogsRef.on('value', function (snapshots) {
    fuLogsSnap = snapshots;
});

fuPositionRef.once('value', function (snapshots) {
    snapshot = snapshots;
    objPosition = snapshot.val();
});

fuRegisRef.once('value', function (snapshots) {
    snapshot = snapshots;
    objStudentRegis = snapshot.val();
});

fuExamsRef.once('value', function (snapshots) {
    snapshot = snapshots;
    o = snapshot.val();
    var href = window.location.href;
    document.getElementById('searchText').value = href.split('?')[1];
    if (href.split('?')[1] == undefined) {
        document.getElementById('searchText').value = "";
    }
    $('#searchForm').fadeIn();
    searchClick();
});


window.onload = function () {
    //$('#searchText').val(localStorage.getItem('gbStrSearch'));
    loadLocalStorage();

};


var room = "";
var position = "";
var birthDate = "";
var studentClass = "";
var studentName = "";
var studentId = "";
var date = "";
var examTimes = "";
var time = "";
var examTypeStr = "";
var ranSentence = "";
var positionSentence = "";
var posShare = "";
var subjectName = "";

var examPositionStorage = "";

//Các biến giữ trạng thái
var arrayPosition = ["A6", "A4", "A2", "A1", "A3", "A5", "B6","B4", "B2", "B1","B3", "B5", "C6", "C4","C2", "C1", "C3","C5", "D6", "D4","D2", "D1", "D3","D5", "E6", "E4","E2", "E1", "E3","E5"];
//Biến ngày thi
var statusExamDate = "";
//Biến tên môn
var statusSubjectName = "";
//Biến viết nói
var statusWriting = true;
//Biến lưu MSSV tương ứng với vị trí
var objPosId = [];

function searchPosClick(pos) {
    for (var i = 0; i < objPosId.length; i++) {
        if (objPosId[i]["Position"] == pos) {
            $('#searchText').val(objPosId[i]["StudentId"]);
            $('#SearchBtn').click();
            break;
        }
    }
}

function searchNumClick(studentId) {
    $('#searchText').val(studentId);
    $('#SearchBtn').click();
}

function reset() {
    $('#errorSearch').fadeOut();
    $('#ListSubjectName').html("");
    $('.infoBody').fadeOut();
    $('.infoTitle').fadeOut();



    for (var i = 0; i < arrayPosition.length; i++) {
        $('#subId' + arrayPosition[i]).css("color", "yellow");
        $('#name' + arrayPosition[i]).css("color", "yellow");
        $('#subId' + arrayPosition[i]).html("-");
        $('#name' + arrayPosition[i]).html("");
    }
}

function showOn() {
    $('.infoBody').fadeIn('slow');
    $('.infoTitle').fadeIn('slow');
}

//Ấn search ra các ngày thi
function searchClick() {
    strSearch = $('#searchText').val().trim();
    if (strSearch == "") {
        $('#loadingImage').fadeOut();
        //$('#errorSearch').fadeIn();
        return;
    }
    $('#examDateShow').html("");
    reset();
    writeFireLogs("Search: " + strSearch);
    //localStorage.setItem('gbStrSearch', strSearch);
    var result = false;
    var examTemp = jsonPath(o, "$.Exams.*");

    var arrDate = {};
    for (var i = 0; i < examTemp.length; i++) {
        arrDate[i] = examTemp[i].Date;
    }

    for (var i = 0; i < examTemp.length; i++) {
        for (var j = i; j < examTemp.length - 1; j++) {
            var time1 = arrDate[j].split("/");
            var miliTime1 = new Date(time1[2], time1[1], time1[0]).getTime();
            var time2 = arrDate[j + 1].split("/");
            var miliTime2 = new Date(time2[2], time2[1], time2[0]).getTime();
            if (miliTime1 > miliTime2) {
                var arrDateTemp = arrDate[j];
                arrDate[j] = arrDate[j + 1];
                arrDate[j + 1] = arrDateTemp;
            }
        }
    }
    //sắp xếp theo thứ tự lại cho cái exams. Thứ tự từ nhỏ tới lớn

    var exams = [];
    for (var i = 0; i < examTemp.length; i++) {
        exams[i] = jsonPath(o, "$.Exams[?(@.Date=='" + arrDate[i] + "')]")[0];
    }

    var examShow = [];
    var indexCount = 0;
    for (var i = exams.length - 1; i >= 0; i--) {
        //Nếu exam có chưa id thì làm
        if (jsonPath(exams[i], "$..ExamDetails[?(@.StudentId=='" + strSearch + "')]") != false) {
            $('#examDateShow').append("<li class='dateExam' title='Ngày thi'><div onclick=showSubjectName('" + exams[i].Date + "')>" + exams[i].Date + "&nbsp;&nbsp;</div></li>");
            examShow[indexCount] = exams[i];
            indexCount++;
            result = true;
        }
    }
    if (result == false) {
        $('#examWritingInfo').fadeOut();
        $('#examSpeakingInfo').fadeOut();
        $('#loadingImage').fadeOut();
        $('#errorSearch').fadeIn();
        $('#body').css({opacity: "0.5"});
        return;
    }
    showSubjectName(examShow[0].Date);
    showResult(examShow[0].Date, subjectName, true);
    checkStudentExist(strSearch);
    statusExamDate = examShow[0].Date;
    statusSubjectName = subjectName;
    statusWriting = true;
}

//Ấn ngày thi ra các môn thi
function showSubjectName(examDate) {
    $('#ListSubjectName').html("");
    $('#examWritingInfo').fadeOut();
    $('#examSpeakingInfo').fadeOut();

    //var strSearch = $('#searchText').val().trim();
    var exam = jsonPath(o, "$.Exams[?(@.Date=='" + examDate + "')]")[0];

    var examWritting = jsonPath(exam, "$.ExamWriting");
    if (examWritting != false) {
        var arrayExamSubject = jsonPath(examWritting, "$..ExamSubjects.*");
        //showResult(examDate,arrayExamSubject[0].SubjectName.toString(),true)
        for (var i = 0; i < arrayExamSubject.length; i++) {
            //Nếu ExamDetail có tồn tại Id này thì thêm
            if (jsonPath(arrayExamSubject[i], "$.ExamDetails[?(@.StudentId=='" + strSearch + "')].StudentName").toString() != "false") {
                subjectName = arrayExamSubject[i].SubjectName.toString();
                $('#ListSubjectName').append("<button class='subject' title='Môn thi' type='button' onclick=showResult('" + examDate + "','" + subjectName + "',true) ><div style='height: 17px;float: left;'>" + subjectName + "</div><i class='icon-pencil' style='font-size: 16px'></i></button>");
            }
        }
        $('#wriTotNumSub').html(arrayExamSubject.length);
        $('#wriTotNumStu').html(jsonPath(examWritting, "$..StudentId").length);
        $('#examWritingInfo').fadeIn();
    }

    var examSpeaking = jsonPath(exam, "$.ExamSpeaking");
    if (examSpeaking != false) {
        var arrayExamSubject = jsonPath(examSpeaking, "$..ExamSubjects.*");
        //showResult(examDate,arrayExamSubject[0].SubjectName.toString(),true)
        for (var i = 0; i < arrayExamSubject.length; i++) {
            //Nếu ExamDetail có tồn tại Id này thì thêm
            if (jsonPath(arrayExamSubject[i], "$.ExamDetails[?(@.StudentId=='" + strSearch + "')].StudentName").toString() != "false") {
                subjectName = arrayExamSubject[i].SubjectName.toString();
                $('#ListSubjectName').append("<button class='subject' type='submit' onclick=showResult('" + examDate + "','" + subjectName + "',false) ><div style='height: 17px;float: left;'>" + subjectName + "</div><i class='icon-comment' style='font-size: 16px'></i></button>");
            }
        }
        $('#speTotNumSub').html(arrayExamSubject.length);
        $('#speTotNumStu').html(jsonPath(examSpeaking, "$..StudentId").length);
        $('#examSpeakingInfo').fadeIn();
    }
    showResult(examDate, subjectName, true);
    statusExamDate = examDate;
    statusWriting = true;
    loadStatusButton();
}

//Ấn môn thi ra chi tiết
function showResult(examDate, subjectName, isWritting) {
    try {
        //var strSearch = $('#searchText').val().trim();
        var exam = jsonPath(o, "$.Exams[?(@.Date=='" + examDate + "')]")[0];
        var examType;
        if (isWritting) {
            examType = jsonPath(exam, "$.ExamWriting")[0];
        } else {
            examType = jsonPath(exam, "$.ExamSpeaking")[0];
        }

        var examsubjectTemp = jsonPath(examType, "$..ExamSubjects[?(@.SubjectName=='" + subjectName + "')]");
        var examDetailTemp;
        var indexSubject = 0;
        //Sẽ có trường hợp 1 môn mà thi 2 phòng. Như kiểu thi nói chia làm 2
        for (var i = 0; i < examsubjectTemp.length; i++) {
            examDetailTemp = jsonPath(examsubjectTemp[i], "$.ExamDetails[?(@.StudentId=='" + strSearch + "')]")[0];
            if (examDetailTemp != undefined) {
                indexSubject = i;
                break;
            }
        }
        room = examDetailTemp.Room;
        position = examDetailTemp.Position;
        birthDate = examDetailTemp.Birthdate;
        studentClass = examDetailTemp.StudentClass;
        studentName = examDetailTemp.StudentName;
        studentId = examDetailTemp.StudentId;
        date = jsonPath(examType, "$..Date")[0];
        var examSubjectTemp = jsonPath(examType, "$..ExamSubjects[?(@.SubjectName=='" + subjectName + "')]")[indexSubject];
        examTimes = examSubjectTemp.ExamTimes;
        time = examSubjectTemp.Time;
        examTypeStr = isWritting == true ? "Writting" : "Speaking";
        var positionTemp = position;
        if (position >= 1 || position <= 20) positionTemp = 0;
        ranSentence = Math.floor(Math.random() * jsonPath(objPosition, "$." + positionTemp + "")[0].length);
        var posObj = jsonPath(objPosition, "$." + positionTemp + "")[0][ranSentence];
        positionSentence = posObj.Description;
        posShare = posObj.Share;

        if (examTimes == 1) {
            examTimes = "Midtem exam";
        } else if (examTimes == 2) {
            examTimes = "Final exam";
        } else if (examTimes == 3) {
            examTimes = "Retake exam";
        }

        date = formatTime(date);
        birthDate = formatTime(birthDate);

        $('.dates').html(date);
        $('.subjectName').html(subjectName);
        $('.studentName').html(studentName);
        $('.birthdate').html(birthDate);
        $('.studentId').html(studentId);
        $('.studentClass').html(studentClass);
        $('.time').html(time);
        $('.room').html(room);
        $('.position').html(position);
        $('.examTimes').html(examTimes);
        $('.examType').html(examTypeStr);
        $('.positionSentence').html(positionSentence);
        $('.posShare').html(posShare);

        objPosId = [];
        for (var i = 0; i < arrayPosition.length; i++) {
            $('#subId' + arrayPosition[i]).css("color", "yellow");
            $('#name' + arrayPosition[i]).css("color", "yellow");
            $('#subId' + arrayPosition[i]).html("-");
            $('#name' + arrayPosition[i]).html("");
        }

        examPositionStorage = "";
        //Nếu là lịch thi viết thì sẽ thêm dữ liệu vào bảng chỗ ngồi
        if (isWritting) {
            $('#posListNumber').hide();
            var arraySubjectName = jsonPath(examType, "$..ExamSubjects[?(@.Time=='" + time + "')]");
            for (var i = 0; i < arraySubjectName.length; i++) {
                var subName = arraySubjectName[i].SubjectName.toString();
                var arrayExamdetail = jsonPath(arraySubjectName[i], "$.ExamDetails[?(@.Room=='" + room + "')]");
                for (var j = 0; j < arrayExamdetail.length; j++) {
                    var positionTemp = arrayExamdetail[j].Position.toString();
                    if(positionTemp[1]=='3') positionTemp=positionTemp[0]+"5";
                    //Chính là người tìm
                    if (arrayExamdetail[j].StudentId.toString() == studentId) {
                        $('#subId' + positionTemp).css("color", "#c0392b");
                        $('#name' + positionTemp).css("color", "#c0392b");
                        examPositionStorage += "'" + positionTemp + "': {'SubjectName': '" + subName + "','StudentId': '" + arrayExamdetail[j].StudentId.toString() + "','StudentName': '" + arrayExamdetail[j].StudentName.toString() + "','TypePosition':'0'},";
                    }
                    //Thi cùng môn
                    else if (subName == subjectName) {
                        $('#subId' + positionTemp).css("color", "#2c3e50");
                        $('#name' + positionTemp).css("color", "#2c3e50");
                        examPositionStorage += "'" + positionTemp + "': {'SubjectName': '" + subName + "','StudentId': '" + arrayExamdetail[j].StudentId.toString() + "','StudentName': '" + arrayExamdetail[j].StudentName.toString() + "','TypePosition':'1'},";
                    }
                    //Thi cùng phòng
                    else {
                        $('#subId' + positionTemp).css("color", "#ecf0f1");
                        $('#name' + positionTemp).css("color", "#ecf0f1");
                        examPositionStorage += "'" + positionTemp + "': {'SubjectName': '" + subName + "','StudentId': '" + arrayExamdetail[j].StudentId.toString() + "','StudentName': '" + arrayExamdetail[j].StudentName.toString() + "','TypePosition':'-1'},";
                    }
                    $('#subId' + positionTemp).html(subName + " - " + arrayExamdetail[j].StudentId.toString());
                    $('#name' + positionTemp).html(arrayExamdetail[j].StudentName.toString());
                    objPosId.push({"StudentId": arrayExamdetail[j].StudentId.toString(), "Position": positionTemp});
                }
            }
            $('#positionPanel').show();
        }
        //Nếu là lịch thi nói thì sẽ thêm dữ liệu vào danh sách thi nói
        else {
            $('#positionPanel').hide();
            $('#listSpeaking').html("");
            var arraySubjectName = jsonPath(examType, "$..ExamSubjects[?(@.SubjectName=='" + subjectName + "')]");
            for (var i = 0; i < arraySubjectName.length; i++) {
                for (var j = 0; j < arraySubjectName[i].ExamDetails.length; j++) {
                    var detail = arraySubjectName[i].ExamDetails;
                    if (detail[j]["Room"] == room) {
                        if (detail[j]["StudentId"] == studentId) {
                            $('#listSpeaking').append("<li style='color: #ff0000' onclick=searchNumClick('" + detail[j]["StudentId"] + "')><div class='plnNumber'>" + detail[j]["Position"] + "</div><div class='plnId'>" + detail[j]["StudentId"] + "</div><div class='plnName'>" + detail[j]["StudentName"] + "</div></li>");
                            examPositionStorage += "'" + detail[j]["Position"] + "':{'StudentId':'" + detail[j]["StudentId"] + "','StudentName':'" + detail[j]["StudentName"] + "','TypePosition':'0'},";
                        } else {
                            $('#listSpeaking').append("<li onclick=searchNumClick('" + detail[j]["StudentId"] + "')><div class='plnNumber'>" + detail[j]["Position"] + "</div><div class='plnId'>" + detail[j]["StudentId"] + "</div><div class='plnName'>" + detail[j]["StudentName"] + "</div></li>");
                            examPositionStorage += "'" + detail[j]["Position"] + "':{'StudentId':'" + detail[j]["StudentId"] + "','StudentName':'" + detail[j]["StudentName"] + "','TypePosition':'1'},";
                        }
                    }
                }
            }
            $('#posListNumber').show();
        }

        statusSubjectName = subjectName;
        statusWriting = isWritting;
        var id = studentId + '_' + studentName.replaceAll(' ', '.') + '_' + subjectName + '_' + date.replaceAll('/', '.') + '_' + examTypeStr;
        checkMemoryExist(id);
        loadStatusButton();
        showOn();
    }
    catch (exception) {
        //console.writeln("TuanBT-Lỗi chỗ này đích thị là không load được cái database!");
    }
    finally {
        $('#loadingImage').fadeOut();
    }
}

function checkStudentExist(studentId) {
    if (jsonPath(objStudentRegis, "$." + studentId + "") == false) {
        $('#regId').html(studentId);
        $('#regisDialog').fadeIn();
        $('.dialog').fadeIn();
    }
}

function checkMemoryExist(id) {
    id = studentId + '_' + studentName.replaceAll(' ', '.') + '_' + subjectName + '_' + date.replaceAll('/', '.') + '_' + examTypeStr;
    if (localStorage.getItem(id) != null) {
        $('#memory').html("<i class='icon-star-light'></i>");
    } else {
        $('#memory').html("<i class='icon-star-dark'></i>");
    }
}

function saveMemory() {
    var id = studentId + '_' + studentName.replaceAll(' ', '.') + '_' + subjectName + '_' + date.replaceAll('/', '.') + '_' + examTypeStr;
    //Kiểm tra. Nếu id = localStorage => Xóa và dùng class dark. ngược lại với light
    if (localStorage.getItem(id) != null) {
        deleteMemory(id);
        $('#memory').html("<i class='icon-star-dark'></i>");
    } else {
        var value = "{" +
            "'ExamDetail': {" +
            "'Room': '" + room + "'," +
            "'Position': '" + position + "', " +
            "'BirthDate': '" + birthDate + "'," +
            "'StudentClass': '" + studentClass + "'," +
            "'StudentName': '" + studentName + "'," +
            "'StudentId': '" + studentId + "'," +
            "'Date': '" + date + "'," +
            "'ExamTimes': '" + examTimes + "'," +
            "'Time': '" + time + "'," +
            "'ExamTypeStr': '" + examTypeStr + "'," +
            "'PositionSentence': '" + positionSentence + "'," +
            "'PosShare': '" + posShare + "'," +
            "'SubjectName': '" + subjectName + "'" +
            "},'ExamPositon': {" + examPositionStorage.substr(0, examPositionStorage.length - 1) +
            "}}";
        saveToLocalStorage(id, value);
        $('#memory').html("<i class='icon-star-light'></i>");
    }
    loadLocalStorage();
}

function saveToLocalStorage(key, value) {
    if (typeof(localStorage) == 'undefined') {
        alert('Trình duyệt này không hỗ trợ HTML5. Vui lòng nâng cấp!');
    }
    else {
        try {
            localStorage.setItem(key, value);
        }
        catch (e) {
            alert("Lưu thất bại!");
            if (e == QUOTA_EXCEEDED_ERR) {
                alert('Hết dung lượng cho phép lưu trữ!'); //data wasn't successfully saved due to quota exceed so throw an error
            }
        }
    }
}

function fillData(id) {
    var valueLocalStorageRow = localStorage.getItem(id);
    var examDetail = eval('(' + valueLocalStorageRow + ')').ExamDetail;
    $('.dates').html(examDetail.Date.toString());
    $('.subjectName').html(examDetail.SubjectName.toString());
    $('.studentName').html(examDetail.StudentName.toString());
    $('.birthdate').html(examDetail.BirthDate.toString());
    $('.studentId').html(examDetail.StudentId.toString());
    $('.studentClass').html(examDetail.StudentClass.toString());
    $('.time').html(examDetail.Time.toString());
    $('.room').html(examDetail.Room.toString());
    $('.position').html(examDetail.Position.toString());
    $('.examTimes').html(examDetail.ExamTimes.toString());
    $('.examType').html(examDetail.ExamTypeStr.toString());
    $('.positionSentence').html(examDetail.PositionSentence.toString());
    $('.posShare').html(examDetail.PosShare.toString());

    studentId = examDetail.StudentId.toString();
    studentName = examDetail.StudentName.toString();
    subjectName = examDetail.SubjectName.toString();
    date = examDetail.Date.toString();
    examTypeStr = examDetail.ExamTypeStr.toString();

    var examPosition = eval('(' + valueLocalStorageRow + ')').ExamPositon;
    if (examTypeStr == "Writting") {
        $("#posListNumber").hide();
        $("#positionPanel").fadeIn();
        for (var i = 0; i < arrayPosition.length; i++) {
            $('#subId' + arrayPosition[i]).css("color", "yellow");
            $('#name' + arrayPosition[i]).css("color", "yellow");
            $('#subId' + arrayPosition[i]).html("-");
            $('#name' + arrayPosition[i]).html("");

            var examposPath = jsonPath(examPosition, "$.'" + arrayPosition[i] + "'");
            if (examposPath != false) {
                exampos = examposPath[0];
                var color = "";
                //Chính là người tìm
                if (exampos.TypePosition.toString() == "0") {
                    color = "#c0392b";
                }
                //Cùng môn
                else if (exampos.TypePosition.toString() == "1") {
                    color = "#2c3e50";
                }
                //Cùng phòng
                else {
                    color = "#ecf0f1";
                }
                $('#name' + arrayPosition[i]).css("color", color);
                $('#subId' + arrayPosition[i]).css("color", color);
                $('#subId' + arrayPosition[i]).html(exampos.SubjectName.toString() + " - " + exampos.StudentId.toString());
                $('#name' + arrayPosition[i]).html(exampos.StudentName.toString());
            }
        }
    } else {
        $('#listSpeaking').html("");
        $("#positionPanel").hide();
        $("#posListNumber").fadeIn();
        for (var i = 1; i < 21; i++) {
            if (examPosition[i] != undefined) {
                //Neu la nguoi thi
                if (examPosition[i]["TypePosition"] == 0) {
                    $('#listSpeaking').append("<li style='color: #ff0000' onclick=searchNumClick('" + examPosition[i]["StudentId"] + "')><div class='plnNumber'>" + i + "</div><div class='plnId'>" + examPosition[i]["StudentId"] + "</div><div class='plnName'>" + examPosition[i]["StudentName"] + "</div></li>");
                } else {
                    $('#listSpeaking').append("<li onclick=searchNumClick('" + examPosition[i]["StudentId"] + "')><div class='plnNumber'>" + i + "</div><div class='plnId'>" + examPosition[i]["StudentId"] + "</div><div class='plnName'>" + examPosition[i]["StudentName"] + "</div></li>");
                }
            }
        }
    }

    //Không cần chọn ngày
    $('.dateExam').removeAttr("style");
    //Bỏ hiện các môn thi
    $('#ListSubjectName').html("");
    //Hiện ro body
    $('#body').css({opacity: "1"});

    showOn();

    var id = studentId + '_' + studentName.replaceAll(' ', '.') + '_' + subjectName + '_' + date.replaceAll('/', '.') + '_' + examTypeStr;
    checkMemoryExist(id);
}

function deleteMemory(id) {
    try {
        //document.getElementById(id).remove();
        //Use all browser
        var div = document.getElementById(id);
        div.parentNode.removeChild(div);
    } catch (e) {

    }
    try {
        localStorage.removeItem(id);
    }
    catch (e) {
    }
    checkMemoryExist(id);
}

function loadLocalStorage() {
    $('#listStorage').html("");
    for (var i = 0; i < localStorage.length - 1; i++) {
        //var valueLocalStorageRow = localStorage.getItem(localStorage.key(i));
        var id = localStorage.key(i);
        var arrayInfo = id.split('_');
        if (arrayInfo.indexOf('Writting') > 0 || arrayInfo.indexOf('Speaking') > 0) {
            //Kiểm tra nếu là dạng SB60441_Nguyễn.Thị.Minh.Trang_MR_08.11.2014_Writting
            var mStudentName = arrayInfo[1].replaceAll('.', ' ');
            var mSubjectName = arrayInfo[2];
            var mDate = arrayInfo[3].replaceAll('.', '/');
            var mExamTypeStr = arrayInfo[4]
            var quote = String.fromCharCode(39);
            document.getElementById('listStorage').innerHTML = '<div class="itemStorage" id="' + id + '"><a title="Xóa ghi nhớ"><div class="verticalLine" onclick="deleteMemory(' + quote + id + quote + ')"><div class="delete"><img width="10px" height="10px" title="Xóa ghi nhớ" src="../images/imgSearch/x.svg"/></div></div></a><a title="Xem lịch thi" onclick="fillData(' + quote + id + quote + ')"><div class="nameStorage"><span>' + mStudentName + '</span></div><div class="subjectDate"><span>' + mSubjectName + ' - ' + mDate + '</span></div><div class="examTypeStorage"><span>' + mExamTypeStr + '</span></div></a></div>'
                + document.getElementById('listStorage').innerHTML;
        }
    }
}

function loadStatusButton() {
    $('.subject').removeAttr("style");
    var subjectElements = document.getElementsByClassName('subject');
    for (var i = 0; i < subjectElements.length; i++) {
        if ($('.subject')[i].innerText == statusSubjectName) {
            if ($('.subject')[i].childNodes[1].outerHTML.indexOf('icon-pencil') > 0 && statusWriting == true) {
                subjectElements[i].style.background = "#d35400";
            }
            if ($('.subject')[i].childNodes[1].outerHTML.indexOf('icon-comment') > 0 && statusWriting == false) {
                subjectElements[i].style.background = "#d35400";
            }
        }

    }

    $('.dateExam').removeAttr("style");
    var examDateLinkElements = document.getElementsByClassName('dateExam');
    for (var i = 0; i < examDateLinkElements.length; i++) {
        if ($('.dateExam')[i].firstChild.innerText.trim() == statusExamDate) {
            examDateLinkElements[i].style.background = "#f6f6f6";
            examDateLinkElements[i].style.fontSize = "30px";
        }
    }
}


$(document).ready(function () {
    // Open appropriate dialog when clicking on anything with class "dialog-open"
    $('.dialog-open').click(function () {
        $('#regisDialog').fadeIn();
        $('.dialog').fadeIn();
    });
    // Close dialog when clicking on the "ok-dialog"
    $('.CancelDialog').click(function () {
        $('#regisDialog').fadeOut();
        $('.dialog').fadeOut();
    });
    $('.OkDialog').click(function () {
        $('#regisDialog').fadeOut();
        $('.dialog').fadeOut();
        window.open("/");

    });
    $('#screen').click(function () {
        $('#regisDialog').fadeOut();
        $('.dialog').fadeOut();
    });
    // Require the user to click OK if the dialog is classed as "modal"
    $('#overlay').click(function () {
        $('#regisDialog').fadeOut();
        $('.dialog').fadeOut();
    });
    // Prevent dialog closure when clicking the body of the dialog (overrides closing on clicking overlay)
    $('.dialog').click(function () {
        event.stopPropagation();
    });
});

function writeFireLogs(logs) {
    var consoleLogs = fuLogsSnap.val()["Console"];
    var time = new Date().addHours(7);
    var month = time.getUTCMonth() + 1;
    var timeStr = ("0" + time.getUTCHours()).slice(-2) + ":" +
        ("0" + time.getUTCMinutes()).slice(-2) + ":" +
        ("0" + time.getUTCSeconds()).slice(-2) + " " +
        ("0" + time.getUTCDate()).slice(-2) + "/" +
        ("0" + month).slice(-2) + "/" +
        time.getUTCFullYear();
    fuLogsRef.child('Console').set("[" + timeStr + "] " + logs + "\n" + consoleLogs);
}

function formatTime(dates) {
    if (dates == "") {
        return "-";
    }
    return dates;
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

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}