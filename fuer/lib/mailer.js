var Firebase = require('firebase')
    , db = require('../lib/db.js')
var fs = require('fs')
    , ejs = require('ejs')
    , template = fs.readFileSync('./views/mail_template.ejs', 'utf8')
    , nodeMailer = require('nodemailer')
    , transport = nodeMailer.createTransport("Hotmail", {
        auth: {
            user: "fuer_app@outlook.com",
            pass: "fptlaso1"

        }
    });

var fuStatisticsRef = new Firebase('https://fuerdb.firebaseio.com/Admin/Statistics');
var statisticSnap=null;
fuStatisticsRef.on('value',function(snapshots){
    statisticSnap= snapshots;
});

exports.sendMail = function (email, detailDic, posDic, callback) {
    console.log(email + "-" + detailDic["subjectName"] + "-" + detailDic["exam"] + " Sending mail...");
    db.writeFireLogs(email + "-" + detailDic["subjectName"] + "-" + detailDic["exam"] + " Sending mail...");
    //email = "bttvn.4t@gmail.com";
    transport.sendMail({
            from: "fuer_app@hotmail.com",
            to: email,
            subject: "[FUER] Thông báo lịch thi môn " + detailDic["subjectName"],
            html: ejs.render(template, {
                detail: detailDic,
                pos: posDic
            })
        },
        function (error, responseStatus) {
            if(!error){
                var connectCount = statisticSnap.val()["Mail"] +1 ;
                fuStatisticsRef.child('Mail').set(connectCount);
                db.writeFireLogs(email + " Send");
            }
            callback(error, responseStatus);
        });
}
