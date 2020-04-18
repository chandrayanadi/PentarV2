//Helper function to validate email

const isEmpty = (string) => {
    if(string.trim() === '') {
        return true;
    }
    else {
        return false;
    }
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(emailRegEx)){
        return true;
    }
    else {
        return false;
    }
}

exports.validateSignupData = (data) => {

    let errors = {}

    //Validate Email

    if(isEmpty(data.email)){
        errors.email = 'Must not be empty'
    } else if(!isEmail(data.email)){
        errors.email = 'Must be a valid email'
    }

    //Validate Password

    if(isEmpty(data.password)){
        errors.password = 'Cannot be empty'
    }

    //Validate ConfirmPassword

    if(data.confirmPassword !== data.password){
        errors.confirmPassword = 'Please ensure that both passwords match'
    }

    //Validate Handle

    if(isEmpty(data.handle)){
        errors.handle = 'Must not be empty'
    }

    //Ensure no errors

    return{
        errors,
        valid: Object.keys(errors).length === 0 ? true: false
    }
}

exports.validateLoginData = (data) => {
    let errors = {}

    //Validate Email

    if(isEmpty(data.email)){
        errors.email = 'Must not be empty'
    } else if(!isEmail(data.email)){
        errors.email = 'Must be a valid email'
    }

    //Validate Password

    if(isEmpty(data.password)){
        errors.password = 'Cannot be empty'
    }

    //Ensure no errors

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }

}