onload = function() {
  // set href
  var href = window.location.href;
  // check if login completed
  if (href === 'https://trello.com/1/token/approve') {
    // extract token
    var token = document.getElementsByTagName('pre')[0].innerHTML.replace(/\s/g, '');
    // get windows
    var windows = require('remote').getGlobal('windows');
    // send token
    windows.main.send('token', token);
    // move on
    return;
  }
};
