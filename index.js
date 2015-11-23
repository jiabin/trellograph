// create application
var app = require('app');

// error handler
process.on('uncaughtException', function(err) {
  // get dialog
  var dialog = require('electron').dialog;
  // check dialog
  if (dialog) dialog.showErrorBox('An error occured', err.toString());
  // quit application
  if (app) return app.quit();
  // quit process
  process.exit(1);
});

// module dependencies
var path = require('path');
var pjson = require('./package.json');

// app components
var Menu = require('menu');
var Tray = require('tray');
var BrowserWindow = require('browser-window');
var NativeImage = require('native-image');

// report crashes to electron
require('crash-reporter').start();

// ui variables
var tray;
var windows = global.windows = {};

// on all windows closed
app.on('window-all-closed', function() {});
// on before quit
app.on('before-quit', function() {
  if (windows.main) windows.main.forceClose = true;
});
// on application ready
app.on('ready', function() {
  // hide dock
  app.dock.hide();
  // set application version
  app.setVersion(pjson.version);
  // create tray
  tray = new Tray(createTrayImage('inactive'));
  // set higlight mode
  tray.setHighlightMode(true);
  // set tray tooltip
  tray.setToolTip('Trellograph');
  // toggle main window
  tray.on('click', function() { windows.main.show(); });
  // set application menu
  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: app.getName(),
    submenu: [{
      label: 'About Trellograph',
      role: 'about'
    }, {
      type: 'separator'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function() { app.quit(); }
    }]
  }, {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'redo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]
  }, {
    label: 'View',
    submenu: [{
      label: 'Reload',
      accelerator: 'Command+R',
      click: function() { BrowserWindow.getFocusedWindow().reloadIgnoringCache(); }
    }, {
      label: 'Toggle DevTools',
      accelerator: 'Alt+Command+I',
      click: function() { BrowserWindow.getFocusedWindow().toggleDevTools(); }
    }]
  }, {
    label: 'Window',
    submenu: [{
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      selector: 'performMiniaturize:'
    }, {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      selector: 'performClose:'
    }, {
      type: 'separator'
    }, {
      label: 'Bring All to Front',
      selector: 'arrangeInFront:'
    }]
  }, {
    label: 'Help',
    submenu: [{
      label: 'Source Code',
      click: function() {
        require('shell').openExternal('https://github.com/jiabin/trellograph');
      }
    }, {
      label: 'Issues',
      click: function() {
        require('shell').openExternal('https://github.com/jiabin/trellograph/issues');
      }
    }, {
      label: 'Releases',
      click: function() {
        require('shell').openExternal('https://github.com/jiabin/trellograph/releases');
      }
    }]}
  ]));
  // create main window
  windows.main = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    center: true,
    resizable: false,
    fullscreen: false,
    experimentalFeatures: true
  });
  // on focus
  windows.main.on('focus', function(evt) {
    // show dock
    app.dock.show();
    // set badge
    if (windows.main.badge) {
      app.dock.setBadge(windows.main.badge);
    }
  });
  // on close
  windows.main.on('close', function(evt) {
    // check force close
    if (windows.main.forceClose) return true;
    // prevent event
    evt.preventDefault();
    // hide dock
    app.dock.hide();
    // hide main window
    windows.main.hide();
    // move on
    return false;
  });
  // load html
  windows.main.loadURL('file://' + __dirname + '/views/main.html');
});

// create tray image
var createTrayImage = function(type) {
  // create image path
  var imgPath = path.join(__dirname, 'assets/images/tray/osx/' + type + 'Template.png');
  // create image
  var img = NativeImage.createFromPath(imgPath);
  // move on
  return img;
};

// set tray image
global.setTrayImage = function(type, title) {
  // set img
  tray.setImage(createTrayImage(type));
  // set title
  tray.setTitle(title || '');
};
