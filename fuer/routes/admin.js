var firebase = require('firebase')
    , jsonPath = require('JSONPath')
    , mailer = require('../lib/mailer.js')
    , db = require('../lib/db.js')
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
    if(values==""){
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({'success': "Không cho phép để trống", 'value': values}));
        res.end();
        return;
    }
    downloadFile(values, res);
};


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
        ress.on('data',function (data) {
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

function getDataFromExcel(filePath) {
//    var examWritingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamWriting");
//    var examSpeakingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamSpeaking");

    try {
        var workbook = XLS.readFile(filePath);
        var isWriting = true;
        workbook.Sheets[workbook.SheetNames[0]]["F2"].v == "- Thi vấn đáp" ? isWriting = false : isWriting = true;
        //Thi viết
        if (isWriting) {
            var ExamSubjects=[];
            for (var i = 0; i < workbook.SheetNames.length; i++) {
                var ExamDetails=[];
                var sheetName = workbook.SheetNames[i];
                var sheet = workbook.Sheets[sheetName];
                subjectName = sheet["F2"].v;
                date = db.formatDate(sheet["C3"].w);
                time = sheet["F3"].v;
                examTimes = sheet["I4"].v;

                var un = 0;
                for (var j = 1; j < 1000; j++) {
                    if (sheet["A" + j] == undefined) {
                        un++;
                        if (un > 20) {
                            break;
                        }
                    } else {
                        un = 0;
                        if (sheet["A" + j].v == "Phòng thi") room = (sheet["C" + j].v).toString();
                        //Nếu true la so
                        if (!isNaN(parseFloat(sheet["A" + j].v)) && isFinite(sheet["A" + j].v)) {
                            position = sheet["B" + j] == undefined ? "FUER" : sheet["B" + j].v;
                            studentId = (sheet["C" + j].v).toString();
                            studentName = sheet["D" + j].v;
                            birthdate = sheet["E" + j] == undefined ? "" : db.formatDate(sheet["E" + j].w);
                            studentClass = sheet["F" + j].v;

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
            var ExamSubjects=[];
            for (var i = 0; i < workbook.SheetNames.length; i++) {
                var ExamDetails=[];
                var sheetName = workbook.SheetNames[i];
                var sheet = workbook.Sheets[sheetName];
                subjectName = sheet["E2"].v;
                date = db.formatDate(sheet["B3"].w);
                time = sheet["E3"].v.trim();
                examTimes = sheet["H4"].v;

                var un = 0;
                for (var j = 1; j < 1000; j++) {
                    if (sheet["A" + j] == undefined) {
                        un++;
                        if (un > 20) {
                            break;
                        }
                    } else {
                        un = 0;
                        if (sheet["A" + j].v == "Phòng thi") room = (sheet["B" + j].v).toString();
                        //Nếu true la so
                        if (!isNaN(parseFloat(sheet["A" + j].v)) && isFinite(sheet["A" + j].v)) {
                            position = sheet["A" + j].v;
                            studentId = (sheet["B" + j].v).toString();
                            studentName = sheet["C" + j].v;
                            birthdate = sheet["D" + j] == undefined ? "" : db.formatDate(sheet["D" + j].w);
                            studentClass = sheet["E" + j].v;

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