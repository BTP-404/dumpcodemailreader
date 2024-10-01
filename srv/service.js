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

                // const api = await cds.connect.to('apiName');

                //step 1 - getting token
                // const token_response = await axios.get('https://7d3b0ff3trial.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials',
                //     {
                //         auth: {
                //             username: 'sb-50afcb53-cba4-4150-b7e8-34880f950f3b!b337563|it-rt-7d3b0ff3trial!b26655',
                //             password: '93f89d4b-d2b0-436b-9ed4-46f0af5fefdd$HG6gdNrwMWI_w6C2PkIMSZKPfx-B78V3kF5wvyG_qsU='
                //         }
                //     }
                // )
                // const token = `Bearer ${token_response.data.access_token}`
                // console.log("TOKEN-->", token);

                //Getting clients
                //const token1='Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vN2QzYjBmZjN0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMTEwZDY5MTdlMCIsInR5cCI6IkpXVCIsImppZCI6ICJRbEhaaFRvMzVqamkrRklxMVNUeEpHbURkMkMrZTkvMjZPcHhXNGZoMHpVPSJ9.eyJqdGkiOiIwZTdmMjE2ODcwMzc0NDIxYjI1ZjA5ZGM1NWFhMTc0OCIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI4MzY1ZTY4NS02N2M3LTQxMDYtODY2Mi02ZmNmNzRjMGM2MDAiLCJ6ZG4iOiI3ZDNiMGZmM3RyaWFsIiwic2VydmljZWluc3RhbmNlaWQiOiI1MGFmY2I1My1jYmE0LTQxNTAtYjdlOC0zNDg4MGY5NTBmM2IifSwic3ViIjoic2ItNTBhZmNiNTMtY2JhNC00MTUwLWI3ZTgtMzQ4ODBmOTUwZjNiIWIzMzc1NjN8aXQtcnQtN2QzYjBmZjN0cmlhbCFiMjY2NTUiLCJhdXRob3JpdGllcyI6WyJ1YWEucmVzb3VyY2UiLCJpdC1ydC03ZDNiMGZmM3RyaWFsIWIyNjY1NS5FU0JNZXNzYWdpbmcuc2VuZCJdLCJzY29wZSI6WyJ1YWEucmVzb3VyY2UiLCJpdC1ydC03ZDNiMGZmM3RyaWFsIWIyNjY1NS5FU0JNZXNzYWdpbmcuc2VuZCJdLCJjbGllbnRfaWQiOiJzYi01MGFmY2I1My1jYmE0LTQxNTAtYjdlOC0zNDg4MGY5NTBmM2IhYjMzNzU2M3xpdC1ydC03ZDNiMGZmM3RyaWFsIWIyNjY1NSIsImNpZCI6InNiLTUwYWZjYjUzLWNiYTQtNDE1MC1iN2U4LTM0ODgwZjk1MGYzYiFiMzM3NTYzfGl0LXJ0LTdkM2IwZmYzdHJpYWwhYjI2NjU1IiwiYXpwIjoic2ItNTBhZmNiNTMtY2JhNC00MTUwLWI3ZTgtMzQ4ODBmOTUwZjNiIWIzMzc1NjN8aXQtcnQtN2QzYjBmZjN0cmlhbCFiMjY2NTUiLCJncmFudF90eXBlIjoiY2xpZW50X2NyZWRlbnRpYWxzIiwicmV2X3NpZyI6ImE4MGE1M2VmIiwiaWF0IjoxNzI3NzYzMzE0LCJleHAiOjE3Mjc3NjY5MTQsImlzcyI6Imh0dHBzOi8vN2QzYjBmZjN0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL29hdXRoL3Rva2VuIiwiemlkIjoiODM2NWU2ODUtNjdjNy00MTA2LTg2NjItNmZjZjc0YzBjNjAwIiwiYXVkIjpbInVhYSIsInNiLTUwYWZjYjUzLWNiYTQtNDE1MC1iN2U4LTM0ODgwZjk1MGYzYiFiMzM3NTYzfGl0LXJ0LTdkM2IwZmYzdHJpYWwhYjI2NjU1IiwiaXQtcnQtN2QzYjBmZjN0cmlhbCFiMjY2NTUuRVNCTWVzc2FnaW5nIl19.ruGd0BNzqSr-jF8vSuA3BY4b6iSM_zNb5Mm5gMAyTLzYPBdwj0R4ecjVx7Eeuya4UBoOu9vBiJW6mJf1WL-YqOhahodqB89uXMj3PNMFe-L4vC5IJTNRCgq2CA0VnyJSQuWICK3GrxpJOn1rErfvLO4Sh1nYBkHgJoH9UzNlKXfOGGm9Vn5aWBZFvFYzBtq9SGVmf-esvtmtXLJWCzS8MWYex6lRcF9yTbHFoGLdCwR0U3T0bkj9kq0Kx46qwVI42a6hPgTXBfmvZUbFUkbz8fC2z59QD9LadZuc2UY_eTOFZ7ZhRlrb2iJwzKdVMSVf66LvAmJoEuR7a81qYIn7Cg';
                // const client_response = await axios.get('https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/clients?limit=5',
                //     {
                //         headers: { "Authorization": token1 }
                //     }
                // );
                // console.log("clIENT--->", client_response);

                //step3- creating payload
                const jsondata = {
                    "schemaName": "SAP_invoice_schema",
                    "clientId": "bhavesh",
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
                        headers: { "Authorization": 'Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vN2QzYjBmZjN0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMTEwZDY5MTdlMCIsInR5cCI6IkpXVCIsImppZCI6ICI5SG9xcW9xYWZjbzMvQjhLb01wd01wMmZHL1NEOStwckRqbTZ2TmdZRmY4PSJ9.eyJqdGkiOiI4ZWY5ZjAxMjE0NjU0YzAxYjUyZjc5MjUwZmNjZmJhMSIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI4MzY1ZTY4NS02N2M3LTQxMDYtODY2Mi02ZmNmNzRjMGM2MDAiLCJ6ZG4iOiI3ZDNiMGZmM3RyaWFsIiwic2VydmljZWluc3RhbmNlaWQiOiI1MGFmY2I1My1jYmE0LTQxNTAtYjdlOC0zNDg4MGY5NTBmM2IifSwic3ViIjoic2ItNTBhZmNiNTMtY2JhNC00MTUwLWI3ZTgtMzQ4ODBmOTUwZjNiIWIzMzc1NjN8aXQtcnQtN2QzYjBmZjN0cmlhbCFiMjY2NTUiLCJhdXRob3JpdGllcyI6WyJ1YWEucmVzb3VyY2UiLCJpdC1ydC03ZDNiMGZmM3RyaWFsIWIyNjY1NS5FU0JNZXNzYWdpbmcuc2VuZCJdLCJzY29wZSI6WyJ1YWEucmVzb3VyY2UiLCJpdC1ydC03ZDNiMGZmM3RyaWFsIWIyNjY1NS5FU0JNZXNzYWdpbmcuc2VuZCJdLCJjbGllbnRfaWQiOiJzYi01MGFmY2I1My1jYmE0LTQxNTAtYjdlOC0zNDg4MGY5NTBmM2IhYjMzNzU2M3xpdC1ydC03ZDNiMGZmM3RyaWFsIWIyNjY1NSIsImNpZCI6InNiLTUwYWZjYjUzLWNiYTQtNDE1MC1iN2U4LTM0ODgwZjk1MGYzYiFiMzM3NTYzfGl0LXJ0LTdkM2IwZmYzdHJpYWwhYjI2NjU1IiwiYXpwIjoic2ItNTBhZmNiNTMtY2JhNC00MTUwLWI3ZTgtMzQ4ODBmOTUwZjNiIWIzMzc1NjN8aXQtcnQtN2QzYjBmZjN0cmlhbCFiMjY2NTUiLCJncmFudF90eXBlIjoiY2xpZW50X2NyZWRlbnRpYWxzIiwicmV2X3NpZyI6ImE4MGE1M2VmIiwiaWF0IjoxNzI3NzY0MjMwLCJleHAiOjE3Mjc3Njc4MzAsImlzcyI6Imh0dHBzOi8vN2QzYjBmZjN0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL29hdXRoL3Rva2VuIiwiemlkIjoiODM2NWU2ODUtNjdjNy00MTA2LTg2NjItNmZjZjc0YzBjNjAwIiwiYXVkIjpbInVhYSIsInNiLTUwYWZjYjUzLWNiYTQtNDE1MC1iN2U4LTM0ODgwZjk1MGYzYiFiMzM3NTYzfGl0LXJ0LTdkM2IwZmYzdHJpYWwhYjI2NjU1IiwiaXQtcnQtN2QzYjBmZjN0cmlhbCFiMjY2NTUuRVNCTWVzc2FnaW5nIl19.V2jshW17mz-qxh-68M6lqYKZbynEkXKfKi4BTaY0ypxYDo_qCGfkhuVzUY7fFq70f9efG6l6nerBmmZ5SnU6je_Nq2pafNN5PsCJ62tUpDujc3Zpll45CvxtSZ76sn1m-RgzFuP6WhhiEWxLprqPOsyklRryV4G4rCH_LkFowY-QUL33nYBZa0hRSLVS6MXy5mqHPMu3yZ91nlDL89wmKu5AeWw8iqf1ygubvFduTYlAEW-BRUI7-eFjSYZ9wjSewBtFTAQmhltOvfHEggVxDLVO48Xv9GzrRulEKm0qoDgD7YeO613Z-5jjoqXtdrGyZ1IuOJLzqHhdj0jfgmC1KA' }
                    }
                );
                console.log("THIS IS RES=============================>", response2);
                console.log("THIS IS RES PAYLOAD=============================>", response2.data.id);
                // const doc_id=response.data.id;
                // const temp = '368d4532-a9b1-4ce7-a4ba-67a11fe1994e';

                // const response = await axios.get(`https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs/${temp}`,
                //     {
                //         headers: { "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vN2QzYjBmZjN0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMTEwZDY5MTdlMCIsInR5cCI6IkpXVCIsImppZCI6ICJrbEFlbTRPS0NhbTBuNUhQZlNxOTFCeHhRdDM1TXlhVnZYWTdXUXFpc01zPSJ9.eyJqdGkiOiI2M2MwN2E0NjkwYzE0NGQ1YTA5N2RjZjNmOWY3MGRjNCIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI4MzY1ZTY4NS02N2M3LTQxMDYtODY2Mi02ZmNmNzRjMGM2MDAiLCJ6ZG4iOiI3ZDNiMGZmM3RyaWFsIiwic2VydmljZWluc3RhbmNlaWQiOiJjMTI4ZWZiOC01ZWEwLTQ4MDQtYWFjMy05NWQ4MGIxNjUzOWQifSwic3ViIjoic2ItYzEyOGVmYjgtNWVhMC00ODA0LWFhYzMtOTVkODBiMTY1MzlkIWIzMzc1NjN8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJhdXRob3JpdGllcyI6WyJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5zY2hlbWEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kb2N1bWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLnJlYWQiLCJ1YWEucmVzb3VyY2UiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5ydWxlcy53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS1leHBvcnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmlkZW50aWZpZXIud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZWNobmljYWxzY29wZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNvbmZpZy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLnJlYWQiXSwic2NvcGUiOlsiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuaWRlbnRpZmllci5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZS5yZWFkIiwidWFhLnJlc291cmNlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQucnVsZXMud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRvY3VtZW50LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLWV4cG9ydC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudHJhaW5pbmctZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnNjaGVtYS5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudGVjaG5pY2Fsc2NvcGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNhcGFiaWxpdGllcy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudHJhaW5pbmctZGF0YS5yZWFkIl0sImNsaWVudF9pZCI6InNiLWMxMjhlZmI4LTVlYTAtNDgwNC1hYWMzLTk1ZDgwYjE2NTM5ZCFiMzM3NTYzfGRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0IiwiY2lkIjoic2ItYzEyOGVmYjgtNWVhMC00ODA0LWFhYzMtOTVkODBiMTY1MzlkIWIzMzc1NjN8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJhenAiOiJzYi1jMTI4ZWZiOC01ZWEwLTQ4MDQtYWFjMy05NWQ4MGIxNjUzOWQhYjMzNzU2M3xkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiYThkMDg4YWIiLCJpYXQiOjE3Mjc2OTIxMTcsImV4cCI6MTcyNzczNTMxNywiaXNzIjoiaHR0cHM6Ly83ZDNiMGZmM3RyaWFsLmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiI4MzY1ZTY4NS02N2M3LTQxMDYtODY2Mi02ZmNmNzRjMGM2MDAiLCJhdWQiOlsiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhIiwidWFhIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJzYi1jMTI4ZWZiOC01ZWEwLTQ4MDQtYWFjMy05NWQ4MGIxNjUzOWQhYjMzNzU2M3xkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0IiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQucnVsZXMiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnIl19.hU6bhfZLI7cEs5iJlB54kM-EFCrLlMSLipqSVXQkqDp_huzRetvdA_RcTRtFkQ1-OxvmMFLjwxL3EYOCuSMpDATbdzMx6leE6EZWsRW1rr2piK1tFlLh0C4zECUR0sqbj6HvklaTJwiMj60AFGNa9qwEDvAf_eVhEjdswQHsEMJnKhw3YVzT67gdJKQf4T5hkRh-RHD55uL1n5M7jFy_h2yWAgj8IugniS7PwMcaVpn6sMFGMWtxpkwy8sSkcuABl1BgoI1Q_PcrRG7DylMqV01sTgKsgp-H3wfF5m_dhyhd83udAVSV6sKvWqaSQAZKuQn-TXhC_WmvQ-g9v_wpgg" }
                //     }
                // );
                // console.log("THIS IS RES=============================>", response);
            } catch (error) {
                console.error('Error processing CREATE:', error.message);
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