"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;function sendConfirmationEmail(req, res) {
  var body = req.body;
  console.log(body);

  var sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  var msg = {
    to: body.email,
    from: 'duet.giving@gmail.com',
    subject: 'Sending with SendGrid is Fun',
    text: 'test',
    templateId: 'd-2780c6e3d4f3427ebd0b20bbbf2f8cfc',
    dynamic_template_data: {
      name: body.firstName } };



  sgMail.send(msg);
}var _default =

{ sendConfirmationEmail: sendConfirmationEmail };exports.default = _default;