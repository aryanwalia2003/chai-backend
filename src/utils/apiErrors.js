class ApiError extends Error{ //extends error class to create a custom error class
    constructor( //constructor to initialize the error
        statusCode, //status code of the error comes from the parent class of error
        message="Something went wrong", //message of the error comes from the parent class of error
        errors=[], //array of errors comes from the parent class of error
        stack="" //stack trace of the error comes from the parent class of error

    ){
        super(message) //call the parent class constructor to set the message property
        this.statusCode=statusCode //set the status code property overwriting the parent class property to set the status code of the error
        this.data=null //set the data property to null
        this.message=message //set the message property to the message of the error
        this.success=false //set the success property to false
        this.errors=errors //set the errors property to the errors of the error
        
        if (stack) {
            this.stack=stack //hai toh dikha de
        }else{
            Error.captureStackTrace(this,this.constructor)//capture the stack trace of the error
        }
    }
}

export {ApiError}