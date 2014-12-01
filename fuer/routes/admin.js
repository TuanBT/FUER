var firebase = require('firebase')
    , jsonPath = require('JSONPath')
    , mailer = require('../lib/mailer.js')
    , db = require('../lib/db.js')
    , fc = require('../lib/function.js')
    , XLS = require('js-xls')
    , fs = require('fs')
    , url = require('url')
    , http = require('http')
    , exec = require('child_process').exec
    , examWritingRef = new firebase("https://fuerdb.firebaseio.com/ExamWriting")
    , examSpeakingRef = new firebase("https://fuerdb.firebaseio.com/ExamSpeaking")
    , fuExamRef = new firebase('https://fuerdb.firebaseio.com/Exams/Exams')
    , registersRef = new firebase('https://fuerdb.firebaseio.com/Registers')
    , positionsRef = new firebase('https://fuerdb.firebaseio.com/Positions')
    , fuinfoRef = new firebase('https://fuerdb.firebaseio.com/FUInfo/Students')
    , examWriting = null
    , examSpeaking = null
    , positonCache = null
    , registerSnap = null;


var room = "";
var position = "";
var birthdate = "";
var studentClass = "";
var studentName = "";
var studentId = "";
var subjectName = "";
var examTimes = "";
var time = "";
var date = "";


exports.index = function (req, res) {
    res.render('admin.ejs', { title: 'FUER Admin' });

    console.log("Open Admin page");

    global.USERNAME = "";
    global.ROLE = "User";

    console.log(global.USERNAME);

    positionsRef.once('value', function (positionSnap) {
        positonCache = positionSnap.val();
    });

    registersRef.once("value", function (Snap) {
        registerSnap = Snap;
    });
};

exports.postdata = function (req, res) {
    var values = req.body.form.value;
    if (values == "") {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({'success': "Không cho phép để trống", 'value': values}));
        res.end();
        return;
    }
    downloadFile(values, res);
};

examWritingRef.on("value", function (examwSnap) {
    if (examwSnap.val() == null) {
        return;
    }
    examWriting = examwSnap.val();

    //Add lịch thi vào Exams
    addExamToExams(examwSnap, true);
    //gửi mail cho từng người
    sentMailForeachRegister(examwSnap, true);
});

examSpeakingRef.on("value", function (examsSnap) {
    if (examsSnap.val() == null) {
        return;
    }
    examSpeaking = examsSnap.val();

    //Add lịch thi vào Exams
    addExamToExams(examsSnap, false);
    //gửi mail cho từng người
    sentMailForeachRegister(examsSnap, false);
});

//add lich vao Exams
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

