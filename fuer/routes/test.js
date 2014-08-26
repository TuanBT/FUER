var XLS = require('js-xls');
var firebase = require('firebase');
var examWritingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamWriting");
var examSpeakingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamSpeaking");
var db = require('../lib/db.js');

var fs = require('fs');
var url = require('url');
var http = require('http');
var exec = require('child_process').exec;


var ExamWriting = {Date: "", IsSent: true, IsAdd: true, Link: "", IsWriting: true, ExamSubjects: ExamSubjects};
var ExamSpeaking = {Date: "", IsSent: true, IsAdd: true, Link: "", IsWriting: false, ExamSubjects: ExamSubjects};
var ExamSubjects = [];
var ExamSubject = {SubjectName: "", ExamTimes: "", Time: "", ExamDetails: ExamDetails};
var ExamDetails = [];
var ExamDetail = {Room: "", Position: "", Birthdate: "", StudentClass: "", StudentName: "", StudentId: ""};

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
    res.render('test.ejs');
};

exports.postdata = function (req, res) {
    var values = req.body.form.value;

    downloadFile(values,res);

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
                //Tr? v? client, thông báo
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({'success': success, 'value': fileUrl}));
                res.end();
            });
    });
};

function getDataFromExcel(filePath) {
    try {
        var workbook = XLS.readFile(filePath);
        var isWriting = true;
        workbook.Sheets[workbook.SheetNames[0]]["F2"].v == "- Thi v?n ?áp" ? isWriting = false : isWriting = true;
        //Thi viết
        if (isWriting) {
            for (var i = 0; i < workbook.SheetNames.length; i++) {
                var sheetName = workbook.SheetNames[i];
                var sheet = workbook.Sheets[sheetName];
                subjectName = sheet["F2"].v;
                date = sheet["C3"].v;
                time = sheet["F3"].v;
                examTimes = sheet["I4"].v;

                var row = 7;
                while (sheet["A" + row] != undefined) {
                    for (var j = 0; j < row + 20; j++) {
                        var rowIndex = row + j;
                        if (sheet["A" + rowIndex] == undefined) break;
                        position = sheet["B" + rowIndex].v;
                        studentId = sheet["C" + rowIndex].v;
                        studentName = sheet["D" + rowIndex].v;
                        birthdate = sheet["E" + rowIndex] == undefined ? "" : sheet["E" + rowIndex].v;
                        studentClass = sheet["F" + rowIndex].v;
                        var rowIndexRoom = row - 5;
                        room = sheet["C" + rowIndexRoom].v;
                        ExamDetail = {Room: room, Position: position, Birthdate: birthdate, StudentClass: studentClass, StudentName: studentName, StudentId: studentId};
                        ExamDetails.push(ExamDetail);
                    }
                    row += 30;
                }
                ExamSubject = {SubjectName: subjectName, ExamTimes: examTimes, Time: time, ExamDetails: ExamDetails};
                ExamSubjects.push(ExamSubject);
            }
            ExamWriting = {Date: date, IsSent: true, IsAdd: true, Link: "", IsWriting: true, ExamSubjects: ExamSubjects};
            examWritingRef.set(ExamWriting);
            console.log("Set ExamWriting to DB");
        }
        //Thi nói
        else {
            for (var i = 0; i < workbook.SheetNames.length; i++) {
                var sheetName = workbook.SheetNames[i];
                var sheet = workbook.Sheets[sheetName];
                subjectName = sheet["E2"].v;
                date = sheet["B3"].v;
                time = sheet["E3"].v.trim();
                examTimes = sheet["H4"].v;

                var row = 7;
                while (sheet["A" + row] != undefined) {
                    for (var j = 0; j < row + 18; j++) {
                        var rowIndex = row + j;
                        if (sheet["A" + rowIndex] == undefined) break;
                        position = sheet["A" + rowIndex].v;
                        studentId = sheet["B" + rowIndex].v;
                        studentName = sheet["C" + rowIndex].v;
                        birthdate = sheet["D" + rowIndex] == undefined ? "" : sheet["E" + rowIndex].v;
                        studentClass = sheet["E" + rowIndex].v;
                        var rowIndexRoom = row - 5;
                        room = sheet["B" + rowIndexRoom].v;
                        ExamDetail = {Room: room, Position: position, Birthdate: birthdate, StudentClass: studentClass, StudentName: studentName, StudentId: studentId};
                        ExamDetails.push(ExamDetail);
                    }
                    row += 26;
                }
                ExamSubject = {SubjectName: subjectName, ExamTimes: examTimes, Time: time, ExamDetails: ExamDetails};
                ExamSubjects.push(ExamSubject);
            }
            ExamSpeaking = {Date: date, IsSent: true, IsAdd: true, Link: "", IsWriting: false, ExamSubjects: ExamSubjects};
            examSpeakingRef.set(ExamSpeaking);
            console.log("Set ExamSpeaking to DB");
        }
        return true;
    }
    catch (e) {
        console.log("Error read excel: " + e);
        //db.writeFireLogs("Error read excel: " + e);
        return false;
    }
}
