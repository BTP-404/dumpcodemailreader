const cds = require('@sap/cds');
const Imap = require('imap');
const { simpleParser } = require("mailparser");
const { v4: uuidv4 } = require('uuid');
const bcrypt=require('bcrypt');


//Globally Definining start and end time of email processing.
let startTime;
let endTime;
let errorLogs = [];

module.exports = cds.service.impl(async function () {
    try {
        const { SelectedMail, EmailData, EmailConfiguration,Attachments, Logs ,Test} = this.entities;
        this.after('CREATE', Test, async (req) => {
            try {
                const formData = req.formData; // Assuming this contains the necessary data
        
                // Create a Blob from the formData (if it's a base64 string)
                const byteCharacters = atob(formData); // Decode the base64 string
                const byteNumbers = new Uint8Array(byteCharacters.length);
                
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                
                const blob = new Blob([byteNumbers], { type: 'application/octet-stream' });
        
                // Connect to the API
                const api = await cds.connect.to('apiName');
        
                // Step 1: Retrieve CSRF token
                // const csrfResponse = await api.send({
                //     method: 'GET',
                //     path: '/document/jobs'
                // });
                // console.log(csrfResponse)
        
                //const csrfToken = csrfResponse.headers['x-csrf-token'];
        
                // Step 2: Send the Blob data
                const response = await api.send({
                    method: 'POST',
                    path: 'http/OCR01?query=msme',
                    data: blob,
                    // headers: {
                    //     'X-CSRF-Token': csrfToken // Include the CSRF token
                    // }
                });
        
                console.log(response);
            } catch (error) {
                console.error('Error processing CREATE:', error);
            }
        });
        
        
        this.after('CREATE',EmailConfiguration,async(req,res)=>{
            let password=req.password;
            const salt = await bcrypt.genSalt(12);
            const hash=await bcrypt.hash(password,salt);
           
            await cds.run(UPDATE(EmailConfiguration).set({password:hash}).where({ID:req.ID}));
           
        })
       
        this.after('CREATE', SelectedMail, async (req, res) => {
           await  cds.run(DELETE.from(EmailData));
            const imap = new Imap({
                user: req.useremail,
                password: req.password,
                host: req.host,
                port: req.port,
                tls: true,
                keywords: req.keywords,
                markRead: req.markRead,
            });
            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
            //......................................................................................
            //Keywords
            const Keywords = req.keywords;
            const lowerCaseKeywords = Keywords.map((str) => str.toLowerCase());
            //Creating array storage for all mails.
            let emailData_arr = [];
            imap.once("ready", () => {

                imap.openBox("INBOX", true, (err, box) => {
                    if (err) throw err;

                    //assigning start time.
                    let utcStartDate = new Date();
                    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 in milliseconds
                    startTime = new Date(utcStartDate.getTime() + istOffset); //datetime in ist format

                    console.log("START--------------------");

                    // Search for all emails
                    imap.search(["ALL"], (err, results) => {
                        if (err) throw err;

                        if (results.length === 0) {
                            console.log("No emails found.");
                            imap.end();
                            return;
                        }

                        //Pulling latest 100 mails
                        const latestResults = results.slice(-100);
                        // Fetching emails
                        const f = imap.fetch(latestResults, { bodies: "" });

                        f.on("message", async (msg, seqno) => {
                            //Creating storage for a single mail data and its attachments.
                            let attachment_arr = [];
                            let emailData_obj = {};
                            msg.on("body", async (stream, info) => {
                                const email = await simpleParser(stream);
                                if (Keywords.length == 0) {
                                    //process all mails............
                                    await createEmailDataPayload(
                                        email,
                                        attachment_arr,
                                        emailData_obj,
                                        emailData_arr,
                                        EmailData
                                    );
                                }
                                else {
                                    //process mails having keywords in their subject
                                    let presentFlag = false;
                                    if (email.subject != null) {
                                        let subject_arr = email.subject.split(" ");
                                        subject_arr.forEach((ele) => {
                                            let lowerCaseElement = ele.toLowerCase();
                                            if (lowerCaseKeywords.includes(lowerCaseElement)) {
                                                presentFlag = true;
                                            }
                                        });
                                    }
                                    //if presentFlag=true proceed for email processing
                                    if (presentFlag == true) {
                                        await createEmailDataPayload(
                                            email,
                                            attachment_arr,
                                            emailData_obj,
                                            emailData_arr,
                                            EmailData
                                        );
                                    }
                                }
                            });
                        });

                        f.once("end", async () => {

                            console.log("Done fetching all messages!");

                            imap.end();
                        });
                    });
                });
            });

            imap.once("error", (err) => {
                console.log(err);
            });

            imap.once("end", async () => {
                console.log("ARRAY->", emailData_arr.length);
                //assigning end time.
                let utcEndDate = new Date();
                const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 in milliseconds
                endTime = new Date(utcEndDate.getTime() + istOffset); //datetime in ist format
                console.log("TIME TAKEN: ", (endTime - startTime) / 1000, " seconds");
                //creating payload for logs.
                let log = {
                    ID: uuidv4(),
                    selectedMail: req.useremail,
                    startTime: startTime.toISOString().split("T")[1].split(".")[0],
                    endTime: endTime.toISOString().split("T")[1].split(".")[0],
                    timeTaken: (endTime - startTime) / 1000 + " Seconds",
                    noOfEmailRead: emailData_arr.length,
                    errors: errorLogs
                }
               await cds.run(INSERT.into(Logs).entries(log));
                console.log("Connection ended");
            });

            // Start the IMAP connection
            imap.connect();

        })
    }
    catch (error) {
        console.log(error);
        errorLogs.push(error.message);
    }
});

