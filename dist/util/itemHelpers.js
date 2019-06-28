"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;function generatePickupCode(itemId) {
  var code = "DUET-";
  var pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // append 2 random letters to code
  for (var i = 0; i < 2; i++) {
    code += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  // append item id
  code += itemId;
  return code;
}var _default =

{
  generatePickupCode: generatePickupCode };exports["default"] = _default;