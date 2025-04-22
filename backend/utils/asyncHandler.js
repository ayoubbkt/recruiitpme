/**
 * Wrapper function to handle asynchronous errors in Express routes
 * Eliminates the need for try/catch blocks in controllers
 * 
 * @param {Function} fn - The async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = asyncHandler;