//CreateEmailDataPayload function..................................................................
async function createEmailDataPayload(
    email,
    attachment_arr,
    emailData_obj,
    emailData_arr,
    EmailData
) {
    try {
        console.log(`Email subject: ${email.subject}`);
        // Process attachments
        if (email.attachments.length == 0) {
            console.log("No attachment found");
        } else if (email.attachments.length > 0) {
            email.attachments.forEach((attachment) => {
                if (
                    attachment.contentType == "image/png" ||
                    attachment.contentType == "application/pdf" ||
                    attachment.contentType == "image/jpeg"
                ) {
                    //converting and filtering attachment data to base 64 string.
                    const base64String = attachment.content.toString("base64");
                    const filteredBase64String = base64String.replace(/[\r\n]+/g, "");
                    //Creating Attachment object
                    let attachment_obj = {
                        ID: uuidv4(),
                        fileName: attachment.filename,
                        encoding: "BASE64",
                        fileType: attachment.contentType,
                        size: attachment.size,
                        file: filteredBase64String,
                    };
                    //pushing Attachment object data to Attchment array
                    attachment_arr.push(attachment_obj);

                    console.log(`Saved attachment: ${attachment.filename}`);
                }
            });
        }
        console.log("ATTACHMENT ARRAY LENGTH-->", attachment_arr.length);
        //creating EmailData Payload if only the attachment array is non-empty.
        if (attachment_arr.length > 0) {
            //decoding email html body before creating payload.
            let email_body_encoded=email.html.toString();
            let email_body_decoded= email_body_encoded.replace(/\\u003C/g, '<').replace(/\\u003E/g, '>');
            emailData_obj = {
                ID: uuidv4(),
                date: email.date.toISOString().split("T")[0],
                time: email.date.toISOString().split("T")[1].split(".")[0],
                subject: email.subject,
                sender: email.from.text,
                receiver: email.to?.text,
                body:email_body_decoded,
                noOfAttachments: attachment_arr.length,
                attachments: attachment_arr,
            };

            // console.log("EMAIL PAYLOAD ->", emailData);
            await cds.run(INSERT.into(EmailData).entries(emailData_obj));
            emailData_arr.push(emailData_obj);
        }
    } catch (error) {
        console.log(error);
        errorLogs.push(error.message);
    }
}