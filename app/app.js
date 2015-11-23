'use strict';

// module dependencies
var remote = require('remote');
var config = require('../config');
var url = require('url');
var path = require('path');
var ipc = require('ipc');
var _ = require('lodash');
var moment = require('moment');
var translate = require('../util/translate');
var pjson = require('../package.json');

// get from remote
var BrowserWindow = remote.require('browser-window');
var windows = remote.getGlobal('windows');

// initialize storage
var storage = require('node-persist');
storage.initSync({ dir: path.join(config.get('home'), '.' + pjson.name + '.db') });

// initialize angular app
var app = angular.module('trellograph', []);

// compile directive
app.directive('compile', function($compile) {
  return {
    restrict: 'A',
    link: function(scope, elem, attr) {
      scope.$watch(function(scope) {
        return scope.$eval(attr.compile);
      }, function(val) {
        elem.html(val);
        $compile(elem.contents())(scope);
      });
    }
  };
});

// external href directive
app.directive('a', function() {
  return {
    restrict: 'E',
    link: function(scope, elem, attr) {
      // check href
      if (!attr.href || attr.href.indexOf('http') !== 0) return;
      // intercept on click
      elem.on('click', function(evt) {
        // prevent default
        evt.preventDefault();
        // ensure browser window exists
        if (!windows.browser) {
          // create browser window
          windows.browser = new BrowserWindow({
            width: 1000,
            height: 650,
            show: false,
            resizable: true,
            title: 'Trellograph',
            'node-integration': false
          });
          // on browser window close
          windows.browser.on('closed', function() {
            // reset browser
            windows.browser = null;
          });
        }
        // load url
        windows.browser.loadURL(elem.attr('href'));
        // show browser window
        windows.browser.show();
        // move on
        return false;
      });
    }
  };
});

