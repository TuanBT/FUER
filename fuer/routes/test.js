var firebase = require('firebase');
var examWritingRef = new firebase("https://fuerdb.firebaseio.com/ExamWriting");
var examSpeakingRef = new firebase("https://fu-exam-reminder-db.firebaseio.com/ExamSpeaking");
var db = require('../lib/db.js');
var mailer = require('../lib/mailer.js');
var fc = require('../lib/function.js');


exports.index = function (req, res) {
    res.render('test.ejs');


    examWritingRef.once('value', function (snap) {
        var detailDic = fc.getDetailDictionary(snap.val(), "SB60441");
        if (detailDic == null) {
            return;
        }
        var posDic = fc.getAllPosition(snap.val()["ExamSubjects"], detailDic);
        mailer.sendMail("bttvn.4t@gmail.com", detailDic, posDic, function (error, responseStatus) {
            if (error) {
                console.log("Error occur");
                console.log(error);
            } else {
                console.log("bttvn.4t@gmail.com" + " Send writing");
            }
        });
    })
};


var a = {'ExamDetail': {'Room': '313', 'Position': 'B2', 'BirthDate': '07/02/1993', 'StudentClass': 'MKL3_B4S', 'StudentName': 'Nguyễn Thị Minh Trang', 'StudentId': 'SB60441', 'Date': '30/08/2014', 'ExamTimes': 'Final exam', 'Time': '07h45 - 09h45', 'ExamTypeStr': 'Writting', 'PositionSentence': 'Chỗ ngồi này thật là may mắn với Bảo Bình, Kim Ngưu, Sư Tử và Thần Nông. Đặc biệt với bọn FA thì còn may mắn hơn !', 'PosShare': 'H6.TS', 'SubjectName': 'MKL3'},
    'ExamPositon': {'A1': {'SubjectName': 'MKL3', 'StudentId': 'SB60484', 'StudentName': 'Nguyễn Quang Hải', 'TypePosition': '1'}, 'B1': {'SubjectName': 'MKL3', 'StudentId': 'SB60464', 'StudentName': 'Trần Thị Thu Hiền', 'TypePosition': '1'}, 'C1': {'SubjectName': 'MKL3', 'StudentId': 'SB90237', 'StudentName': 'Phan Thị Thu Hiền', 'TypePosition': '1'}, 'D1': {'SubjectName': 'MKL3', 'StudentId': 'SB60497', 'StudentName': 'Chu Văn Hòa', 'TypePosition': '1'}, 'E1': {'SubjectName': 'MKL3', 'StudentId': 'FB60053', 'StudentName': 'Hà Lê Hoàng', 'TypePosition': '1'}, 'A6': {'SubjectName': 'MKL3', 'StudentId': 'SB60565', 'StudentName': 'Nguyễn Văn Nam Hưng', 'TypePosition': '1'}, 'B6': {'SubjectName': 'MKL3', 'StudentId': 'SB60529', 'StudentName': 'Nguyễn Nhân Huy', 'TypePosition': '1'}, 'C6': {'SubjectName': 'MKL3', 'StudentId': 'FB60164', 'StudentName': 'Nguyễn Thiện Khánh', 'TypePosition': '1'}, 'D6': {'SubjectName': 'MKL3', 'StudentId': 'SB60495', 'StudentName': 'Khưu Nhựt Minh', 'TypePosition': '1'}, 'E6': {'SubjectName': 'MKL3', 'StudentId': 'BA60131', 'StudentName': 'Nguyễn Khoa Nam', 'TypePosition': '1'}, 'A5': {'SubjectName': 'MKL3', 'StudentId': 'SB60707', 'StudentName': 'Nguyễn Thị Hồng Ngân', 'TypePosition': '1'}, 'B5': {'SubjectName': 'MKL3', 'StudentId': 'SB60576', 'StudentName': 'Võ Thị Kiều Oanh', 'TypePosition': '1'}, 'C5': {'SubjectName': 'MKL3', 'StudentId': 'BA60121', 'StudentName': 'Trần Vạn Phát', 'TypePosition': '1'}, 'D5': {'SubjectName': 'MKL3', 'StudentId': 'SB90250', 'StudentName': 'Trần Thị Hương Quỳnh', 'TypePosition': '1'}, 'E5': {'SubjectName': 'MKL3', 'StudentId': 'SB60562', 'StudentName': 'Nguyễn Lộc Sơn', 'TypePosition': '1'}, 'A2': {'SubjectName': 'MKL3', 'StudentId': 'SB60426', 'StudentName': 'Nguyễn Công Cường Thịnh', 'TypePosition': '1'}, 'B2': {'SubjectName': 'MKL3', 'StudentId': 'SB60441', 'StudentName': 'Nguyễn Thị Minh Trang', 'TypePosition': '0'}, 'C2': {'SubjectName': 'MKL3', 'StudentId': 'SB60542', 'StudentName': 'Nguyễn Hải Phương Uyên', 'TypePosition': '1'}, 'D2': {'SubjectName': 'MKL3', 'StudentId': 'SB60511', 'StudentName': 'Nguyễn Hữu Vinh', 'TypePosition': '1'}}}