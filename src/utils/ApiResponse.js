class ApiResponse {
    constructor(message, statusCode, data = null, errors = []) {
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
        this.errors = errors;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };