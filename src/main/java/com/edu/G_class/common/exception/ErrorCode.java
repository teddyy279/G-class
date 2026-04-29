package com.edu.G_class.common.exception;


import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_EXISTED(1001, "USER ALREADY EXISTS", HttpStatus.BAD_REQUEST),
    INVALID_KEY(1002, "Invalid message key", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "USER NOT EXISTED", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZE(1007, "You do not have Permission", HttpStatus.FORBIDDEN),
    //INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST)
    EMAIL_EXISTED(1008, "EMAIL ALREADY EXISTS", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1009, "Invalid email format", HttpStatus.BAD_REQUEST),
    USERNAME_NOT_NULL(1010, "Username must not be empty", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_NULL(1011, "Email must not be empty", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_NULL(1012, "Password must not be empty", HttpStatus.BAD_REQUEST),
    FILE_IS_EMPTY(1013, "The uploaded file cannot be empty", HttpStatus.BAD_REQUEST),
    UPLOAD_FAILED(1014, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    OLD_PASSWORD_INCORRECT(1015, "password is incorrect", HttpStatus.BAD_REQUEST),
    OTP_TOO_MANY_REQUESTS(1016, "Please wait 60 seconds before requesting a new OTP", HttpStatus.TOO_MANY_REQUESTS),
    EXPIRED_OTP(1017, "OTP has expired, please request a new one", HttpStatus.BAD_REQUEST),
    INVALID_OTP(1018, "Invalid OTP code", HttpStatus.BAD_REQUEST),
    CLASS_NOT_FOUND(1019, "Class not found", HttpStatus.NOT_FOUND),
    ALREADY_IN_CLASS(1020, "User is already a member of this class", HttpStatus.BAD_REQUEST),
    OWNER_CANNOT_JOIN_OWN_CLASS(1021, "You are the owner of this class; you don't need to join with a code", HttpStatus.BAD_REQUEST),
    ALREADY_IN_CLASS_AS_TEACHER(1022, "You were the teacher of this class", HttpStatus.BAD_REQUEST),
    USER_ALREADY_IN_CLASS(1023, "The user is already in the class", HttpStatus.BAD_REQUEST),
    INVITATION_ALREADY_SENT(1024, "This email has already been used to invite you to the class!", HttpStatus.CONFLICT),
    INVITATION_ALREADY_USED(1025, "This invitation has already been used", HttpStatus.GONE),
    INVITATION_EXPIRED(1026, "The invitation has expired, please ask the teacher to send a new link!", HttpStatus.GONE),
    OWNER_CANNOT_LEAVE(1027, "The owner cannot leave their own classroom", HttpStatus.BAD_REQUEST),
    INVALID_YOUTUBE_URL(1028, "The YouTube link is invalid or not in the correct format", HttpStatus.BAD_REQUEST),
    UNSUPPORT_FILE_TYPE(1029, "This type of attachment is not currently supported on the system", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    POST_NOT_FOUND(1030, "The post does not exist", HttpStatus.NOT_FOUND),
    DATA_OUTDATED(1031, "The data has been changed by someone else, please refresh the page", HttpStatus.CONFLICT),
    INVALID_DATA(1032, "Invalid data", HttpStatus.BAD_REQUEST),
    TOPIC_NOT_FOUND(1033, "The topic does not exist", HttpStatus.NOT_FOUND),
    INVALID_TOPIC_FOR_CLASS(1034, "This topic is not part of the current class", HttpStatus.BAD_REQUEST),
    CLASSWORK_NOT_FOUND(1035, "Classwork not found", HttpStatus.NOT_FOUND),
    SUBMISSION_NOT_FOUND(1036, "Submission not found", HttpStatus.NOT_FOUND),
    SUBMISSION_ALREADY_GRADED(1037, "This submission has already been graded and returned", HttpStatus.BAD_REQUEST),
    CANNOT_GRADE_OWN_SUBMISSION(1038, "Teachers cannot grade their own submission", HttpStatus.BAD_REQUEST),
    NOT_A_STUDENT(1039, "Only students can submit assignments", HttpStatus.FORBIDDEN),
    COMMENT_NOT_FOUND(1040, "Comment not found", HttpStatus.NOT_FOUND),

    ;
    private int code;
    private String message;
    HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode){
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
