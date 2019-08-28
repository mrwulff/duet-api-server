"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _errorHandler = _interopRequireDefault(require("./errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}

// find question from array with a given Typeform question-reference
// use startsWith instead of ===, because there are multiple item-name-... questions for different categories
function getAnswerFromQuestionReference(questionReference, answers, type) {
  try {
    var answer = answers.find(function (answer) {return answer.field.ref.startsWith(questionReference);});
    if (!answer) {
      // not found
      console.log("questionReference not found: " + questionReference);
      return null;
    }
    if (type === 'choice') {
      return answer.choice.label;
    } else if (type === 'text') {
      return answer.text;
    } else if (type === 'file') {
      return answer.file_url;
    } else if (type === 'phone_number') {
      return answer.phone_number;
    }
  } catch (err) {
    _errorHandler["default"].handleError(err, "typeformHelpers/getAnswerFromQuestionReference");
    throw err;
  }
}

// process raw price input, return a decimal value
function processPriceInput(origPrice) {
  var price = origPrice.trim();
  // Special case: 19€90 --> 19.90
  if (price.match(/\+?\d+[€,$][0-9]{2}$/g)) {// matches any number of digits, followed by $ or €, followed by 2 digits
    price = price.replace(/[€,$]/g, "."); // replace currency symbol with "."
  }
  price = price.replace(",", '.').replace(":", "."); // replace "," or ":" with "."
  price = price.replace(/[^\d.]/g, ''); // remove any remaining non-decimal characters
  return price;
}var _default =

{
  getAnswerFromQuestionReference: getAnswerFromQuestionReference,
  processPriceInput: processPriceInput };exports["default"] = _default;