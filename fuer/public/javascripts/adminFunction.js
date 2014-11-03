var fuExamWrittingRef = new Firebase('https://fuerdb.firebaseio.com/ExamWriting');
var fuExamSpeakingRef = new Firebase('https://fuerdb.firebaseio.com/ExamSpeaking');
var fuExamRef = new Firebase('https://fuerdb.firebaseio.com/Exams/Exams');
var fuinfoRef = new Firebase('https://fuerdb.firebaseio.com/FUInfo/Students');
var fuinfoSearchRef = new Firebase('https://fuerdb.firebaseio.com/FUInfo/Search');
var fuAdminRef = new Firebase('https://fuerdb.firebaseio.com/Admin');
var fuPositionRef = new Firebase('https://fuerdb.firebaseio.com/Positions');
var fuStatisticsRef = new Firebase('https://fuerdb.firebaseio.com/Admin/Statistics');
var fuLogsRef = new Firebase('https://fuerdb.firebaseio.com/Admin/Logs')
var fuExamWrittingSnap = null;
var fuExamSpeakingSnap = null;
var examWriting = null;
var examSpeaking = null;
var fuExamSnap = null;
var fuLogsSnap = null;
var adminWriting = null;
var adminSpeaking = null;
var fuPositionSnap = null;
var constPos = "S0"
var positionName = constPos;
var posIndex = 0;

fuPositionRef.once('value', function (snapshots) {
    snapshots.forEach(function (childSnap) {
        if (childSnap.name() == "0") {
            $('#position').append("<div id='" + constPos + "' onclick=showList('" + constPos + "') class='btn'>" + childSnap.name() + "</div>");
        } else {
            $('#position').append("<div id='" + childSnap.name() + "' onclick=showList('" + childSnap.name() + "') class='btn'>" + childSnap.name() + "</div>");
        }
    });
});

fuLogsRef.on('value', function (snapshots) {
    //fuLogsSnap = snapshots;
    $('#logsText').val(snapshots.val()["Console"]);
});

fuStatisticsRef.on('value', function (snapshots) {
    $('#connectCount').html(snapshots.val()["Connect"]);
    $('#mailCount').html(snapshots.val()["Mail"]);
});

fuPositionRef.on('value', function (snapshots) {
    fuPositionSnap = snapshots;
    showList(positionName);
    showPosSen(posIndex);
    resetView()
});

fuExamRef.on('value', function (fuExamSnap) {
    $('#listExamManager').html("");
    this.fuExamSnap = fuExamSnap;
    fuExamSnap.forEach(function (fuExamChildSnap) {
        var date = fuExamChildSnap.val()['Date'];
        var wStuNum = 0;
        var wStuSubject = 0;
        try {
            wStuNum = jsonPath(fuExamChildSnap.val()['ExamWriting'], '$..StudentId').length;
            wStuSubject = fuExamChildSnap.val()['ExamWriting']['ExamSubjects'].length;
        } catch (e) {
            wStuNum = 0;
            wStuSubject = 0;
        }
        var sStuNum = 0;
        var sStuSubject = 0;
        try {
            sStuNum = jsonPath(fuExamChildSnap.val()['ExamSpeaking'], '$..StudentId').length;
            sStuSubject = fuExamChildSnap.val()['ExamSpeaking']['ExamSubjects'].length;
        }
        catch (e) {
            sStuNum = 0;
            sStuSubject = 0
        }

        var div =
            "<div class='examDate'>" +
            "<span class='emDate'>" + date + "</span>" +
            "<span onclick=deleteExams('" + date + "')><svg xmlns='http://www.w3.org/2000/svg' enable-background='new 0 0 24 24' height='24px' id='Layer_1' version='1.1' viewBox='0 0 24 24' width='24px' xml:space='preserve'><path d='M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z'/></svg></span>" +
            "<div class='emDetail'>" +
            "<div class='emWri'>" +
            "<div class='emDeTitle'>Thi viết</div>" +
            "<div>Số môn: " + wStuSubject + "</div>" +
            "<div>Số sinh viên: " + wStuNum + "</div>" +
            "</div>" +
            "<div class='emSpe'>" +
            "<div class='emDeTitle'>Thi nói</div>" +
            "<div>Số môn: " + sStuSubject + "</div>" +
            "<div>Số sinh viên: " + sStuNum + "</div>" +
            "</div>" +
            "</div>" +
            "</div>";

        $('#listExamManager').append(div);
    });
});

//Add exam from xls
function addExam() {
    $('.aeLoading').show();
    $("#aeEqual").html("");
    var link = $('#aeTxt').val();
    $.post('/getLink', {
        form: {
            value: link
        }
    }, function (data) {
        $('.aeLoading').hide();
        $("#aeEqual").html(data.success).fadeIn();
    });
}

function deleteExams(dateExam) {
    fuExamSnap.forEach(function (fuExamChildSnap) {
        var date = fuExamChildSnap.val()['Date'];
        if (date == dateExam) {
            fuExamRef.child(fuExamChildSnap.name()).remove();
            return;
        }
    });
}

function resetStatistics(typeStatistics) {
    if (typeStatistics == "Connect") {
        fuStatisticsRef.child("Connect").set(0);
    }
    if (typeStatistics == "Mail") {
        fuStatisticsRef.child("Mail").set(0);
    }
}

function resetLogs() {
    fuLogsRef.child("Console").set("");
}

function resetView() {
    $('#position .btn').css({background: "#2c3e50"});
    //$('#position .btn').css({color: "#7f8c8d"});
    $('#posList .btn').css({background: "white"});
    $("#" + positionName + "").css({background: "#7f8c8d"});
    //$("#" + positionName + "").css({color: "#FFFFFF"});
    $("#" + posIndex + "").css({background: "#ecf0f1"});
}

function showList(positionName) {
    this.positionName = positionName
    if (positionName == constPos) {
        positionName = "0";
    }
    $('#posList').html("");
    for (var i = 0; i < fuPositionSnap.val()[positionName].length; i++) {
        $('#posList').append("<div id='" + i + "' onclick=showPosSen(" + i + ") class='btn'>" + i + "</div>");
    }
    showPosSen(0);
    //resetView()
}

function showPosSen(posIndex) {
    this.posIndex = posIndex;
    var positionName = this.positionName;
    if (positionName == constPos) {
        positionName = "0";
    }
    $('#readEditBox').html(fuPositionSnap.val()[positionName][posIndex]["Description"]);
    $('#readShareName').html(fuPositionSnap.val()[positionName][posIndex]["Share"]);
    //posIndex=0;
    resetView()
}

function addPos() {
    var positionName = this.positionName;
    if (positionName == constPos) {
        positionName = "0";
    }
    var objPos = new Array();
    var i;
    for (i = 0; i < fuPositionSnap.val()[positionName].length; i++) {
        var obj = {Description: fuPositionSnap.val()[positionName][i]["Description"], Share: fuPositionSnap.val()[positionName][i]["Share"]};
        objPos.push(obj);
    }
    //var num = i+1;
    var obj = {Description: positionName + " - " + i, Share: positionName};
    objPos.push(obj);
    fuPositionRef.child(positionName).set(objPos);
    posIndex = i;
    showPosSen(posIndex);
}

function updatePos() {
    //Sửa
    var positionName = this.positionName;
    if (positionName == constPos) {
        positionName = "0";
    }
    $('#addPosList').hide();
    $('#updatePosList').hide();
    $('#deletePosList').hide();
    $('#savePosList').show();

    $('#writeEditBox').val(fuPositionSnap.val()[positionName][posIndex]["Description"]);
    $('#writeShareName').val(fuPositionSnap.val()[positionName][posIndex]["Share"]);
    $('#readEditBox').hide();
    $('#writeEditBox').show();
    $('#readShareName').hide();
    $('#writeShareName').show();

    showPosSen(posIndex);
}

function deletePos() {
    var positionName = this.positionName;
    if (positionName == constPos) {
        positionName = "0";
    }
    var objPos = new Array();
    var i;
    for (i = 0; i < fuPositionSnap.val()[positionName].length; i++) {
        if (i != posIndex) {
            var obj = {Description: fuPositionSnap.val()[positionName][i]["Description"], Share: fuPositionSnap.val()[positionName][i]["Share"]};
            objPos.push(obj);
        }
    }
    if (posIndex > 0) {
        posIndex--;
    }
    var posIndexTemp = posIndex;
    fuPositionRef.child(positionName).set(objPos);
    posIndex = posIndexTemp;
    showPosSen(posIndex);
}

function savePos() {
    var positionName = this.positionName;
    if (positionName == constPos) {
        positionName = "0";
    }
    var posIndexTemp = posIndex;
    fuPositionRef.child(positionName + "/" + posIndex).set({Description: $('#writeEditBox').val(), Share: $('#writeShareName').val()});
    $('#writeEditBox').hide();
    $('#readEditBox').fadeIn();
    $('#writeShareName').hide();
    $('#readShareName').fadeIn();
    $('#savePosList').hide();
    $('#addPosList').show();
    $('#updatePosList').show();
    $('#deletePosList').show();
    posIndex = posIndexTemp;
    showPosSen(posIndex);

}


fuExamWrittingRef.on('value', function (examWritingSnap) {
    if (examWritingSnap.val() == null) {
        $('.infoFunction .write').hide();
        return;
    } else {
        $('.infoFunction .write').show();
    }
    fuExamWrittingSnap = examWritingSnap;
    examWriting = examWritingSnap.val();

    $('#WdateExam').html(examWriting["Date"]);
    $('#mailTrue').prop('checked', examWriting["IsSent"]);
    $('#infoTrue').prop('checked', examWriting["IsAdd"]);

});

fuExamSpeakingRef.on('value', function (examSpeakingSnap) {
    if (examSpeakingSnap.val() == null) {
        $('.infoFunction .speak').hide();
        return;
    } else {
        $('.infoFunction .speak').show();
    }
    fuExamSpeakingSnap = examSpeakingSnap;
    examSpeaking = examSpeakingSnap.val();

    $('#SdateExam').html(examSpeaking["Date"]);
    $('#mailFalse').prop('checked', examSpeaking["IsSent"]);
    $('#infoFalse').prop('checked', examSpeaking["IsAdd"]);

});

function changeStatus(type, isWriting) {
    if (type == "mail") {
        if (isWriting) {
            fuExamWrittingRef.child("IsSent").set(false);
        } else {
            fuExamSpeakingRef.child("IsSent").set(false);
        }
    }
    if (type == "infoExams") {
        if (isWriting) {
            fuExamWrittingRef.child("IsAdd").set(false);
        } else {
            fuExamSpeakingRef.child("IsAdd").set(false);
        }
    }
    if (type == "searchInfo") {
        if (isWriting) {
            var students = jsonPath(examWriting, "$..ExamDetails[?(@.StudentId)]");
            var studentInfo = [];
            for (var i = 0; i < students.length; i++) {
                studentInfo.push({ Class: students[i].StudentClass, Date: students[i].Birthdate, MSSV: students[i].StudentId, Name: students[i].StudentName });
            }
            fuinfoSearchRef.set("");
            fuinfoSearchRef.child(examWriting.Date.replaceAll('/','_')).set(studentInfo);
        }
    }
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