"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("middleware",{

/***/ "(middleware)/./src/db/index.ts":
/*!*************************!*\
  !*** ./src/db/index.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   db: () => (/* binding */ db)\n/* harmony export */ });\n/* harmony import */ var drizzle_orm_postgres_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! drizzle-orm/postgres-js */ \"(middleware)/../../node_modules/.pnpm/drizzle-orm@0.45.2_postgres@3.4.9/node_modules/drizzle-orm/postgres-js/driver.js\");\n/* harmony import */ var postgres__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! postgres */ \"(middleware)/../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js\");\n/* harmony import */ var _schema__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./schema */ \"(middleware)/./src/db/schema.ts\");\n\n\n\nconst connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;\nif (!connectionString) {\n    throw new Error(\"DATABASE_URL or DIRECT_URL is required\");\n}\nconst client = (0,postgres__WEBPACK_IMPORTED_MODULE_0__[\"default\"])(connectionString, {\n    max: 1,\n    prepare: false\n});\nconst db = (0,drizzle_orm_postgres_js__WEBPACK_IMPORTED_MODULE_2__.drizzle)(client, {\n    schema: _schema__WEBPACK_IMPORTED_MODULE_1__\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vc3JjL2RiL2luZGV4LnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBa0Q7QUFDbEI7QUFDRztBQUVuQyxNQUFNRyxtQkFBbUJDLFFBQVFDLEdBQUcsQ0FBQ0MsWUFBWSxJQUFJRixRQUFRQyxHQUFHLENBQUNFLFVBQVU7QUFFM0UsSUFBSSxDQUFDSixrQkFBa0I7SUFDckIsTUFBTSxJQUFJSyxNQUFNO0FBQ2xCO0FBRUEsTUFBTUMsU0FBU1Isb0RBQVFBLENBQUNFLGtCQUFrQjtJQUN4Q08sS0FBSztJQUNMQyxTQUFTO0FBQ1g7QUFFTyxNQUFNQyxLQUFLWixnRUFBT0EsQ0FBQ1MsUUFBUTtJQUFFUCxNQUFNQSxzQ0FBQUE7QUFBQyxHQUFHIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vX05fRS8uL3NyYy9kYi9pbmRleC50cz9kYWM2Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRyaXp6bGUgfSBmcm9tIFwiZHJpenpsZS1vcm0vcG9zdGdyZXMtanNcIjtcbmltcG9ydCBwb3N0Z3JlcyBmcm9tIFwicG9zdGdyZXNcIjtcbmltcG9ydCAqIGFzIHNjaGVtYSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuY29uc3QgY29ubmVjdGlvblN0cmluZyA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCA/PyBwcm9jZXNzLmVudi5ESVJFQ1RfVVJMO1xuXG5pZiAoIWNvbm5lY3Rpb25TdHJpbmcpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiREFUQUJBU0VfVVJMIG9yIERJUkVDVF9VUkwgaXMgcmVxdWlyZWRcIik7XG59XG5cbmNvbnN0IGNsaWVudCA9IHBvc3RncmVzKGNvbm5lY3Rpb25TdHJpbmcsIHtcbiAgbWF4OiAxLFxuICBwcmVwYXJlOiBmYWxzZVxufSk7XG5cbmV4cG9ydCBjb25zdCBkYiA9IGRyaXp6bGUoY2xpZW50LCB7IHNjaGVtYSB9KTtcbiJdLCJuYW1lcyI6WyJkcml6emxlIiwicG9zdGdyZXMiLCJzY2hlbWEiLCJjb25uZWN0aW9uU3RyaW5nIiwicHJvY2VzcyIsImVudiIsIkRBVEFCQVNFX1VSTCIsIkRJUkVDVF9VUkwiLCJFcnJvciIsImNsaWVudCIsIm1heCIsInByZXBhcmUiLCJkYiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(middleware)/./src/db/index.ts\n");

/***/ })

});