// controller
app.controller('main', function($scope, $http, $timeout, $sce) {
  // initialize variables
  $scope.key           = config.get('key');
  $scope.pjson         = pjson;
  $scope.loading       = false;
  $scope.notifications = [];
  $scope.user          = storage.getItem('user') || null;
  $scope.state         = storage.getItem('state') || 'login';
  $scope.timeout       = null;
  $scope.connections   = 0;
  $scope.interval      = 30000;
  $scope.moment        = moment;

  // watch state changes
  $scope.$watch('state', function(state) {
    // check state
    if ($scope.user && state === 'login') $scope.state = 'notifications';
    if (!$scope.user && ['notifications', 'profile'].indexOf(state) !== -1) $scope.state = 'login';
    // save state
    storage.setItem('state', state);
  });

  // watch user changes
  $scope.$watch('user', function(user, oldUser) {
    // save user
    storage.setItem('user', user);
  }, true);

  // connect user
  $scope.connect = function(user, splash) {
    // check user
    if (!user) return;
    // loading
    if (splash) $scope.loading = true;
    // load notifications
    $http({
      method: 'GET',
      url: url.format({
        protocol: 'https',
        host: 'api.trello.com',
        pathname: '/1/members/' + $scope.user.id + '/notifications',
        query: {
          key: $scope.key,
          token: $scope.user.token,
          read_filter: 'unread',
          display: true
        }
      })
    }).then(function(res) {
      // initialize new notifications
      var newNotifications = [];
      // iterate data
      (res.data || []).forEach(function(notification) {
        // check if already exists
        if (_.find($scope.notifications, { id: notification.id })) return;
        // translate notification
        translate(notification);
        // prepend notification
        $scope.notifications.push(notification);
        // push into new notifications
        newNotifications.push(notification);
      });
      // check new notifications length
      if (newNotifications.length && $scope.connections > 0 && windows.main.isVisible() === false) {
        // set body message
        var body = newNotifications.length === 1 ? newNotifications[0].text : 'You have ' + newNotifications.length + ' new notifications';
        // create new html notification
        var notification = new Notification('Trellograph', { body: body });
        notification.onclick = function() {
          // change state
          $scope.state = 'notifications';
          // show main window
          windows.main.show();
        };
      }
      // set tray image
      remote.getGlobal('setTrayImage')('active', $scope.notifications.length ? $scope.notifications.length + ' unread' : null);
      // loading
      if (splash) $scope.loading = false;
      // increment connections
      $scope.connections++;
      // cancel existing timeout
      if ($scope.timeout) $timeout.cancel($scope.timeout);
      // set timeout
      $scope.timeout = $timeout(function() {
        $scope.connect(user);
      }, $scope.interval);
    }, function(res) {
      // error handler
      if (res.status === 401) {
        var msg = 'Your access token is expired or revoked. You must log in again!';
        // check main window visibility
        if (windows.main.isVisible()) {
          alert(msg);
        } else {
          // notification
          var notification = new Notification('Trellograph', { body: msg });
          // on notification click
          notification.onclick = function() {
            // show main window
            windows.main.show();
          };
        }
        // logout
        $scope.logout();
        // loading
        if (splash) $scope.loading = false;
      }
    });
  };

  // check existing user
  if ($scope.user) {
    $scope.connect($scope.user);
  } else {
    windows.main.show();
  }

  // listen token from login window
  ipc.on('token', function(token) {
    // log message
    console.log('got token %s', token);
    // close login window
    if (windows.login) windows.login.close();
    // show main window
    windows.main.show();
    // show loading
    $scope.$apply(function() { $scope.loading = true; });
    // get member
    $http({
      method: 'GET',
      url: url.format({
        protocol: 'https',
        host: 'api.trello.com',
        pathname: '/1/tokens/' + token + '/member',
        query: {
          key: $scope.key,
          token: token
        }
      })
    }).then(function(res) {
      // set token
      res.data.token = token;
      // set user
      $scope.user = res.data;
      // change state
      $scope.state = 'profile';
      // hide loading
      $scope.loading = false;
      // connect user
      $scope.connect($scope.user);
    }, function(res) {
      // hide loading
      $scope.loading = false;
    });
  });

  // login
  $scope.login = function() {
    // check existing login window
    if (windows.login) return windows.login.show();
    // hide main window
    if (windows.main) windows.main.hide();
    // create login window
    windows.login = new BrowserWindow({
      width: 1000,
      height: 650,
      show: false,
      title: 'Trellograph',
      resizable: false,
      fullscreen: false
    });
    // on closed
    windows.login.on('closed', function() {
      // reset win
      windows.login = null;
      // show main window
      windows.main.show();
    });
    // load url
    windows.login.loadURL('file://' + __dirname + '/../views/login.html');
    // show window
    windows.login.show();
  };

  // logout
  $scope.logout = function() {
    // reset user
    $scope.user = null;
    // reset notifications
    $scope.notifications = [];
    // change state
    $scope.state = 'login';
    // set tray image
    remote.getGlobal('setTrayImage')('inactive');
    // reset timeout
    if ($scope.timeout) $timeout.cancel($scope.timeout);
  };

  // mark as read
  $scope.markAsRead = function() {
    // show loading
    $scope.loading = true;
    // send api request
    $http({
      method: 'POST',
      url: url.format({
        protocol: 'https',
        host: 'api.trello.com',
        pathname: '/1/notifications/all/read',
        query: {
          key: $scope.key,
          token: $scope.user.token,
        }
      })
    }).then(function() {
      // reset notifications
      $scope.notifications = [];
      // set tray image
      remote.getGlobal('setTrayImage')('active');
      // hide loading
      $scope.loading = false;
    }, function(res) {
      // alert
      alert('An error occured while marking notifications as read. Please try again!');
      // hide loading
      $scope.loading = false;
    });
  };

  // check update
  $scope.checkUpdate = function() {
    alert('Auto-update is not yet available!');
  };
});
