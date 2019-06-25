// Standard error handler
// TODO: send an email to duet.giving@gmail.com
function handleError(err, functionName) {
    if (functionName) {
        console.log("Error in " + functionName + ": " + err);
    }
    else {
        console.log(err);
    }
};

export default {
    handleError
};