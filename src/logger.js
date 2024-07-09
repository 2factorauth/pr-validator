class Logger {
	constructor() {
		this.messages = [];
	}

	addMessage(test, message) {
		const msg = `${test}: ${message}`;
		console.debug(msg);
		this.messages.push(msg);
	}

	/**
	 * Add a warning to the log using [GitHub workflow commands](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions)
	 * @param {string} file The filename of the entry
	 * @param {string} message The message to be written to the log
	 */
	addWarning(file, message) {
		const msg = `::warning file=${file}:: ${message}`;
		console.debug(msg);
		this.messages.push(msg);
	}

	getMessages() {
		return this.messages;
	}

	clearMessages() {
		this.messages = [];
	}
}

// Create a singleton instance of Logger
const logger = new Logger();
export default logger;
