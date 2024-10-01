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
        const { SelectedMail, EmailData, EmailConfiguration, Attachments, Logs, Test } = this.entities;
        this.after('CREATE', Test, async (req) => {
            try {
                const formData1 = req.formData;
                const blob1 = Buffer.from(formData1, 'base64');
                console.log("Blob", blob1)
                

                 const api = await cds.connect.to('apiName');

                //step 1 - getting token
                // const token_response = await axios.get('https://mysubaccount-axm16i2j.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials',
                //     {
                //         auth: {
                //             username: 'sb-3217c7b0-ca8b-43df-a899-419aff700753!b331941|dox-xsuaa-std-trial!b10844',
                //             password: 'd37e9d8a-b473-4111-90b6-ca0e0578a3dd$0aFULPsbhBDkay_yxV9ix7CUOLvDHyYGqyZLeiBZ1SE='
                //         }
                //     }
                // )
                // const token = `Bearer ${token_response.data.access_token}`
                // console.log("TOKEN-->", token);

                //Getting clients
                const token1 = 'Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vbXlzdWJhY2NvdW50LWF4bTE2aTJqLmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vdG9rZW5fa2V5cyIsImtpZCI6ImRlZmF1bHQtand0LWtleS0yYzdjMzg1YTRkIiwidHlwIjoiSldUIiwiamlkIjogImNMeFZPeHZVc04wckQ2NmNvN09GWTNzR0pBaXhnbzRMWFlBUmtYYWVpTzA9In0.eyJqdGkiOiI0MGY2MTUyZTRjODI0Y2Q1YjgzMmYxYTZmYjZkMmI2ZCIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiIxODA5MzZlYi04YjlmLTRjYjMtOWEwMi1kNzFjZTg2ZGU0NWEiLCJ6ZG4iOiJteXN1YmFjY291bnQtYXhtMTZpMmoiLCJzZXJ2aWNlaW5zdGFuY2VpZCI6IjMyMTdjN2IwLWNhOGItNDNkZi1hODk5LTQxOWFmZjcwMDc1MyJ9LCJzdWIiOiJzYi0zMjE3YzdiMC1jYThiLTQzZGYtYTg5OS00MTlhZmY3MDA3NTMhYjMzMTk0MXxkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImF1dGhvcml0aWVzIjpbImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnNjaGVtYS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmlkZW50aWZpZXIucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRvY3VtZW50LndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudGVtcGxhdGUucmVhZCIsInVhYS5yZXNvdXJjZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnJ1bGVzLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudGVtcGxhdGUud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLWV4cG9ydC5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2xpZW50LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kb2N1bWVudC5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS1leHBvcnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuaWRlbnRpZmllci53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRyYWluaW5nLWRhdGEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5zY2hlbWEucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlY2huaWNhbHNjb3BlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2xpZW50LndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jYXBhYmlsaXRpZXMucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNvbmZpZy53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRyYWluaW5nLWRhdGEucmVhZCJdLCJzY29wZSI6WyJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5zY2hlbWEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kb2N1bWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLnJlYWQiLCJ1YWEucmVzb3VyY2UiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5ydWxlcy53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS1leHBvcnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmlkZW50aWZpZXIud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZWNobmljYWxzY29wZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNvbmZpZy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLnJlYWQiXSwiY2xpZW50X2lkIjoic2ItMzIxN2M3YjAtY2E4Yi00M2RmLWE4OTktNDE5YWZmNzAwNzUzIWIzMzE5NDF8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJjaWQiOiJzYi0zMjE3YzdiMC1jYThiLTQzZGYtYTg5OS00MTlhZmY3MDA3NTMhYjMzMTk0MXxkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImF6cCI6InNiLTMyMTdjN2IwLWNhOGItNDNkZi1hODk5LTQxOWFmZjcwMDc1MyFiMzMxOTQxfGRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0IiwiZ3JhbnRfdHlwZSI6ImNsaWVudF9jcmVkZW50aWFscyIsInJldl9zaWciOiJmNzQyZThhYiIsImlhdCI6MTcyNzc2NjI1MSwiZXhwIjoxNzI3ODA5NDUxLCJpc3MiOiJodHRwczovL215c3ViYWNjb3VudC1heG0xNmkyai5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL29hdXRoL3Rva2VuIiwiemlkIjoiMTgwOTM2ZWItOGI5Zi00Y2IzLTlhMDItZDcxY2U4NmRlNDVhIiwiYXVkIjpbImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnNjaGVtYSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNhcGFiaWxpdGllcyIsInNiLTMyMTdjN2IwLWNhOGItNDNkZi1hODk5LTQxOWFmZjcwMDc1MyFiMzMxOTQxfGRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0IiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhIiwidWFhIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLWV4cG9ydCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnJ1bGVzIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuaWRlbnRpZmllciIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNvbmZpZyJdfQ.PXVUBAIvaLGbqz_bhABA2AIHo5SMwnDuDqtFwp8NVDgJRNEdysUsxq4lQOuqPgfKBIPHPQLaqTsEM3w6bwkMIrWLdjwoVSEZQio5Xn1k6xVS_KXo_V3RwuFi5hPFXmC-1zQIfvtuSInDtHrGiZetfIExnO23T95PrzMQokPLzlHNI7czPvTFpcNp2DMqFq5GBQ71AhNvVLG8FRTSXPukGK8JquL5D4L9IGGO2YK2t6izTJiqzKngvBp0mxSVPqInuvi56d4LEQrlc2OIyDBxoB-zDuuuI9WkKOCHdFoEMeSm-T8gTkQQxyRUbCBGOfBYHnIollxXNrHbsp_9Sopisw';
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
                    filename: 'Udyam_New.pdf',
                    contentType: 'application/pdf'
                });

                const response2 = await axios.post('https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs',
                    formData,
                    {
                        headers: { "Authorization": token1 }
                    }
                );
                // console.log("THIS IS RES=============================>", response2);
                console.log("THIS IS RES Response 2 =============================>", response2.data.id);
                let doc_id;
                setTimeout(async() => {
                    doc_id = response2.data.id;
                    //step-4 -Get OCR extracted data from the doc_id
                    let response3 = await axios.get(`https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs/${doc_id}`,
                        {
                            headers: { "Authorization": token1 }
                        }
                    );
                    console.log("THIS IS RES=============================>", response3.data);
                }, 15000);



            } catch (error) {
                console.error('Error :', error.message);
            }
        });


        this.after('CREATE', EmailConfiguration, async (req, res) => {
            let password = req.password;
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(password, salt);

            await cds.run(UPDATE(EmailConfiguration).set({ password: hash }).where({ ID: req.ID }));

        })

        this.after('CREATE', SelectedMail, async (req, res) => {
            await cds.run(DELETE.from(EmailData));
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