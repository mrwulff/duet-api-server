import errorHandler from './errorHandler.js';

// find question from array with a given Typeform question-reference
  // use startsWith instead of ===, because there are multiple item-name-... questions for different categories
function getAnswerFromQuestionReference(questionReference, answers, type) {
  try {
    let answer = answers.find(answer => answer.field.ref.startsWith(questionReference));
    if (!answer) {
      // not found
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
    errorHandler.handleError(err, "typeformHelpers/getAnswerFromQuestionReference");
  }
}

export default {
  getAnswerFromQuestionReference
}