var Firebase = require('firebase');
var db = require('../lib/db.js');
var ejs = require('ejs');
var fs = require('fs');
var template = fs.readFileSync('views/register_template.ejs', 'utf8');
var recaptcha = require('simple-recaptcha');
var fuUserref = new Firebase('https://fuerdb.firebaseio.com/Admin/Users');

exports.index = function (req, res) {
    res.render('index2.ejs', { title: 'FU Exam Reminder' });
    console.log("Run index2");
};

exports.postdata = function (req, res) {
    var privateKey = '6LfFlfgSAAAAAKba6cKt4TtHyM2vg3mWv1HF499K'; // your private key here
    var ip = req.ip;
    var challenge = req.body.form.recaptcha_challenge_field;
    var response = req.body.form.recaptcha_response_field;
    recaptcha(privateKey, ip, challenge, response, function (err) {
        if (err) {
            var htmlRes = ejs.render(template, {message: "Mã xác nhận không đúng"});
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({'success': false, 'html': htmlRes}));
            res.end();
            return;
        }
        else {
            var studentId = req.body.form.studentid,
                email = req.body.form.email;
            console.log(studentId + "-" + email);
            db.writeFireLogs(studentId + "-" + email + " register");
            var canSubmit = validate(studentId, email);
            if (!canSubmit) {
                var htmlRes = ejs.render(template, {message: "Có lỗi xảy ra!"});
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({'success': false, 'html': htmlRes}));
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

exports.postLogindata = function (reg, res) {
    var name = reg.body.form.name;
    var password = reg.body.form.passwords;
    checkLogin(name, password, res);
}

function checkLogin(name, password, res) {
    var returns = {'success': false, 'status': ""};
    fuUserref.once('value', function (snapshoot) {
        if (snapshoot.hasChild(name)) {
            if (snapshoot.child(name + "/Password").val() == password) {
                returns = {'success': true, 'status': "<a href='/Admin'>Đăng nhập thành công, Ấn để qua trang Admin</a>"};
                global.USERNAME = snapshoot.child(name + "/Name").val();
                global.ROLE = snapshoot.child(name + "/Role").val();
                console.log(global.USERNAME + " login, Role:" + global.ROLE);
                db.writeFireLogs(global.USERNAME + " login, Role:" + global.ROLE);
            } else {
                returns = {'success': false, 'status': "Không đúng mật khẩu"};
            }
        } else {
            returns = {'success': false, 'status': "Không tồn tại tên này"};
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({'success': returns.success, 'value': returns.status}));
        res.end();
    });
}

function validate(studentId, email) {
    var canSubmit = true;
    var emailRegex = new RegExp(/^([\w-\s]+)(@fpt\.edu\.vn)$/i);
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
    else if (email.toString().indexOf(studentId.toLowerCase()) < 2) {
        canSubmit = false;
    }
    return canSubmit;
}