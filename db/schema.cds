using {cuid} from '@sap/cds/common';

namespace IMAPConfiguration;

entity User {

        userName : String  @mandatory;
    key emailId  : String  @mandatory;
        password : String  @mandatory;
        isAdmin  : Boolean @mandatory;

}

entity EmailConfiguration : cuid {
    key ID                   : UUID;
        fullName             : String  @mandatory;
    key emailId              : String  @mandatory  @assert.unique;
        password             : String  @mandatory;
        port                 : Integer @mandatory;
        hostName             : String  @mandatory;
        connectionSecurity   :String   @mandatory;
        pollingFrequency     : Int64 ;
        keywords             : array of String;
        markRead             : Boolean;
}


entity OcrDocInfo {
    key id           : String;
        status       : String;
        fileName     : String;
        documentType : String;
        fileType     : String;
        receivedDate : DateTime;
}

entity OcrHeaderFields {
    key ID         : UUID;
        ocrdocinfo : Association to one OcrDocInfo;
        name       : String;
        value      : String;
        rawValue   : String;
        confidence : Double;
        page       : Int16;
        label      : String;
        model      : String;
        x          : Double;
        y          : Double;
        w          : Double;
        h          : Double;


}

entity OcrLineItems {
    key ID         : UUID;
        ocrdocinfo : Association to one OcrDocInfo;
        name       : String;
        value      : String;
        rawValue   : String;
        confidence : Double;
        page       : Int16;
        label      : String;
        model      : String;
        x          : Double;
        y          : Double;
        w          : Double;
        h          : Double;


}
