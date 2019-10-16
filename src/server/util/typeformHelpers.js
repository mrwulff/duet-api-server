import errorHandler from './errorHandler.js';

// find question from array with a given Typeform question-reference
// use startsWith instead of ===, because there are multiple item-name-... questions for different categories
function getAnswerFromQuestionReference(questionReference, answers, type) {
  try {
    const answer = answers.find(answer => answer.field.ref.startsWith(questionReference));
    if (!answer) {
      // not found
      console.log("questionReference not found: " + questionReference);
      return null;
    }
    if (type === 'choice') {
      return answer.choice.label;
    } if (type === 'text') {
      return answer.text;
    } if (type === 'file') {
      return answer.file_url;
    } if (type === 'phone_number') {
      return answer.phone_number;
    } 
    throw new Error(`Unknown Typeform question type: ${type}`);
    
  } catch (err) {
    errorHandler.handleError(err, "typeformHelpers/getAnswerFromQuestionReference");
    throw err;
  }
}

// process raw price input, return a decimal value
function processPriceInput(origPrice) {
  var price = origPrice.trim();
  // Special case: 19€90 --> 19.90
  if (price.match(/\+?\d+[€,$][0-9]{2}$/g)) { // matches any number of digits, followed by $ or €, followed by 2 digits
    price = price.replace(/[€,$]/g, "."); // replace currency symbol with "."
  }
  price = price.replace(",", '.').replace(":", "."); // replace "," or ":" with "."
  price = price.replace(/[^\d.]/g, ''); // remove any remaining non-decimal characters
  return price;
}

export default {
  getAnswerFromQuestionReference,
  processPriceInput
}