//Gửi mail cho mọi người đăng ký
function sentMailForeachRegister(examSnap, isWriting) {
    if (examSnap.val() == null) {
        return;
    }
    if (examSnap.val()["IsSent"] == false) {
        var students = jsonPath.eval(examSnap.val(), "$..[?(@.StudentId)]");
        if (registerSnap != null) {
            for (var i = 0; i < students.length; i++) {
                try {
                    if (registerSnap.hasChild(students[i]["StudentId"])) {
                        var arrRegisterMail = registerSnap.val()[students[i]["StudentId"]]["SendingEmail"].split(';');
                        for (var j = 0; j < arrRegisterMail.length; j++) {
                            var registerId = registerSnap.val()[students[i]["StudentId"]]["StudentId"];
                            checkExamMail(registerId, arrRegisterMail[j], isWriting);
                        }
                    }
                } catch (ex) {
                    console.log("admin.js-sentMailForeachRegister: Error-"+students[i]["StudentId"]);
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
        var detailDic = fc.getDetailDictionary(exam, studentId);
        if (detailDic == null) {
            return;
        }
        var posDic = fc.getAllPosition(exam["ExamSubjects"], detailDic);
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

// Function to download file using HTTP.get
function downloadFile(fileUrl, res) {
    var downloadDir = './public/download/';
    var options = {
        host: url.parse(fileUrl).host,
        port: 80,
        path: url.parse(fileUrl).pathname
    };

    //var fileName = url.parse(fileUrl).pathname.split('/').pop();
    var fileName = "fileExcel" + ".xls";
    var file = fs.createWriteStream(downloadDir + fileName);

    http.get(options, function (ress) {
        ress.on('data', function (data) {
            file.write(data);
        }).on('end', function () {
            file.end();
            console.log(fileName + ' downloaded to ' + downloadDir);
            var success = getDataFromExcel(downloadDir + fileName);
            //Trả về client thông báo
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({'success': success, 'value': fileUrl}));
            res.end();
        });
    });
};

//Từ excel tạo data cho ExamWriting và ExamSpaeking
function getDataFromExcel(filePath) {
//    var examWritingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamWriting");
//    var examSpeakingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamSpeaking");

    try {
        var workbook = XLS.readFile(filePath);
        var isWriting = true;
        workbook.Sheets[workbook.SheetNames[0]]["F2"].v == "- Thi vấn đáp" ? isWriting = false : isWriting = true;
        //Thi viết
        if (isWriting) {
            var ExamSubjects = [];
            for (var i = 0; i < workbook.SheetNames.length; i++) {
                var ExamDetails = [];
                var sheetName = workbook.SheetNames[i];
                var sheet = workbook.Sheets[sheetName];
                subjectName = sheet["F2"] == undefined ? "" : sheet["F2"].v;
                date =  sheet["C3"] == undefined ? "" :fc.formatDate(sheet["C3"].w);
                time = sheet["F3"] == undefined ? "" :sheet["F3"].v;
                examTimes = sheet["I4"] == undefined ? "1" :sheet["I4"].v;

                var un = 0;
                for (var j = 1; j < 1000; j++) {
                    //console.log("A"+j);
                    if (sheet["A" + j] == undefined) {
                        un++;
                        if (un > 20) {
                            break;
                        }
                    } else {
                        un = 0;
                        if (sheet["A" + j].v == "Phòng thi") {
                            room = sheet["C" + j] == undefined ? "" : (sheet["C" + j].v).toString();
                        }
                        //Nếu true la so
                        if (!isNaN(parseFloat(sheet["A" + j].v)) && isFinite(sheet["A" + j].v)) {
                            position = sheet["B" + j] == undefined ? "FUER" : sheet["B" + j].v;
                            studentId = sheet["C" + j] == undefined ? "-" : (sheet["C" + j].v).toString();
                            studentName = sheet["D" + j] == undefined ? "-" : sheet["D" + j].v;
                            birthdate = sheet["E" + j] == undefined ? "-" : fc.formatDate(sheet["E" + j].w);
                            studentClass = sheet["F" + j] == undefined ? "-" : sheet["F" + j].v;

                            var ExamDetail = {Room: room, Position: position, Birthdate: birthdate, StudentClass: studentClass, StudentName: studentName, StudentId: studentId};
                            ExamDetails.push(ExamDetail);
                        }
                    }
                }

                var ExamSubject = {SubjectName: subjectName, ExamTimes: examTimes, Time: time, ExamDetails: ExamDetails};
                ExamSubjects.push(ExamSubject);
            }
            var ExamWriting = {Date: date, IsSent: true, IsAdd: true, Link: "", IsWriting: true, ExamSubjects: ExamSubjects};
            examWritingRef.set(ExamWriting);
            console.log("Set ExamWriting to DB");
            return "Lịch thi viết " + date;
        }
        //Thi nói
        else {
            var ExamSubjects = [];
            for (var i = 0; i < workbook.SheetNames.length; i++) {
                var ExamDetails = [];
                var sheetName = workbook.SheetNames[i];
                var sheet = workbook.Sheets[sheetName];
                subjectName = sheet["E2"] == undefined ? "" : sheet["E2"].v;
                date =  sheet["B3"] == undefined ? "" :fc.formatDate(sheet["B3"].w);
                time = sheet["E3"] == undefined ? "" :sheet["E3"].v;
                examTimes = sheet["H4"] == undefined ? "1" :sheet["H4"].v;

                var un = 0;
                for (var j = 1; j < 1000; j++) {
                    if (sheet["A" + j] == undefined) {
                        un++;
                        if (un > 20) {
                            break;
                        }
                    } else {
                        un = 0;
                        if (sheet["A" + j].v == "Phòng thi") {
                            room = sheet["B" + j] == undefined ? "" : (sheet["B" + j].v).toString();
                        }
                        //Nếu true la so
                        if (!isNaN(parseFloat(sheet["A" + j].v)) && isFinite(sheet["A" + j].v)) {
                            position = sheet["A" + j] == undefined ? "0" : sheet["A" + j].v;
                            studentId = sheet["B" + j] == undefined ? "-" : (sheet["B" + j].v).toString();
                            studentName = sheet["C" + j] == undefined ? "-" : sheet["C" + j].v;
                            birthdate = sheet["D" + j] == undefined ? "-" : fc.formatDate(sheet["D" + j].w);
                            studentClass = sheet["E" + j] == undefined ? "-" : sheet["E" + j].v;

                            var ExamDetail = {Room: room, Position: position, Birthdate: birthdate, StudentClass: studentClass, StudentName: studentName, StudentId: studentId};
                            ExamDetails.push(ExamDetail);
                        }
                    }
                }
                var ExamSubject = {SubjectName: subjectName, ExamTimes: examTimes, Time: time, ExamDetails: ExamDetails};
                ExamSubjects.push(ExamSubject);
            }
            var ExamSpeaking = {Date: date, IsSent: true, IsAdd: true, Link: "", IsWriting: false, ExamSubjects: ExamSubjects};
            examSpeakingRef.set(ExamSpeaking);
            console.log("Set ExamSpeaking to DB");
            return "Lịch thi nói " + date;
        }
    }
    catch (e) {
        console.log("Error read excel: " + e);
        //db.writeFireLogs("Error read excel: " + e);
        return e.toString();
    }
}