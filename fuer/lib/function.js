/**
 * Created by Bui Tien Tuan on 8/29/2014.
 */
var firebase = require('firebase')
    , jsonPath = require('JSONPath')
    , positionsRef = new firebase('https://fuerdb.firebaseio.com/Positions')
    , positonCache = null;


positionsRef.once('value', function (positionSnap) {
    positonCache = positionSnap.val();
});

exports.getDetailDictionary = function (exam, studentId) {
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
        console.log("Function: getDetailDictionary " + e);
    } finally {
        return detailDic;
    }
}

exports.getAllPosition = function (arrayExamSubjects, detailDic) {
    var posDic = new Array();
    //init
    posDic["IsWriting"] = false;


    try {
        var room = detailDic.room;
        var studentId = detailDic.studentId;
        var time = detailDic.time;
        var subjectName = detailDic.subjectName;

        if (detailDic.exam == "Writting") {
            var arrayPosition = ["A6", "A4", "A2", "A1", "A3", "A5", "B6", "B4", "B2", "B1", "B3", "B5", "C6", "C4", "C2", "C1", "C3", "C5", "D6", "D4", "D2", "D1", "D3", "D5", "E6", "E4", "E2", "E1", "E3", "E5"];
            for (var i = 0; i < arrayPosition.length; i++) {
                posDic[arrayPosition[i]] = {id: "", name: "", subject: "", color: "yellow"};
            }
            for (var i = 0; i < arrayExamSubjects.length; i++) {
                if (arrayExamSubjects[i].Time == time) {
                    var subName = arrayExamSubjects[i].SubjectName;
                    var arrayExamdetail = jsonPath.eval(arrayExamSubjects[i], "$.ExamDetails[?(@.Room=='" + room + "')]");
                    for (var j = 0; j < arrayExamdetail.length; j++) {
                        var positionTemp = arrayExamdetail[j].Position;
                        if (positionTemp[1] == '3') positionTemp = positionTemp[0] + "5";
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
        else {
            for (var i = 0; i < arrayExamSubjects.length; i++) {
                if (arrayExamSubjects[i]["SubjectName"] == subjectName) {
                    for (var j = 0; j < arrayExamSubjects[i].ExamDetails.length; j++) {
                        var detail = arrayExamSubjects[i].ExamDetails;
                        if (detail[j]["Room"] == room) {
                            if (detail[j]["StudentId"] == studentId) {
                                posDic.push({Position: detail[j]["Position"], StudentId: detail[j]["StudentId"], StudentName: detail[j]["StudentName"], Color: "#ff0000"});
                            } else {
                                posDic.push({Position: detail[j]["Position"], StudentId: detail[j]["StudentId"], StudentName: detail[j]["StudentName"], Color: "#000000"});
                            }
                        }
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

function formatTime(dates) {
    if (dates == "") {
        return "-";
    }
    return dates;
}

