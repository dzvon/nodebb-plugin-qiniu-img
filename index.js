'use strict';

const request = require('request'),
    winston = require('winston'),
    fs = require('fs'),
    nconf = require.main.require('nconf'),
    async = require.main.require('async'),
    db = module.parent.require('./database');

const qiniu = require('qiniu');

(function (qiniuImg) {
    var dbSettingsKey = 'nodebb-plugin-qiniu-img';

    qiniuImg.init = function (params, callback) {
        params.router.get('/admin/plugins/qiniu-img', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
        params.router.get('/api/admin/plugins/qiniu-img', params.middleware.applyCSRF, renderAdmin);
        params.router.post('/api/admin/plugins/qiniu-img/save', params.middleware.applyCSRF, save);
    };

    function renderAdmin(req, res, next) {
        db.getObject(dbSettingsKey, function (err, settings) {
            if (err) {
                return next(err);
            }
            settings = settings || {};
            var data = {
                qiniuAccessKey: settings.qiniuAccessKey,
                qiniuSecretKey: settings.qiniuSecretKey,
                qiniuImgBucket: settings.qiniuImgBucket
            };
            res.render('admin/plugins/qiniu-img', {settings: data, csrf: req.csrfToken()});
        });
    }

    function save(req, res, next) {
        var data = {
            qiniuAccessKey: req.body.qiniuAccessKey || '',
            qiniuSecretKey: req.body.qiniuSecretKey || '',
            qiniuImgBucket: req.body.qiniuImgBucket || ''
        };

        db.setObject('nodebb-plugin-qiniu-img', data, function (err) {
            if (err) {
                return next(err);
            }

            res.status(200).json({message: '保存成功'});
        });
    }

    qiniuImg.upload = function (data, callback) {
        var settings,
            image = data.image;

        if (!image) {
            return callback(new Error('图片不可用'));
        }

        async.waterfall([
            function (next) {
                db.getObject(dbSettingsKey, next);
            },
            function (_settings, next) {
                settings = _settings || {};

                if (!settings.qiniuAccessKey || !settings.qiniuSecretKey || !settings.qiniuImgBucket) {
                    return next(new Error('不可用的参数配置'));
                }

                next();
            },
            function (next) {
                doUpload(data, settings, next);
            }
        ], callback);
    };

    function doUpload (data, settings, callback) {
        function done (err) {
            if (!callbackCalled) {
                callbackCalled = true;
                callback(err);
            }
        }

        var image = data.image;

        var callbackCalled = false;
        var type = image.url ? 'url' : 'file';

        if (type === 'file' && !image.path) {
            return callback(new Error('图片路径不可用'));
        }

        var formDataImage;
        if (type === 'file') {
            formDataImage = fs.createReadStream(image.path);
            formDataImage.on('error', function (err) {
                done(err);
            });
        } else if (type === 'url') {
            formDataImage = image.url;
        } else {
            return callback(new Error('未知类型'));
        }

        uploadToQiniu(settings, formDataImage, function (err, body) {
            if (err) {
                return done(err);
            }

            console.log(body);
        });
    }

    function uploadToQiniu(settings, image, callback) {
        var mac = new qiniu.auth.digest.Mac(settings.qiniuAccessKey, settings.qiniuSecretKey);
        var options = {
            scope: settings.qiniuImgBucket
        };

        var putPolicy = new qiniu.rs.PutPolicy(options);
        var uploadToken = putPolicy.uploadToken(mac);
        var config = new qiniu.conf.Config();
        var formUploader = new qiniu.form_up.FormUploader(config);
        var putExtra = new qiniu.form_up.PutExtra();

        if (image instanceof ReadableStream) {
            formUploader.putStream(uploadToken, null, image, putExtra, function (err, body, info) {
                if (err) {
                    callback(err);
                }

                if (info.statusCode == 200) {
                    callback(null, body);
                }
                console.log(info);
            });
        }
    }

    var admin = {};

    admin.menu = function (menu, callback) {
        menu.plugins.push({
            route:'/plugins/qiniu-img',
            icon: 'fa-cloud-upload',
            name: 'qiniu-img'
        });

        callback(null, menu);
    };

    qiniuImg.admin = admin;
}(module.exports));
