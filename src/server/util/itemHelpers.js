function generatePickupCode(itemId) {
    let code = "DUET-";
    let pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // append 2 random letters to code
    for (let i = 0; i < 2; i++) {
        code += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    // append item id
    code += itemId;
    return code;
}

export default {
    generatePickupCode
}