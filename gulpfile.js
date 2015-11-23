'use strict';

// module dependencies
var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var packager = require('electron-packager');
var appdmg = require('appdmg');
var config = require('./config');
var pjson = require('./package.json');

// build task
gulp.task('build', function(done) {
  // set name
  var name = 'Trellograph';
  // package
  return packager({
    dir: __dirname,
    name: name,
    platform: 'darwin',
    arch: 'x64',
    version: '0.35.1',
    ignore: /build/,
    out: 'build',
    overwrite: true,
    icon: path.join(__dirname, 'assets/icon/osx.icns')
  }, function(err, appPath) {
    // error handler
    if (err) return done(err);
    // write dotenv file
    fs.writeFileSync(path.join(appPath[0], pjson.name + '.app', 'Contents/Resources/app/.env'), 'API_KEY=' + config.get('key') + '\nNODE_ENV=production');
    // delete files
    fs.unlinkSync(path.join(appPath[0], 'LICENSE'));
    fs.unlinkSync(path.join(appPath[0], 'LICENSES.chromium.html'));
    fs.unlinkSync(path.join(appPath[0], 'version'));
    // change trellograph icon
    fs.unlinkSync(path.join(appPath[0], pjson.name + '.app', 'Contents/Resources/atom.icns'));
    fs.createReadStream(path.join(__dirname, 'assets/images/icon/osx.icns')).pipe(fs.createWriteStream(path.join(appPath[0], pjson.name + '.app', 'Contents/Resources/atom.icns')));
    // create dmg
    var ee = appdmg({
      target: path.join(appPath[0], name + '.dmg'),
      basepath: appPath[0],
      specification: {
        'title': name,
        'background': '../../assets/images/background/dmg.png',
        'icon-size': 80,
        'contents': [
          { 'x': 448, 'y': 344, 'type': 'link', 'path': '/Applications' },
          { 'x': 192, 'y': 344, 'type': 'file', 'path': name + '.app' },
        ]
      }
    });
    // on finish
    ee.on('finish', function () {
      return done();
    });
    // on error
    ee.on('error', function (err) {
      return done(err);
    });
  });
});
