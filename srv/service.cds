using {IMAPConfiguration as IC} from '../db/schema';

service MailReader {
    // entity Organization as projection on IC.Organization;
    // entity Administrator as projection on IC.Administrator;
    entity EmailConfiguration as projection on IC.EmailConfiguration;
    // entity Attachments        as projection on IC.Attachments;

   
    entity SelectedMail {
        key useremail : String;
            password  : String;
            protocol  : String;
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
            body            : String;
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
   entity Test {
    key ID        : UUID;          // Unique identifier for the record
    formData      : LargeString;        // Binary data for the uploaded file
          
}

}