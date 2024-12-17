class Logger {
  constructor() {
    this.messages = [];
  }

  /**
   * Add a general message to the log
   * @param {string} test The test name
   * @param {string} message The message to log
   */
  addMessage(test, message) {
    const msg = `${test}: ${message}`;
    console.debug(msg);
    this.messages.push(msg);
  }

  /**
   * Add a warning to the log in GitHub workflow format
   * @param {string} file The filename of the entry
   * @param {string} message The warning message
   * @param {string} [title="Warning"] A short description of the warning
   */
  addWarning(file, message, title = 'Warning') {
    const msg = `::warning file=${file},title=${title}::${message}`;
    console.debug(msg);
    this.messages.push(msg);
  }

  /**
   * Add an error to the log in GitHub workflow format
   * @param {string} file The filename of the entry
   * @param {string} message The error message
   * @param {string} [title="Error"] A short description of the error
   */
  addError(file, message, title = 'Error') {
    const msg = `::error file=${file},title=${title}::${message}`;
    console.error(msg);
    this.messages.push(msg);
  }

  /**
   * Retrieve all logged messages
   * @returns {string[]} An array of all logged messages
   */
  getMessages() {
    return this.messages;
  }

  /**
   * Clear all logged messages
   */
  clearMessages() {
    this.messages = [];
  }
}

// Create a singleton instance of Logger
const logger = new Logger();
export default logger;
