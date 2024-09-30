sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/PDFViewer",
    "sap/ui/core/Fragment"
  ],
  function (BaseController, JSONModel, MessageToast, PDFViewer, Fragment) {
    "use strict";

    return BaseController.extend("com.mailprocessor.controller.InvoiceApp", {
      onInit: function () {
        var oTable = this.byId("mailTable11");
        var oBinding = oTable.getBinding("items");

        // Apply filter for 'subject' field to show only "invoice" emails
        if (oBinding) {
          var oFilter = new sap.ui.model.Filter({
            path: "subject",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: "invoice"
          });
          oBinding.filter([oFilter]);
        } else {
          oTable.attachEventOnce("updateFinished", function () {
            oBinding = oTable.getBinding("items");
            if (oBinding) {
              var oFilter = new sap.ui.model.Filter({
                path: "subject",
                operator: sap.ui.model.FilterOperator.EQ,
                value1: "invoice"
              });
              oBinding.filter([oFilter]);
            }
          });
        }
      },

      // Fetch and display attachments in a dialog
      onShowAttachments: function (oEvent) {
        var oSelectedItem = oEvent.getSource().getParent();
        var oContext = oSelectedItem.getBindingContext();
        var sEmailId = oContext.getProperty("ID");

        if (!this._oAttachmentDialog) {
          this._oAttachmentDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "com.mailprocessor.fragments.AttachmentDialog",
            this
          );
          this.getView().addDependent(this._oAttachmentDialog);
        }

        this._fetchAttachments(sEmailId).then(function (aAttachments) {
          var oDialogModel = new JSONModel({ attachments: aAttachments });
          this._oAttachmentDialog.setModel(oDialogModel);
          this._oAttachmentDialog.open();
        }.bind(this)).catch(function (oError) {
          MessageToast.show("Error fetching attachments.");
          console.error("Error fetching attachments:", oError);
        });
      },

      // Fetch attachments from OData service
      _fetchAttachments: function (ID) {
        var oModel = this.getView().getModel();
        return oModel.bindList(`/EmailData(${ID})/attachments`).requestContexts().then(function (aContexts) {
          return aContexts.map(function (oContext) {
            return oContext.getObject();
          });
        });
      },

      onDialogOpen: function () {
        this.getView().byId("deleteButton").setEnabled(false);
      },

      onUploadPress: function () {
        this.getView().byId("deleteButton").setEnabled(true);
        console.log("File uploaded");
      },

      onDeletePress: function () {
        console.log("Delete button pressed");
      },

      onDownloadPress: function () {
        var oTable = this.getView().byId("attachmentTable1");
        var oSelectedItem = oTable.getSelectedItem();

        if (oSelectedItem) {
          var context = oSelectedItem.getBindingContext();
          var fileData = context.getProperty("file");

          if (fileData) {
            var link = document.createElement("a");
            link.href = "data:application/octet-stream;base64," + fileData;
            link.download = context.getProperty("fileName");
            link.click();
            console.log("File downloaded");
          }
        } else {
          sap.m.MessageToast.show("Please select a file to download");
        }
      },

      onSearch1: function (oEvent) {
        var sQuery = oEvent.getParameter("newValue");
        var oTable = this.getView().byId("attachmentTable1");
        var oBinding = oTable.getBinding("items");
        var oFilter = [];

        if (sQuery) {
          oFilter.push(new sap.ui.model.Filter("fileName", sap.ui.model.FilterOperator.Contains, sQuery));
        }

        oBinding.filter(oFilter);
      },

      onFilterPress: function () {
        console.log("Filter button pressed");
      },

      onSortPress: function () {
        var oTable = this.getView().byId("attachmentTable1");
        var oBinding = oTable.getBinding("items");

        var aSorters = [];
        aSorters.push(new sap.ui.model.Sorter("fileName", false)); // Ascending sort
        oBinding.sort(aSorters);
        console.log("Sort button pressed");
      },

      onPreviewAttachment: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext();
        var sFileType = oContext.getProperty("fileType");
        var sFileBase64 = oContext.getProperty("file");

        if (!this._oPreviewDialog) {
          this._oPreviewDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "com.mailprocessor.fragments.Attachment",
            this
          );
          this.getView().addDependent(this._oPreviewDialog);
        }

        var oPreviewContent = Fragment.byId(this.getView().getId(), "filePreview");

        if (sFileType === "application/pdf") {
          var byteCharacters = atob(sFileBase64);
          var byteNumbers = new Array(byteCharacters.length);
          for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          var byteArray = new Uint8Array(byteNumbers);
          var blob = new Blob([byteArray], { type: "application/pdf" });
          var sPdfUrl = URL.createObjectURL(blob);

          if (!this._pdfViewer) {
            this._pdfViewer = new PDFViewer({
              title: "PDF Preview",
              showDownloadButton: false,
              width: "auto",
              height: "600px"
            });
            this.getView().addDependent(this._pdfViewer);
          }

          this._pdfViewer.setSource(sPdfUrl);
          this._pdfViewer.open();
          this._pdfViewer.attachAfterClose(function () {
            URL.revokeObjectURL(sPdfUrl);
          });

        } else if (sFileType.startsWith("image/")) {
          var sImageHtml = "<img src='data:" + sFileType + ";base64," + sFileBase64 + "' style='max-width: 100%; max-height: 400px;' />";
          oPreviewContent.setContent(sImageHtml);

        } else if (sFileType === "text/plain") {
          var sFileDecoded = atob(sFileBase64);
          oPreviewContent.setContent("<pre>" + sFileDecoded + "</pre>");

        } else {
          MessageToast.show("Unsupported file type for preview.");
        }

        this._oPreviewDialog.open();
      },

      onProceedWithOcr: function (oEvent) {
        var that = this;
    
        try {
            console.log("Proceed with OCR triggered");
    
            // Get the file details from the context
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) {
                console.error("No binding context found");
                return;
            }
    
            var sFileType = oContext.getProperty("fileType"); // e.g., "application/pdf", "image/jpeg"
            var sFileBase64 = oContext.getProperty("file"); // Base64 encoded string
    
            if (!sFileType || !sFileBase64) {
                console.error("File type or file content missing");
                return;
            }
    
            // Convert Base64 to binary
            var byteCharacters = atob(sFileBase64); // Decode base64
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            var blob = new Blob([byteArray], { type: sFileType }); // Create Blob object
    
            // Create FormData to send the file
            var formData = new FormData();
            formData.append("file", blob, "document.pdf"); // Attach the file
    // ======================================================================
    console.log("testing Himanshu ===========");
    
// After your existing code...
console.log("testing Himanshu ===========");

// Make the GET request
fetch('https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/clients?limit=6', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vN2QzYjBmZjN0cmlhbC5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMTEwZDY5MTdlMCIsInR5cCI6IkpXVCIsImppZCI6ICJUM0RoMisvZzBXYkp4WnVkNG9veTR6YnVvWkwvSW1jSi9FblhRcWVZajdBPSJ9.eyJqdGkiOiI5YzAwM2EwNDViZjU0OGNmYjlhNTgyNmE1OGMwNmE5ZSIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiI4MzY1ZTY4NS02N2M3LTQxMDYtODY2Mi02ZmNmNzRjMGM2MDAiLCJ6ZG4iOiI3ZDNiMGZmM3RyaWFsIiwic2VydmljZWluc3RhbmNlaWQiOiJjMTI4ZWZiOC01ZWEwLTQ4MDQtYWFjMy05NWQ4MGIxNjUzOWQifSwic3ViIjoic2ItYzEyOGVmYjgtNWVhMC00ODA0LWFhYzMtOTVkODBiMTY1MzlkIWIzMzc1NjN8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJhdXRob3JpdGllcyI6WyJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5zY2hlbWEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kb2N1bWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLnJlYWQiLCJ1YWEucmVzb3VyY2UiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5ydWxlcy53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnRlbXBsYXRlLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS1leHBvcnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmlkZW50aWZpZXIud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZWNobmljYWxzY29wZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNvbmZpZy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhLnJlYWQiXSwic2NvcGUiOlsiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuaWRlbnRpZmllci5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZS5yZWFkIiwidWFhLnJlc291cmNlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQucnVsZXMud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRvY3VtZW50LnJlYWQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5kYXRhLWV4cG9ydC53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudHJhaW5pbmctZGF0YS53cml0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LnNjaGVtYS5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudGVjaG5pY2Fsc2NvcGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jbGllbnQud3JpdGUiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5jb25maWcucmVhZCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNhcGFiaWxpdGllcy5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZGF0YS5yZWFkIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnLndyaXRlIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQudHJhaW5pbmctZGF0YS5yZWFkIl0sImNsaWVudF9pZCI6InNiLWMxMjhlZmI4LTVlYTAtNDgwNC1hYWMzLTk1ZDgwYjE2NTM5ZCFiMzM3NTYzfGRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0IiwiY2lkIjoic2ItYzEyOGVmYjgtNWVhMC00ODA0LWFhYzMtOTVkODBiMTY1MzlkIWIzMzc1NjN8ZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJhenAiOiJzYi1jMTI4ZWZiOC01ZWEwLTQ4MDQtYWFjMy05NWQ4MGIxNjUzOWQhYjMzNzU2M3xkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiYThkMDg4YWIiLCJpYXQiOjE3Mjc1MzM1MDgsImV4cCI6MTcyNzU3NjcwOCwiaXNzIjoiaHR0cHM6Ly83ZDNiMGZmM3RyaWFsLmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiI4MzY1ZTY4NS02N2M3LTQxMDYtODY2Mi02ZmNmNzRjMGM2MDAiLCJhdWQiOlsiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuc2NoZW1hIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY2FwYWJpbGl0aWVzIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuZG9jdW1lbnQiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50ZW1wbGF0ZSIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC50cmFpbmluZy1kYXRhIiwidWFhIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQiLCJzYi1jMTI4ZWZiOC01ZWEwLTQ4MDQtYWFjMy05NWQ4MGIxNjUzOWQhYjMzNzU2M3xkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmNsaWVudCIsImRveC14c3VhYS1zdGQtdHJpYWwhYjEwODQ0LmRhdGEtZXhwb3J0IiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQucnVsZXMiLCJkb3gteHN1YWEtc3RkLXRyaWFsIWIxMDg0NC5pZGVudGlmaWVyIiwiZG94LXhzdWFhLXN0ZC10cmlhbCFiMTA4NDQuY29uZmlnIl19.bmhZC0th_pbQRgks9Wf2Ung8wWMjTxTmtNlBH5clJC_SBS13WRcJcQzEc3H0RMM187-Ll3LLaFmGSQ4mTk0-UZu72o5HoFty02S7z2C0cdG6DmOdfOsa8jJHMVG6_PSN-SWg3c1sRJByIpeclXVAlmRAgK13H_7ez1lEmTXOS4c2_S8oe8qV2sV7-aximaP_fDojuA38GYuT3hylcyF86jVxv9AYw8AAmFkAaYi3gE7LI4cqBuQPMw6YcYd_mYXvd_rQXBGpm_ODWoayG7TO5ntsX-5bIpmooUP9LgTf-NQwEcooYPioBO_YVcINgY7B6-6Ab-u70Hr0p5Q0xa9vkw'
  }
   
})
.then(response => {
    if (!response.ok) {
        throw new Error('Failed to fetch data. Status: ' + response.status);
    }
    return response.json(); // Parse the JSON response
})
.then(data => {
    console.log("Data retrieved successfully:", data);
    // You can add further processing of the data here
})
.catch(error => {
    console.error("Error during data fetch:", error);
    MessageToast.show("Error fetching data.");
});





    // =======================================================================
            // Make the POST request
            fetch('https://mysubaccount-axm16i2j.it-cpitrial05-rt.cfapps.us10-001.hana.ondemand.com/http/OCR?query=cheque', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa('sb-d5ebeff3-ce5d-4b20-bca1-e3e84befc3ea!b331941|it-rt-mysubaccount-axm16i2j!b26655:0f5f92f0-f77b-47b8-ab6c-d6e6f3f04df0$ZRa7HjGkdgeIoI8owOHMViLNx-G2BEHrVPVr7vVfyxc=')
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to submit document. Status: ' + response.status);
                }
                return response.json(); // Parse the JSON response
            })
            .then(data => {
                if (data && data.id) {
                    console.log("OCR processing submitted successfully. Job ID:", data.id);
                    MessageToast.show("Document submitted successfully! Job ID: " + data.id);
                } else {
                    console.error("No job ID returned. Response:", data);
                    MessageToast.show("Document submitted but no job ID returned.");
                }
            })
            .catch(error => {
                console.error("Error during OCR submission:", error);
                MessageToast.show("Error during document submission.");
            });
    
        } catch (e) {
            console.error("OCR process failed:", e);
            MessageToast.show("An error occurred while processing the document.");
        }
    }
    
    });
  }
);
