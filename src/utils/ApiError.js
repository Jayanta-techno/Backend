class ApiError extends Error{
    constructor(message="Api handling invalid ", statusCode,errors=[],stack="")
    {
        super(message);
        this.statusCode = statusCode;
        this.errors=errors;
        this.data=null;
        this.message;
        this.success=false;

        if(stack){
            this.stack=stack;
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError};