/**
 * Created with JetBrains WebStorm.
 * User: Genik
 * Date: 7/24/13
 * Time: 3:11 PM
 * To change this template use File | Settings | File Templates.
 */
var firebase = require('firebase')
    , jsonPath = require('JSONPath')
    , mailer = require('../lib/mailer.js')
    , variable = require('../lib/variable.js')
    , root = new firebase("https://fuerdb.firebaseio.com/")
    , examWritingRef = new firebase("https://fuerdb.firebaseio.com/ExamWriting")
    , examSpeakingRef = new firebase("https://fuerdb.firebaseio.com/ExamSpeaking")
    , fuExamRef = new firebase('https://fuerdb.firebaseio.com/Exams/Exams')
    , registersRef = new firebase('https://fuerdb.firebaseio.com/Registers')
    , positionsRef = new firebase('https://fuerdb.firebaseio.com/Positions')
    , fuStatisticsRef = new firebase('https://fuerdb.firebaseio.com/Admin/Statistics')
    , fuLogsRef = new firebase('https://fuerdb.firebaseio.com/Admin/Logs')
    , fuinfoRef = new firebase('https://fuerdb.firebaseio.com/FUInfo/Students')
    , examWriting = null
    , examSpeaking = null
    , positonCache = null
    , registerSnap = null
    , fuLogsSnap = null
    , statisticSnap = null;


exports.init = function () {
    console.log("db.js run");

    fuLogsRef.on('value', function (snapshots) {
        fuLogsSnap = snapshots;
    });

    positionsRef.once('value', function (positionSnap) {
        positonCache = positionSnap.val();
    });

    fuStatisticsRef.on('value', function (snapshots) {
        statisticSnap = snapshots;
    });

    examWritingRef.on("value", function (examwSnap) {
        if (examwSnap.val() == null) {
            return;
        }
        examWriting = examwSnap.val();

        //Add lịch thi vào Exams
        addExamToExams(examwSnap, true);
        //gửi mail cho từng người đăng ký
        sentMailForeachRegister(examwSnap, true);
    });

    examSpeakingRef.on("value", function (examsSnap) {
        if (examsSnap.val() == null) {
            return;
        }
        examSpeaking = examsSnap.val();

        //Add lịch thi vào Exams
        addExamToExams(examsSnap, false);
        //gửi mail cho từng người đăng ký
        sentMailForeachRegister(examsSnap, false);
    });


};


exports.getRegister = function () {
    return registersRef;
};

exports.getRoot = function () {
    return root;
};

exports.writeFireLogs = function (logs) {
    if (fuLogsSnap == null) return;
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
};


//dùng khi vừa đăng ký xong
exports.checkMail = function (studentId, email) {
    if (examWriting != null) {
        var examParts = examWriting["Date"].split("/");
        var examDateMili = new Date(examParts[2], examParts[1], examParts[0]).getTime();
        var timeNow = new Date().getTime();
        if (examDateMili >= timeNow) {
            var detailDic = getDetailDictionary(examWriting, studentId);
            if (detailDic == null) {
                return;
            }
            var posDic = getAllPosition(examWriting["ExamSubjects"], detailDic);
            mailer.sendMail(email, detailDic, posDic, function (error, responseStatus) {
                if (error) {
                    console.log("Error occur");
                    console.log(error);
                } else {
                    console.log(email + " Send writing");
                }
            });
        }
    }
    else {
        console.log("Exam Writing null");
    }

    if (examSpeaking != null) {
        var examParts = examSpeaking["Date"].split("/");
        var examDateMili = new Date(examParts[2], examParts[1], examParts[0]).getTime();
        var timeNow = new Date().getTime();
        if (examDateMili >= timeNow) {
            var detailDic = getDetailDictionary(examSpeaking, studentId);
            if (detailDic == null) {
                return;
            }
            var posDic = getAllPosition(examSpeaking["ExamSubjects"], detailDic);
            mailer.sendMail(email, detailDic, posDic, function (error, responseStatus) {
                if (error) {
                    console.log("Error occur");
                    console.log(error);
                } else {
                    console.log(email + " Send Speaking");
                }
            });
        }
    }
    else {
        console.log("Exam Speaking null");
    }
};

exports.formatDate = function (date) {
    if (date == "") {
        return "-";
    }
    var dateTemp = new Date(date);
    if (dateTemp == "Invalid Date") {
        return date;
    }
    var dd = dateTemp.getDate();
    var mm = dateTemp.getMonth() + 1;
    var yyyy = dateTemp.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    return dd + '/' + mm + '/' + yyyy;
}


