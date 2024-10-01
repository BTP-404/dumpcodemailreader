sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/PDFViewer",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
  ],
  function (BaseController, JSONModel, MessageToast, PDFViewer, Fragment, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.mailprocessor.controller.InvoiceApp", {
      onInit: function () {
        var oTable = this.byId("mailTable11");
        var oBinding = oTable.getBinding("items");

        // Apply filter for 'subject' field to show only "invoice" emails
        // var oFilter = new Filter({
        //   path: "subject",
        //   operator: FilterOperator.EQ,
        //   value1: "invoice"
        // });

        if (oBinding) {
          oBinding.filter([oFilter]);
        } else {
          oTable.attachEventOnce("updateFinished", function () {
            oBinding = oTable.getBinding("items");
            if (oBinding) {
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

      //   onProceedWithOcr: function (oEvent) {
      //     var that = this;

      //     try {
      //         console.log("Proceed with OCR triggered");

      //         // Get the file details from the context
      //         var oContext = oEvent.getSource().getBindingContext();
      //         if (!oContext) {
      //             console.error("No binding context found");
      //             return;
      //         }

      //         var sFileType = oContext.getProperty("fileType"); // e.g., "application/pdf", "image/jpeg"
      //         var sFileBase64 = oContext.getProperty("file"); // Base64 encoded string
      //         var sFileName = oContext.getProperty("fileName") || "document"; // Use a default name if fileName is not present

      //         if (!sFileType || !sFileBase64) {
      //             console.error("File type or file content missing");
      //             return;
      //         }

      //         // Convert Base64 to binary
      //         var byteCharacters = atob(sFileBase64); // Decode base64
      //         var byteNumbers = new Array(byteCharacters.length);
      //         for (var i = 0; i < byteCharacters.length; i++) {
      //             byteNumbers[i] = byteCharacters.charCodeAt(i);
      //         }
      //         var byteArray = new Uint8Array(byteNumbers);
      //         var blob = new Blob([byteArray], { type: sFileType }); // Create Blob object

      //         // Create FormData to send the file
      //         var formData = new FormData();
      //         formData.append("fileData", blob, sFileName + '.' + sFileType.split('/')[1]); // File data
      //     formData.append("fileName", sFileName); // File name
      //     formData.append("fileType", sFileType); // File type

      //     formData.append("status", "pending"); // Default status
      //         console.log(formData)
      //         // let oModel = this.getView().getModel();

      //         // // Create a new entry in the Test entity set


      //   // Create a plain object from formData
      //   let oNewEntry = {
      //     formData: blob // Directly attach the Blob instead of FormData
      // };

      //   let oModel = this.getView().getModel();
      //   // Log the new entry object
      //   // console.log('New entry to be sent:', oNewEntry);

      //         // // Bind to the entity set and create the entry
      //         let oBindList = oModel.bindList("/Test");
      //        let submit= oBindList.create(oNewEntry);
      //        submit.created().then(() => {
      //           MessageToast.show("Submitted successfully");

      //       }).catch((error) => {
      //           MessageToast.show(error);
      //       });


      //         // Define the URL for your API
      //         // let _getbaseUrl = () => {
      //         //     const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
      //         //     const appPath = appId.replaceAll(".", "/");
      //         //     const appModulePath = jQuery.sap.getModulePath(appPath);
      //         //     return appModulePath + "/integrationsuiteocr"; 
      //         // }; 
      //         // let dieurl = _getbaseUrl();

      //         // Make the POST request
      //         // fetch('/Test', {
      //         //     method: 'POST',
      //         //     body: formData // Send the FormData
      //         // })
      //         // .then(response => {
      //         //     if (!response.ok) {
      //         //         throw new Error('Failed to submit document. Status: ' + response.status);
      //         //     }
      //         //     return response.json(); // Parse the JSON response
      //         // })
      //         // .then(data => {
      //         //     if (data && data.id) {
      //         //         console.log("OCR processing submitted successfully. Job ID:", data.id);
      //         //         MessageToast.show("Document submitted successfully! Job ID: " + data.id);
      //         //     } else {
      //         //         console.error("No job ID returned. Response:", data);
      //         //         MessageToast.show("Document submitted but no job ID returned.");
      //         //     }
      //         // })
      //         // .catch(error => {
      //         //     console.error("Error during OCR submission:", error);
      //         //     MessageToast.show("Error during document submission.");
      //         // });

      //     } catch (e) {
      //         console.error("OCR process failed:", e);
      //         MessageToast.show("An error occurred while processing the document.");
      //     }
      // }
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

          var sFileType = oContext.getProperty("fileType");
          var sFileBase64 = oContext.getProperty("file");
          var sFileName = oContext.getProperty("fileName") || "document";




          if (!sFileType || !sFileBase64) {
            console.error("File type or file content missing");
            return;
          }



          // Prepare the entry for the OData model
          let oNewEntry = {
            formData: sFileBase64,
            fileType: sFileType,
            fileName: sFileName
          };

          let oModel = this.getView().getModel();

          // Log the new entry object
          console.log('New entry to be sent:', oNewEntry);

          // Bind to the entity set and create the entry
          let oBindList = oModel.bindList("/OCRProcess");
          let submit = oBindList.create(oNewEntry);

          submit.created().then(() => {
            MessageToast.show("Submitted successfully");
          })
            .catch((error) => {
              MessageToast.show("Submission failed: " + error);
              console.error(error);
            });

        } catch (error) {
          console.error('Error in onProceedWithOcr:', error);
        }
      }


    });
  }
);
