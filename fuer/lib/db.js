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
    , fc = require('../lib/function.js')
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
        if(snapshots.val()==null) return;
        fuLogsSnap = snapshots;
    });

    /*fuStatisticsRef.on('value', function (snapshots) {
        statisticSnap = snapshots;
    });*/

    /*examWritingRef.on("value", function (examwSnap) {
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
    });*/
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
    examWritingRef.once("value", function (examwSnap) {
        examWriting = examwSnap.val();
        if (examWriting != null) {
            var examParts = examWriting["Date"].split("/");
            var examDateMili = new Date(examParts[2], examParts[1], examParts[0]).getTime();
            var timeNow = new Date().getTime();
            if (examDateMili >= timeNow) {
                var detailDic = fc.getDetailDictionary(examWriting, studentId);
                if (detailDic == null) {
                    return;
                }
                var posDic = fc.getAllPosition(examWriting["ExamSubjects"], detailDic);
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
    });

    examSpeakingRef.once("value", function (examsSnap) {
        examSpeaking = examsSnap.val();
        if (examSpeaking != null) {
            var examParts = examSpeaking["Date"].split("/");
            var examDateMili = new Date(examParts[2], examParts[1], examParts[0]).getTime();
            var timeNow = new Date().getTime();
            if (examDateMili >= timeNow) {
                var detailDic = fc.getDetailDictionary(examSpeaking, studentId);
                if (detailDic == null) {
                    return;
                }
                var posDic = fc.getAllPosition(examSpeaking["ExamSubjects"], detailDic);
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
    });

};


Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}

