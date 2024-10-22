sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "./Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/PDFViewer"
], function (Controller, MessageToast, Formatter, JSONModel, Fragment, PDFViewer) {
    "use strict";
    var oRouter;

    return Controller.extend("com.incresol.incmailreaderappfrontend.controller.MailBox", {
        formatter: Formatter,

        onInit: function () {
            oRouter = this.getOwnerComponent().getRouter();
        },

        handlePopoverPress: function (oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();
            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "com.incresol.incmailreaderappfrontend.fragment.Popover",
                    controller: this
                }).then(function (oPopover) {
                    oPopover.setModel(sap.ui.getCore().getModel("data"), "data");
                    oPopover.bindElement("data>/");
                    oPopover.openBy(oButton);
                    return oPopover;
                });
            }
            this._pPopover.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },

        handlelogoutPress: function (oEvent) {
            this.byId("myPopover").close();
            oRouter.navTo('RouteLoginPage');
        },

        onShowAttachments: function (oEvent) {
            var oSelectedItem = oEvent.getSource().getParent();
            var oContext = oSelectedItem.getBindingContext();
            var sEmailId = oContext.getProperty("ID");

            sap.ui.core.BusyIndicator.show(0);

            if (!this._oAttachmentDialog) {
                this._oAttachmentDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "com.incresol.incmailreaderappfrontend.fragment.AttachmentDialog",
                    this
                );
                this.getView().addDependent(this._oAttachmentDialog);
            }

            this._fetchAttachments(sEmailId).then(function (aAttachments) {
                var oDialogModel = new JSONModel({ attachments: aAttachments });
                this._oAttachmentDialog.setModel(oDialogModel);
                sap.ui.core.BusyIndicator.hide();
                this._oAttachmentDialog.open();
            }.bind(this)).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show("Error fetching attachments.");
                console.error("Error fetching attachments:", oError);
            }.bind(this));
        },

        _fetchAttachments: function (ID) {
            var oModel = this.getView().getModel();
            return oModel.bindList(`/EmailData(${ID})/attachments`).requestContexts().then(function (aContexts) {
                return aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
            });
        },

        onCloseAttachmentDialog: function () {
            if (this._oAttachmentDialog) {
                this._oAttachmentDialog.close();
            }
        },

        onPreviewAttachment: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sFileType = oContext.getProperty("fileType");
            var sFileBase64 = oContext.getProperty("file");

            if (!this._oPreviewDialog) {
                this._oPreviewDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "com.incresol.incmailreaderappfrontend.fragment.Attachment",
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
        onPreviewBody: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var oContext = oItem.getBindingContext();
            var oSelectedData = oContext.getObject();

            if (!this._oBodyPreviewDialog) {
                this._oBodyPreviewDialog = sap.ui.xmlfragment("com.incresol.incmailreaderappfrontend.fragment.Body", this);
                this.getView().addDependent(this._oBodyPreviewDialog);
            }


            var oVBox = this._oBodyPreviewDialog.getContent()[0]; // Assumes the first content is the VBox
            oVBox.removeAllItems();

            var oHtmlContent = "<div>" + oSelectedData.body + "</div>";
            oVBox.addItem(new sap.ui.core.HTML({ content: oHtmlContent }));

            this._oBodyPreviewDialog.open();
        },

        onCloseDialog: function () {
            this._oBodyPreviewDialog.close();
        }

    });
});
