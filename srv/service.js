const cds = require('@sap/cds');
const Imap = require('imap');
const { simpleParser } = require("mailparser");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path')
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client')
const core = require('@sap-cloud-sdk/core')
const axios = require('axios')
const FormData = require("form-data")


//Globally Definining start and end time of email processing.
let startTime;
let endTime;
let errorLogs = [];

module.exports = cds.service.impl(async function () {
    try {
        const { SelectedMail, EmailData, EmailConfiguration, Attachments, Logs, OCRProcess, OcrDocInfo, OcrHeaderFields, OcrLineItems } = this.entities;
        this.after('CREATE', OCRProcess, async (req) => {
            try {
                const formData1 = req.formData;
                const blob1 = Buffer.from(formData1, 'base64');
                console.log("Blob", blob1)


                const api = await cds.connect.to('apiName');

                //step 1 - getting token
                const token_response = await axios.get('https://920f6c81trial.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials',
                    {
                        auth: {
                            username: 'sb-05474d91-853f-466b-8249-26056e15d00e!b339870|dox-xsuaa-std-trial!b10844',
                            password: 'c31ec77c-15b1-49ca-a74e-c820eab0bacc$LLkjOJflyTokn_9gT8mfdMa_SSlECNXxQN_Grh8HBBk='
                        }
                    }
                )
                const token = `Bearer ${token_response.data.access_token}`
                console.log("TOKEN-->", token);

                //Getting clients
                // const token1 = 'Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vOTIwZjZjODF0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMDgxY2JhMjE2ZiIsInR5cCI6IkpXVCIsImppZCI6ICIzai9MblViM1BaQjk0QjFNM25iSzRDZ1VQYW56d1NtQ0lTUDh5VC9UTlo0PSJ9.eyJqdGkiOiJjMGFmYjFkYTVhNDA0YmY4Yjk2ZmMwZjBmNjgxZGZmMyIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiJiYTZmNDQyYS0wYzNmLTRhMWQtYjI3ZC05NTg3YmQ0NjBlZGEiLCJ6ZG4iOiI5MjBmNmM4MXRyaWFsIiwic2VydmljZWluc3RhbmNlaWQiOiIwNTQ3NGQ5MS04NTNmLTQ2NmItODI0OS0yNjA1NmUxNWQwMGUifSwic3ViIjoic2ItMDU0NzRkOTEtODUzZi00NjZiLTgyNDktMjYwNTZlMTVkMDBlIWIzMzk4NzB8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJhdXRob3JpdGllcyI6WyJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5zY2hlbWEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kb2N1bWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLnJlYWQiLCJ1YWEucmVzb3VyY2UiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5ydWxlcy53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS1leHBvcnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmlkZW50aWZpZXIud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZWNobmljYWxzY29wZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNvbmZpZy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLnJlYWQiXSwic2NvcGUiOlsiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuaWRlbnRpZmllci5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZS5yZWFkIiwidWFhLnJlc291cmNlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQucnVsZXMud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRvY3VtZW50LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLWV4cG9ydC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudHJhaW5pbmctZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnNjaGVtYS5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudGVjaG5pY2Fsc2NvcGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNhcGFiaWxpdGllcy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudHJhaW5pbmctZGF0YS5yZWFkIl0sImNsaWVudF9pZCI6InNiLTA1NDc0ZDkxLTg1M2YtNDY2Yi04MjQ5LTI2MDU2ZTE1ZDAwZSFiMzM5ODcwfGRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0IiwiY2lkIjoic2ItMDU0NzRkOTEtODUzZi00NjZiLTgyNDktMjYwNTZlMTVkMDBlIWIzMzk4NzB8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJhenAiOiJzYi0wNTQ3NGQ5MS04NTNmLTQ2NmItODI0OS0yNjA1NmUxNWQwMGUhYjMzOTg3MHxkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiNjZmNjI5ZDQiLCJpYXQiOjE3Mjc3NzcyNjIsImV4cCI6MTcyNzgyMDQ2MiwiaXNzIjoiaHR0cHM6Ly85MjBmNmM4MXRyaWFsLmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiJiYTZmNDQyYS0wYzNmLTRhMWQtYjI3ZC05NTg3YmQ0NjBlZGEiLCJhdWQiOlsiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZSIsInNiLTA1NDc0ZDkxLTg1M2YtNDY2Yi04MjQ5LTI2MDU2ZTE1ZDAwZSFiMzM5ODcwfGRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0IiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRyYWluaW5nLWRhdGEiLCJ1YWEiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0IiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQucnVsZXMiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnIl19.pjdQ3CmRYBfal-m9jiQsLwZOL2XtqiCkW_W3Udsrv8y28c42w4vQTQL0U_wmkUl-hOZGxfQ1hOseqWjQWmI7dSiMGUebRTmq6t6cEbkl5LBZ9U7f4mFuQfCUG2DnCA6TlIU5n_knzpnAq3wj9ytSXOHu4ix2t24bzdNRpIWj7czrTsCGxmLrFblGqOA6xxB_EphZ_e_i2VB47Gi7SwnjvMms-44WmgV3LdjXbkV8mrjJbhpublfS1lmMFE5zB0lRoR7UrrNZvIJ6J4sHizSBbdnDSSAY1WMhf5lboNZ-P9w76nko_2W_dT4oN_5cUJcE-gKcJE09__f8AOuxb9LuJw';
                // const client_response = await axios.get('https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/clients?limit=5',
                //     {
                //         headers: { "Authorization": token1 }
                //     }
                // );
                // console.log("clIENT--->", client_response);

                //step3- creating payload
                const jsondata = {
                    "schemaName": "SAP_invoice_schema",
                    "clientId": "default",
                    "documentType": "invoice",
                    "receivedDate": "2020-02-17",
                    "enrichment": {
                        "sender": {
                            "top": 5,
                            "type": "businessEntity",
                            "subtype": "supplier"
                        },
                        "employee": {
                            "type": "employee"
                        }
                    }
                }
                // //payload
                const formData = new FormData();

                // Append the JSON data as a string
                formData.append('options', JSON.stringify(jsondata), {
                    contentType: 'application/json'
                });

                // Append the PDF file
                formData.append('file', blob1, {
                    filename: req.fileName,
                    contentType: req.fileType
                });

                const response2 = await axios.post('https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs',
                    formData,
                    {
                        headers: { "Authorization": token }
                    }
                );

                console.log("THIS IS DOC ID =============================>", response2.data.id);
                //step-4 -Get OCR extracted data from the doc_id
                let doc_id;
                let response3;
                setTimeout(async () => {
                    doc_id = response2.data.id;
                    response3 = await axios.get(`https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs/${doc_id}`,
                        {
                            headers: { "Authorization": token }
                        }
                    );
                    console.log("THIS IS RES=============================>", response3.data);

                    //insert ocr data to DB.
                    insertOcrExtractedData(response3.data, OcrDocInfo, OcrHeaderFields, OcrLineItems);
                }, 25000);





            } catch (error) {
                console.error('Error from OCRProcess :', error.message);
            }
        });


        // this.after('CREATE', EmailConfiguration, async (req, res) => {
        //     let password = req.password;
        //     const salt = await bcrypt.genSalt(12);
        //     const hash = await bcrypt.hash(password, salt);

        //     await cds.run(UPDATE(EmailConfiguration).set({ password: hash }).where({ ID: req.ID }));

        // })

        this.after('DELETE', SelectedMail, async (req, res) => {

            try {
                await cds.run(DELETE.from(EmailData));
                await cds.run(DELETE.from(OCRProcess));
                await cds.run(DELETE.from(Logs));

                console.log("alL DB CLEARED!!!!");
            } catch (error) {
                console.log("Error from selected mail before::", error.message);
            }
        })
        this.after('CREATE', SelectedMail, async (req, res) => {

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
            let email_body_encoded = email.html.toString();
            let email_body_decoded = email_body_encoded.replace(/\\u003C/g, '<').replace(/\\u003E/g, '>');
            emailData_obj = {
                ID: uuidv4(),
                date: email.date.toISOString().split("T")[0],
                time: email.date.toISOString().split("T")[1].split(".")[0],
                subject: email.subject,
                sender: email.from.text,
                receiver: email.to?.text,
                body: email_body_decoded,
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



//Function for inserting ocr extracted data to DB..................................................
async function insertOcrExtractedData(ocrData, OcrDocInfo, OcrHeaderFields, OcrLineItems) {

    //payload for OcrDocInfo.
    let OcrDocInfoPayload = {
        id: ocrData.id,
        status: ocrData.status,
        fileName: ocrData.fileName,
        documentType: ocrData.documentType,
        fileType: ocrData.fileType,
        receivedDate: ocrData.receivedDate,
    }
    console.log("OCR DOC INFO------------>", OcrDocInfoPayload);
    await cds.run(INSERT.into(OcrDocInfo).entries(OcrDocInfoPayload));

    //OcrHeaderPayload
    ocrData.extraction.headerFields.forEach(async (header, index) => {
        let headerFieldPayload = {
            ocrdocinfo_id: ocrData.id,
            name: header.name,
            value: header.value,
            rawValue: header.rawValue,
            confidence: header.confidence,
            page: header.page,
            label: header.label,
            model: header.model,
            x: header.coordinates.x,
            y: header.coordinates.y,
            w: header.coordinates.w,
            h: header.coordinates.h,
        }

        console.log(`HEADER ${index}------------>`, headerFieldPayload);
        await cds.run(INSERT.into(OcrHeaderFields).entries(headerFieldPayload));

    })
    //OcrLineItemPayload
    ocrData.extraction.lineItems.forEach(async (lineItem, index) => {
        lineItem.forEach(async (ele, index) => {
            let lineItemPayload = {
                ocrdocinfo_id: ocrData.id,
                name: ele.name,
                value: ele.value,
                rawValue: ele.rawValue,
                confidence: ele.confidence,
                page: ele.page,
                label: ele.label,
                model: ele.model,
                x: ele.coordinates.x,
                y: ele.coordinates.y,
                w: ele.coordinates.w,
                h: ele.coordinates.h,
            }

            console.log(`LINEITEM ${index}------------>`, lineItemPayload);
            await cds.run(INSERT.into(OcrLineItems).entries(lineItemPayload));

        });

    });



    // await cds.run(INSERT.into(OcrDocInfo).entries(OcrDocInfoPayload));



}