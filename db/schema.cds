using {cuid} from '@sap/cds/common';

namespace IMAPConfiguration;

// entity Organization {
//     key ID               : UUID   @mandatory;
//         organizationName : String @mandatory;
//         organizationType : String @mandatory;
//         emailId          : String @mandatory;
//         contactNo        : Int64  @mandatory;
//         address          : String @mandatory;
//         // Composition of many Administrators
//         administrators   : Composition of many Administrator
//                                on administrators.organization = $self;
// }

// entity Administrator {
//     key ID                 : UUID   @mandatory;
//         userName           : String @mandatory;
//         emailId            : String @mandatory;
//         userId             : String @mandatory;
//         password           : String @mandatory;
//         // Association to one Organization
//                 : Association to Organization;
//         // Association to one EmailConfiguration
//         emailConfiguration : Composition of many EmailConfiguration
//                                  on emailConfiguration.administrator = $self;
// }

entity EmailConfiguration : cuid {
  key ID                   : UUID;
      fullName             : String  @mandatory;
  key emailId              : String  @mandatory  @assert.unique;
      password             : String  @mandatory;
      protocol             : String  @mandatory;
      authenticationMethod : String  @mandatory;
      port                 : Integer @mandatory;
      connectionSecurity   : String  @mandatory;
      hostName             : String  @mandatory;
      pollingFrequency     : Integer @mandatory;
      keywords             : array of String;
      markRead             : Boolean;
}




// file: LargeBinary @Core.MediaType: fileType @Core.ContentDisposition.Filename: fileName;