function getDetailDictionary(exam, studentId) {
    var detailDic = new Array();
    detailDic["date"] = "-";
    detailDic["studentName"] = "-";
    detailDic["birthDate"] = "-";
    detailDic["studentId"] = "-";
    detailDic["studentClass"] = "-";
    detailDic["subjectName"] = "-";
    detailDic["room"] = "-";
    detailDic["time"] = "-";
    detailDic["examTimes"] = "-";
    detailDic["position"] = "-";
    detailDic["positionSentence"] = "-";
    detailDic["posShare"] = "-";
    detailDic["exam"] = "-";//Writting

    try {
        var subjectName = "";
        var arrayExamSubject = jsonPath.eval(exam, "$..ExamSubjects.*");
        for (var i = 0; i < arrayExamSubject.length; i++) {
            //Nếu ExamDetail có tồn tại Id này thì thêm
            if (jsonPath.eval(arrayExamSubject[i], "$.ExamDetails[?(@.StudentId=='" + studentId + "')].StudentName") != false) {
                subjectName = arrayExamSubject[i].SubjectName.toString();
                break;
            }
        }
        if (subjectName == "") {
            detailDic = null;
            return;
        }
        detailDic["subjectName"] = subjectName;

        var examsubjectTemp = jsonPath.eval(exam, "$..ExamSubjects[?(@.SubjectName=='" + subjectName + "')]");
        var examDetailTemp;
        var indexSubject = 0;
        //Sẽ có trường hợp 1 môn mà thi 2 phòng. Như kiểu thi nói chia làm 2
        for (var i = 0; i < examsubjectTemp.length; i++) {
            examDetailTemp = jsonPath.eval(examsubjectTemp[i], "$.ExamDetails[?(@.StudentId=='" + studentId + "')]")[0];
            if (examDetailTemp != undefined) {
                indexSubject = i;
                break;
            }
        }

        detailDic["room"] = examDetailTemp.Room;
        var positionTemp = examDetailTemp.Position
        detailDic["position"] = positionTemp;
        detailDic["birthDate"] = formatTime(examDetailTemp.Birthdate);
        detailDic["studentClass"] = examDetailTemp.StudentClass;
        detailDic["studentName"] = examDetailTemp.StudentName;
        detailDic["date"] = exam.Date;

        var examSubjectTemp = jsonPath.eval(exam, "$..ExamSubjects[?(@.SubjectName=='" + subjectName + "')]")[indexSubject];
        var examTimes = examSubjectTemp.ExamTimes;
        var time = examSubjectTemp.Time
        detailDic["time"] = time;
        if (examTimes == "1") {
            detailDic["examTimes"] = "Midtem exam";
        } else if (examTimes == "2") {
            detailDic["examTimes"] = "Final exam";
        } else if (examTimes == "3") {
            detailDic["examTimes"] = "Retake exam";
        }
        var positionTemps = positionTemp;
        if (positionTemp >= 1 || positionTemp <= 20) positionTemps = 0;
        var positionObject = jsonPath.eval(positonCache, "$." + positionTemps + "")[0];
        var positionObj = positionObject[Math.floor(Math.random() * positionObject.length)];
        detailDic["positionSentence"] = positionObj.Description;
        detailDic["posShare"] = positionObj.Share;
        if (exam["IsWriting"]) {
            detailDic["exam"] = "Writting";
        } else {
            detailDic["exam"] = "Speaking";
        }
        detailDic["studentId"] = studentId;
    }
    catch (e) {
        console.log(e);
    } finally {
        return detailDic;
    }
}

