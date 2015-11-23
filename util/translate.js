'use strict';

// module dependencies
var _ = require('lodash');

// translations map
var map = {
  notification_added_a_due_date: '<% print(memberCreator) %> added a due date to the card <% print(card) %> on <% print(board) %>',
  notification_added_attachment_to_card: '<% print(memberCreator) %> attached <% print(name) %> to <% print(card) %> on <% print(board) %> <% print(attachment) %>',
  notification_added_member_to_card: '<% print(memberCreator) %> added <% print(member) %> to <% print(card) %> on <% print(board) %>',
  notification_added_to_board: '<% print(memberCreator) %> added you to the board <% print(board) %>',
  notification_added_to_board_admin: '<% print(memberCreator) %> added you to the board <% print(board) %> as an admin',
  notification_added_to_board_confirm_email: '<% print(memberCreator) %> added you to the board <% print(board) %> Confirm your email addess to see it.',
  notification_added_to_board_observer: '<% print(memberCreator) %> added you to the board <% print(board) %> as an observer',
  notification_added_to_card: '<% print(memberCreator) %> added you to the card <% print(card) %> on <% print(board) %>',
  notification_added_to_organization: '<% print(memberCreator) %> added you to the team <% print(organization) %>',
  notification_added_to_organization_admin: '<% print(memberCreator) %> added you to the team <% print(organization) %> as an admin',
  notification_another_board: 'another board',
  notification_archived_card: '<% print(memberCreator) %> archived the card <% print(card) %> on <% print(board) %>',
  notification_archived_list: '<% print(memberCreator) %> archived the list <% print(list) %> on <% print(board) %>',
  notification_card_due_soon: '<% print(card) %> on <% print(board) %> <% print(due) %>',
  notification_changed_card: '<% print(memberCreator) %> changed the card <% print(card) %> on <% print(board) %>',
  notification_changed_due_date: '<% print(memberCreator) %> changed the due date on the card <% print(card) %> on <% print(board) %>',
  notification_changed_list: '<% print(memberCreator) %> changed the list <% print(list) %> on <% print(board) %>',
  notification_checkitem_complete: '<% print(memberCreator) %> checked <% print(checkitem) %> on <% print(card) %> on <% print(board) %>',
  notification_checkitem_incomplete: '<% print(memberCreator) %> unchecked <% print(checkitem) %> on <% print(card) %> on <% print(board) %>',
  notification_close_board: '<% print(memberCreator) %> closed the board <% print(board) %>',
  notification_comment_card: '<% print(memberCreator) %> commented on the card <% print(card) %> on <% print(board) %> <% print(comment) %>',
  notification_created_card: '<% print(memberCreator) %> created <% print(card) %> in <% print(list) %> on <% print(board) %>',
  notification_created_list: '<% print(memberCreator) %> created the list <% print(list) %> on <% print(board) %>',
  notification_declined_invitation_to_board: '<% print(name) %> (<% print(email) %>) declined your invitation to the board <% print(board) %>',
  notification_declined_invitation_to_organization: '<% print(name) %> (<% print(email) %>) declined your invitation to the team <% print(organization) %>',
  notification_deleted_account: '[deleted account]',
  notification_invited_to_board: '<% print(memberCreator) %> invited you to the board <% print(board) %>',
  notification_invited_to_organization: '<% print(memberCreator) %> invited you to the team <% print(organization) %>',
  notification_invited_to_organization_confirm_email: '<% print(memberCreator) %> invited you to the team <% print(organization) %> Confirm your email address to see it.',
  notification_is_due: 'is due <% print(period) %>',
  notification_joined_card: '<% print(memberCreator) %> joined the card <% print(card) %> on <% print(board) %>',
  notification_joined_trello_on_your_recommendation: '<% print(memberCreator) %> joined Trello on your recommendation.',
  notification_joined_trello_on_your_recommendation_earned_gold: '<% print(memberCreator) %> joined Trello on your recommendation. You earned a free month of Trello Gold!',
  notification_left_card: '<% print(memberCreator) %> left the card <% print(card) %> on <% print(board) %>',
  notification_made_admin_of_board: '<% print(memberCreator) %> made you an admin on the board <% print(board) %>',
  notification_made_admin_of_organization: '<% print(memberCreator) %> made you an admin of the team <% print(organization) %>',
  notification_mentioned_on_card: '<% print(memberCreator) %> mentioned you on the card <% print(card) %> on <% print(board) %> <% print(comment) %>',
  notification_moved_card: '<% print(memberCreator) %> moved the card <% print(card) %> to <% print(list) %> on <% print(board) %>',
  notification_removed_from_board: '<% print(memberCreator) %> removed you from the board <% print(board) %>',
  notification_removed_from_card: '<% print(memberCreator) %> removed you from the card <% print(card) %> on <% print(board) %>',
  notification_removed_from_organization: '<% print(memberCreator) %> removed you from the team <% print(organization) %>',
  notification_removed_member_from_card: '<% print(memberCreator) %> removed <% print(member) %> from <% print(card) %> on <% print(board) %>',
  notification_renamed_card: '<% print(memberCreator) %> renamed the card <% print(card) %> on <% print(board) %>',
  notification_unarchived_card: '<% print(memberCreator) %> unarchived the card <% print(card) %> on <% print(board) %>',
  notification_unarchived_list: '<% print(memberCreator) %> unarchived the list <% print(list) %> on <% print(board) %>',
  notification_updated_description_of_card: '<% print(memberCreator) %> updated the description of <% print(card) %> on <% print(board) %>',
  notification_was_due: 'was due <% print(period) %>',
};

// translate utility
module.exports = function translate(notification) {
  // initialize text and html
  notification.text = null;
  notification.html = null;
  // check display
  if (!notification.display) return;
  // check translation key
  if (!map[notification.display.translationKey]) return;
  // set template
  var template = map[notification.display.translationKey];
  // default translation
  notification.text = notification.html = template;
  // initialize template data
  var templateData = { text: {}, html: {} };
  // iterate entities
  Object.keys(notification.display.entities || {}).forEach(function(key) {
    // set entity
    var entity = notification.display.entities[key];
    // create text data
    templateData.text[key] = entity.text;
    // create html data
    var html;
    switch (key) {
      case 'card':
        html = '<a href="https://trello.com/c/' + entity.shortLink + '">' + entity.text + '</a>';
        break;
      case 'board':
        html = '<a href="https://trello.com/b/' + entity.shortLink + '">' + entity.text + '</a>';
        break;
      case 'memberCreator':
        html = '<a href="https://trello.com/#' + entity.username + '" style="text-decoration: none;"><strong>' + entity.text + '</strong></a>';
        break;
      default:
        html = '<abbr>"' + entity.text + '"</abbr>';
    }
    // set html data
    templateData.html[key] = html;
  });
  // compile template
  notification.text = _.template(template)(templateData.text);
  notification.html = _.template(template)(templateData.html);
  // move on
  return notification;
};
