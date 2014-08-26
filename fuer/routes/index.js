/*
 * GET home page.
 */
var Firebase = require('firebase');
var db = require('../lib/db.js');
var ejs = require('ejs');
var fs = require('fs');
var template = fs.readFileSync('views/register_template.ejs', 'utf8');
var recaptcha = require('simple-recaptcha');
exports.index = function (req, res) {
    res.render('index', { title: 'FU Exam Reminder' });
    db.writeFireLogs("Open Index page");
};

exports.postdata = function (req, res) {
    var privateKey = '6LfbNPgSAAAAAGIgJhnXzF_5hwsCku2uaJY9UWH1'; // your private key here
    var ip = req.ip;
    var challenge = req.body.form.recaptcha_challenge_field;
    var response = req.body.form.recaptcha_response_field;
    recaptcha(privateKey, ip, challenge, response, function (err) {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({'success': false, 'html': "<p>Mã xác nhận không đúng</p>"}));
            res.end();
            return;
        }
        else {
            var studentId = req.body.form.studentid,
                email = req.body.form.email;
            console.log(studentId + "-" + email);
            var canSubmit = validate(studentId, email);
            if (!canSubmit) {
                var htmlRes = ejs.render(template, {message: resMessage});
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({'success': false, 'html': "<p>Có lỗi xảy ra!</p>"}));
                res.end();
                return;
            }
            else {
                // add a Register
                var isNew = true;
                var success = true;
                var regRef = db.getRegister().child(studentId);
                db.getRegister().child(studentId).once("value", function (snapShot) {
                    var newEmails = "";
                    var emailRegistered = false;
                    if (snapShot.val() != null) {
                        if (snapShot.hasChild('StudentId')) {
                            isNew = false;
                            newEmails = snapShot.val().SendingEmail;
                        }
                        if (newEmails.indexOf(email) == -1) {
                            if (isNew) {
                                newEmails = email;
                            }
                            else {
                                newEmails += ";" + email;
                            }

                        }
                    }
                    var updateDateMili = new Date().getTime();

                    regRef.set({'StudentId': studentId, 'SendingEmail': newEmails}, function (error) {
                        if (!error) {
                            regRef.setPriority(updateDateMili);
                            if (isNew) {
                                //var countRef = db.getRoot().child("RegisterCount/Count");
                                db.getRoot().child("RegisterCount").once("value", function (snap) {
                                    db.getRoot().child("RegisterCount").set({Count: snap.val()["Count"] + 1});
                                });
                            }
                            db.checkMail(studentId, email);

                        } else {
                            success = false;
                        }
                        var resMessage = "";
                        if (success) {
                            if (isNew) {
                                resMessage = "Đăng ký thành công!";
                            } else {
                                resMessage = "Cập nhập thành công!";
                            }

                        } else {
                            resMessage = "Đã có lỗi xảy ra, vui lòng thử lại";
                        }
                        var htmlRes = ejs.render(template, {message: resMessage});
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify({'success': success, 'html': htmlRes}));
                        res.end();
                    });
                });
                //
                db.getRegister().child(studentId).child('dummy').set('dummy');
            }
        }
    });
};
function validate(studentId, email) {
    var canSubmit = true;
    var emailRegex = new RegExp(/^([\w-\s]+)(@fpt.edu.vn)$/i);
    //var regexStuId = new RegExp(/^(SE|SB|BA|FB|GC|B)?\d{5}$/i)
    if (studentId == "") {
        canSubmit = false;
    } //else if (!regexStuId.test(studentId)){
    //    canSubmit = false;

    //}
    if (email == "") {
        canSubmit = false;
    } else if (!emailRegex.test(email)) {
        canSubmit = false;
    }
    else if (email.toString().indexOf(studentId.toLowerCase()) == -1) {
        canSubmit = false;
    }
    return canSubmit;
}