function getAllPosition(arrayExamSubjects, detailDic) {
    var posDic = new Array();
    //init
    posDic["IsWriting"] = false;

    var arrayPosition = ["A6", "A2", "A1", "A5", "B6", "B2", "B1", "B5", "C6", "C2", "C1", "C5", "D6", "D2", "D1", "D5", "E6", "E2", "E1", "E5"];
    for (var i = 0; i < arrayPosition.length; i++) {
        posDic[arrayPosition[i]] = {id: "", name: "", subject: "", color: "yellow"};
    }

    try {
        var room = detailDic.room;
        var studentId = detailDic.studentId;
        var time = detailDic.time;
        var subjectName = detailDic.subjectName;

        for (var i = 0; i < arrayExamSubjects.length; i++) {
            if (arrayExamSubjects[i].Time == time) {
                var subName = arrayExamSubjects[i].SubjectName;
                var arrayExamdetail = jsonPath.eval(arrayExamSubjects[i], "$.ExamDetails[?(@.Room=='" + room + "')]");
                for (var j = 0; j < arrayExamdetail.length; j++) {
                    var positionTemp = arrayExamdetail[j].Position;
                    //Chính là người tìm
                    if (arrayExamdetail[j].StudentId == studentId) {
                        posDic[positionTemp] = {id: arrayExamdetail[j].StudentId, name: arrayExamdetail[j].StudentName, subject: subName, color: "#c0392b"};
                    }
                    //Thi cùng môn
                    else if (subName == subjectName) {
                        posDic[positionTemp] = {id: arrayExamdetail[j].StudentId, name: arrayExamdetail[j].StudentName, subject: subName, color: "#2c3e50"};
                    }
                    //Thi cùng phòng
                    else {
                        posDic[positionTemp] = {id: arrayExamdetail[j].StudentId, name: arrayExamdetail[j].StudentName, subject: subName, color: "#ecf0f1"};
                    }

                }
            }
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        return posDic;
    }

}

//Ngay khi co lich thi moi thi add lich nay vao Exams
function addExamToExams(examSnap, isWriting) {
    if (examSnap.val() == null) {
        return;
    }
    if (examSnap.val()["IsAdd"] == false) {
        fuExamRef.once('value', function (examsChildSnap) {
            var date = examSnap.val()["Date"].replaceAll('/', '-');
            if (examsChildSnap.hasChild(date) == false) {
                fuExamRef.child(date).set({"Date": examSnap.val()["Date"], "Link": examSnap.val()["Link"]});
            }
            if (isWriting) {
                fuExamRef.child(date).child('ExamWriting').set(examSnap.val());
                setFuinfo(examSnap);
                examWritingRef.update({'IsAdd': true});
                console.log("Add exams writting " + examSnap.val()['Date']);
            } else {
                fuExamRef.child(date).child('ExamSpeaking').set(examSnap.val());
                examSpeakingRef.update({'IsAdd': true});
                console.log("Add exams speaking " + examSnap.val()['Date']);
            }

        });
    }
}

//Gửi mail cho từng người đăng ký  khi có lịch thi mới
function sentMailForeachRegister(examSnap, isWriting) {
    if (examSnap.val() == null) {
        return;
    }
    if (examSnap.val()["IsSent"] == false) {
        var students = jsonPath.eval(examSnap.val(), "$..[?(@.StudentId)]");
        for (var i = 0; i < students.length; i++) {
            if (registerSnap.hasChild(students[i]["StudentId"])) {
                var arrRegisterMail = registerSnap.val()[students[i]["StudentId"]]["SendingEmail"].split(';');
                for (var j = 0; j < arrRegisterMail.length; j++) {
                    var registerId = registerSnap.val()[students[i]["StudentId"]]["StudentId"];
                    checkExamMail(registerId, arrRegisterMail[j], isWriting);
                }
            }
        }
        if (isWriting) {
            examWritingRef.update({'IsSent': true});
        } else {
            examSpeakingRef.update({'IsSent': true});
        }
    }
}

function checkExamMail(studentId, email, isWriting) {
    var exam = null;
    if (isWriting) {
        exam = examWriting;
    } else {
        exam = examSpeaking;
    }
    var examParts = exam["Date"].split("/");
    var examDateMili = new Date(examParts[2], examParts[1], examParts[0]).getTime();
    var timeNow = new Date().getTime();
    if (examDateMili >= timeNow) {
        var detailDic = getDetailDictionary(exam, studentId);
        if (detailDic == null) {
            return;
        }
        var posDic = getAllPosition(exam["ExamSubjects"], detailDic);
        mailer.sendMail(email, detailDic, posDic, function (error, responseStatus) {
            if (error) {
                console.log("Error occur");
                console.log(error);
            } else {
                console.log(email + " Send");
            }
        });
    }
}

//Từ exam add vào Fuinfo
function setFuinfo(examSnap) {
    var arrExamDetail = jsonPath.eval(examSnap.val(), "$..ExamDetails[?(@.StudentId)]");
    var arrFuinfo = new Array();
    fuinfoRef.once("value", function (fuInfoSnap) {
        for (var i = 0; i < arrExamDetail.length; i++) {
            arrFuinfo.push({ Class: arrExamDetail[i].StudentClass, Date: arrExamDetail[i].Birthdate, MSSV: arrExamDetail[i].StudentId, Name: arrExamDetail[i].StudentName });
        }
        for (var i = 0; i < fuInfoSnap.val().length; i++) {
            var fuInfoDetail = fuInfoSnap.val()[i];
            var isExits = false;
            for (var j = 0; j < arrExamDetail.length; j++) {
                if (fuInfoDetail.MSSV == arrExamDetail[j].StudentId) {
                    isExits = true;
                    break;
                }
            }
            if (isExits == false) {
                arrFuinfo.push(fuInfoDetail);
            }
        }
        fuinfoRef.set(arrFuinfo);
    });
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

function formatTime(dates) {
    if (dates == "") {
        return "-";
    }
    return dates;
}