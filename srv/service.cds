using {IMAPConfiguration as IC} from '../db/schema';

service MailReader {
    // entity Organization as projection on IC.Organization;
    // entity Administrator as projection on IC.Administrator;
    entity EmailConfiguration as projection on IC.EmailConfiguration;
    entity OcrDocInfo         as projection on IC.OcrDocInfo;
    entity OcrHeaderFields    as projection on IC.OcrHeaderFields;
    entity OcrLineItems       as projection on IC.OcrLineItems;
    entity User               as projection on IC.User;
    action signup(userName : String, emailId : String, password : String, isAdmin : Boolean) returns String;
    action login(emailId : String, password : String)                                        returns String ;
    action cleardb()  returns String;

    entity SelectedMail {
        key useremail : String;
            password  : String;
            host      : String;
            port      : Integer;
            tls       : Boolean;
            keywords  : array of String;
            markRead  : Boolean;
    }


    entity EmailData {
        key ID              : UUID;
            sender          : String;
            receiver        : String;
            subject         : String;
            date            : Date;
            body            : LargeString;
            time            : Time;
            noOfAttachments : Integer;
            attachments     : Composition of many Attachments
                                  on attachments.emaildata = $self;
    }


    entity Logs {
        key ID            : UUID;
            selectedMail  : String;
            startTime     : String;
            endTime       : String;
            timeTaken     : String;
            noOfEmailRead : Integer;
            errors        : array of String;
    }


    entity Attachments {
        key ID        : UUID;
            emaildata : Association to one EmailData; // Reference to the email using Id
            fileName  : String;
            fileType  : String;
            file      : LargeString;
            size      : Integer;
            encoding  : String;
    }

    entity OCRProcess {
        key ID       : UUID; // Unique identifier for the record
            formData : LargeString;
            fileType : String;
            fileName : String;

    }

}
