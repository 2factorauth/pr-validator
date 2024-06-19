class Logger {
	constructor() {
		this.messages = [];
	}

	addMessage(test, message) {
		const msg = `${test}: ${message}`;
		console.debug(msg);
		this.messages.push(msg);
	}

	addWarning(file, message) {
		const msg = `::warning file=${file}:: ${message}`;
		console.debug(msg);
		this.messages.push(msg);
	}

	getMessages() {
		return this.messages;
	}
}

// Create a singleton instance of Logger
const logger = new Logger();
export default logger;
