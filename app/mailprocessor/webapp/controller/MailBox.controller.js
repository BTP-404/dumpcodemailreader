sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/PDFViewer" // PDFViewer module
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, Fragment, PDFViewer) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.MailBox", {
        onInit: function () {
            // var oModel = this.getOwnerComponent().getModel(); // ODataModel V4 used via the component
            // this.getView().setModel(oModel);

            // // Attach event listeners for dataRequested and dataReceived
            // var oTable = this.getView().byId("mailTable");
            // var oBinding = oTable.getBinding("items");

            var oPanel = this.getView().byId("panel");  // Panel to show busy indicator

            // // Show busy indicator when data is requested
            // oBinding.attachDataRequested(function () {
            //     oPanel.setBusy(true);
            // });

            // // Hide busy indicator when data is received
            // oBinding.attachDataReceived(function () {
            //     oPanel.setBusy(false);
            // });
        },
        // extractEmail: function (sFullEmail) {
        //     if (!sFullEmail) {
        //         return "";
        //     }
        //     // Regex to extract email from the format "Name <email@example.com>"
        //     var aMatch = sFullEmail.match(/<(.+)>/);
        //     return aMatch ? aMatch[1] : sFullEmail; // Return email or full string if no match
        // },
        onSearch: function () {
            // Get the filter values
            var oView = this.getView(),
                sFrom = oView.byId("inputFrom").getValue(),
                sDate = oView.byId("inputDate").getDateValue(),
                sSubject = oView.byId("inputSubject").getValue();

            // Create filters
            var aFilters = [];

            // Handle "From" field
            if (sFrom) {
                aFilters.push(new Filter("sender", FilterOperator.Contains, sFrom));
            }

            // Handle "Date" field - format date as ISO 8601 "YYYY-MM-DD"
            if (sDate) {
                var oDate = new Date(sDate);
                var sFormattedDate = oDate.toISOString().split('T')[0];  // Get "YYYY-MM-DD"
                aFilters.push(new Filter("date", FilterOperator.EQ, sFormattedDate));
            }

            // Handle "Subject" field
            if (sSubject) {
                aFilters.push(new Filter("subject", FilterOperator.Contains, sSubject));
            }

            // Apply filters to the binding of the table
            var oTable = oView.byId("mailTable"),
                oBinding = oTable.getBinding("items");

            // Show busy indicator when filtering is applied
            var oPanel = this.getView().byId("panel");
            oPanel.setBusy(true);

            // Apply the filter and hide the busy indicator when done
            oBinding.filter(aFilters);
            oBinding.attachEventOnce("dataReceived", function () {
                oPanel.setBusy(false);  // Hide busy indicator after data is received
            });
        },
        onClear: function () {
            var oView = this.getView();

            // Clear the input fields
            oView.byId("inputFrom").setValue("");
            oView.byId("inputDate").setDateValue(null); // Set the DatePicker to null
            oView.byId("inputSubject").setValue("");

            // Clear the filters
            var oTable = oView.byId("mailTable"),
                oBinding = oTable.getBinding("items");

            oBinding.filter([]); // Clear all filters

            // Refresh the data to get all emails
            oBinding.refresh(); // Refresh the binding to reload data

            // Optional: Re-fetch the data to ensure all emails are loaded
            oBinding.attachEventOnce("dataReceived", function () {
                oTable.setBusy(false); // Hide busy indicator
            });
        },

        onShowAttachments: function (oEvent) {
            var oSelectedItem = oEvent.getSource().getParent(); // Get table row
            var oContext = oSelectedItem.getBindingContext();
            var sEmailId = oContext.getProperty("ID"); // Get email ID

            if (!this._oAttachmentDialog) {
                this._oAttachmentDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "com.mailprocessor.fragments.AttachmentDialog",
                    this
                );
                this.getView().addDependent(this._oAttachmentDialog);
            }

            // var oPanel = this.getView().byId("panel");
            // oPanel.setBusy(true);  // Show busy indicator during attachment fetch

            this._fetchAttachments(sEmailId).then(function (aAttachments) {
                var oDialogModel = new JSONModel({ attachments: aAttachments });
                this._oAttachmentDialog.setModel(oDialogModel);
                this._oAttachmentDialog.open();
                oPanel.setBusy(false);  // Hide busy indicator after fetching
            }.bind(this)).catch(function (oError) {
                MessageToast.show("Error fetching attachments.");
                console.error("Error fetching attachments:", oError);
                oPanel.setBusy(false);  // Hide busy indicator if there's an error
            });
        },

        _fetchAttachments: function (ID) {
            var oModel = this.getView().getModel();
            return oModel.bindList(`/EmailData(${ID})/attachments`).requestContexts().then(function (aContexts) {
                return aContexts.map(function (oContext) {
                    return oContext.getObject(); // Get the object for each context
                });
            });
        },

        onPreviewAttachment: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sFileType = oContext.getProperty("fileType");
            var sFileBase64 = oContext.getProperty("file");  // Assuming 'file' property contains base64-encoded data

            // Create the preview dialog if it doesn't exist
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
                // Convert base64 to Blob
                var byteCharacters = atob(sFileBase64); // Decode base64 string
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: "application/pdf" });

                // Create an object URL from the Blob
                var sPdfUrl = URL.createObjectURL(blob);

                // Set the Blob URL as the source for PDFViewer
                if (!this._pdfViewer) {
                    this._pdfViewer = new PDFViewer({
                        title: "PDF Preview",
                        showDownloadButton: false, // Disable download button
                        width: "auto",
                        height: "600px"
                    });
                    this.getView().addDependent(this._pdfViewer);
                }

                this._pdfViewer.setSource(sPdfUrl);
                this._pdfViewer.open();

                // Revoke the object URL after the PDFViewer closes
                this._pdfViewer.attachAfterClose(function () {
                    URL.revokeObjectURL(sPdfUrl);
                });

            } else if (sFileType.startsWith("image/")) {
                var sContent = "<img src='data:" + sFileType + ";base64," + sFileBase64 + "' style='max-width: 100%; max-height: 400px;' />";
                oPreviewContent.setContent(sContent); // Set the image content

            } else if (sFileType === "text/plain") {
                var sFileDecoded = atob(sFileBase64);
                oPreviewContent.setContent("<pre>" + sFileDecoded + "</pre>"); // Set text content

            } else {
                MessageToast.show("Unsupported file type for preview.");
            }

            this._oPreviewDialog.open(); // Open the preview dialog
        },

        onClosePreviewDialog: function () {
            if (this._oPreviewDialog) {
                this._oPreviewDialog.close();
            }
        },

        onCloseAttachmentDialog: function () {
            if (this._oAttachmentDialog) {
                this._oAttachmentDialog.close();
            }
        }
    });
});
