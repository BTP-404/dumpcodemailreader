sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "./Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/PDFViewer",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, Formatter, JSONModel, Fragment, PDFViewer, Filter, FilterOperator) {
    "use strict";
    var oRouter;

    return Controller.extend("com.incresol.incmailreaderappfrontend.controller.Invoice", {
        formatter: Formatter,

        onInit: function () {
            oRouter = this.getOwnerComponent().getRouter();
            // const oModel = this.getView().getModel();
            // console.log(oModel);
            // this.loadData().then(() => {
            //     this.onFilterSubject(); // Apply the filter once data is ready
            // });

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
        onButtonPress: function (oEvent) {

            const sButtonId = oEvent.getSource().getId();
            const sButtonKey = sButtonId.split("--").pop();


            switch (sButtonKey) {
                case "btnHome":
                    this.getOwnerComponent().getRouter().navTo("RouteHomePage");
                case "btnEmailConfig":
                    this.getOwnerComponent().getRouter().navTo("RouteEmailConfiguration");
                    let data;
                    data.setModel(sap.ui.getCore().getModel("data"), "data");
                    break;
                case "btnUserManagement":
                    this.getOwnerComponent().getRouter().navTo("RouteUser");
                    break;
                case "btnSelectMail":
                    this.getOwnerComponent().getRouter().navTo("RouteInbox");
                    break;
                case "btnMailBox":
                    this.getOwnerComponent().getRouter().navTo("RouteMailBox");
                    break;
                case "btnMailProcessor":
                    this.getOwnerComponent().getRouter().navTo("RouteMailProcessor");
                    break;
                case "btnInvoiceApp":
                    
                    this.getOwnerComponent().getRouter().navTo("RouteInvoice");
                    break;

            }
        },
        onButtonPressLog: function () {
            oRouter.navTo('RouteLog');
        },
        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue").toLowerCase();
            const oTable = this.getView().byId("mailTable");
            const oBinding = oTable.getBinding("items");

            if (sQuery) {
                const aFilters = [
                    new sap.ui.model.Filter("sender", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("subject", sap.ui.model.FilterOperator.Contains, sQuery),

                ];
                const oFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
                oBinding.filter([oFilter]);
            } else {

                oBinding.filter([]);
            }
        },
        onSearchSubject: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue").toLowerCase();
            const oTable = this.getView().byId("mailTable");
            const oBinding = oTable.getBinding("items");

            if (sQuery) {
                const aFilters = [
                    new sap.ui.model.Filter("subject", sap.ui.model.FilterOperator.Contains, sQuery),


                ];
                const oFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
                oBinding.filter([oFilter]);
            } else {

                oBinding.filter([]);
            }
        },
        onSearchFrom: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue").toLowerCase();
            const oTable = this.getView().byId("mailTable");
            const oBinding = oTable.getBinding("items");

            if (sQuery) {
                const aFilters = [
                    new sap.ui.model.Filter("sender", sap.ui.model.FilterOperator.Contains, sQuery),
                ];
                const oFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });
                oBinding.filter([oFilter]);
            } else {

                oBinding.filter([]);
            }
        },
        onSearchDate: function (oEvent) {
            const oDatePicker = this.byId("inputDate");
            const date = oDatePicker.getDateValue();

            const oTable = this.getView().byId("mailTable");
            const oBinding = oTable.getBinding("items");


            if (date) {
                // Convert the selected date to a string in the format "Oct 7, 2024"
                const formattedDate = this.formatDate(date);
                console.log(typeof (formattedDate));

                const aFilters = [
                    new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.Contains, formattedDate),
                ];
                const oFilter = new Filter({
                    filters: aFilters,
                    and: true
                });
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },
        formatDate: function (date1) {

            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            const month = months[date1.getMonth()]; // Get the month name
            const day = date1.getDate(); // Get the day
            const year = date1.getFullYear(); // Get the year

            // Return formatted date string

            const formattedDisplayDate = `${month} ${day}, ${year}`;

            // Format for edm.Date (ISO 8601)
            const edmDate = `${year}-${String(date1.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return { formattedDisplayDate, edmDate };
        }
        ,
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
        onProceedOCR:function(oEvent){
            var oSelectedItem = oEvent.getSource().getParent();
            var oContext = oSelectedItem.getBindingContext();
            var sEmailId = oContext.getProperty("ID");

            sap.ui.core.BusyIndicator.show(0);

            if (!this._oAttachmentDialog1) {
                this._oAttachmentDialog1 = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "com.incresol.incmailreaderappfrontend.fragment.InvoiceOCR",
                    this
                );
                this.getView().addDependent(this._oAttachmentDialog1);
            }

            this._fetchAttachments(sEmailId).then(function (aAttachments) {
                var oDialogModel = new JSONModel({ attachments: aAttachments });
                this._oAttachmentDialog1.setModel(oDialogModel);
                sap.ui.core.BusyIndicator.hide();
                this._oAttachmentDialog1.open();
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
        },onCloseAttachmentDialog1: function () {
            if (this._oAttachmentDialog1) {
                this._oAttachmentDialog1.close();
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
        },
        onFilterSubject: function () {


            const aFilters = [
                new Filter("subject", FilterOperator.Contains, "bill"),
                new Filter("subject", FilterOperator.Contains, "invoice"),
                new Filter("subject", FilterOperator.Contains, "receipt")
            ];
            const oFilter = new Filter({
                filters: aFilters,
                and: false
            });

            oBinding.filter([oFilter]);
        },onOCRProcessor:function (oEvent){
            var oItem = oEvent.getSource().getParent();
            var oContext = oItem.getBindingContext();
            var oSelectedData = oContext.getObject();
            // entity OCRProcess {
            //     key ID       : UUID; // Unique identifier for the record
            //         formData : LargeString;
            //         fileType : String;
            //         fileName : String;
        
            // }
            const payload = {
                formData: oSelectedData.file,
                fileType: oSelectedData.fileType,
                fileName: oSelectedData.fileName
            };
            
            $.ajax({
                url: "/odata/v4/mail-reader/OCRProcess",
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success:  function(data) {
                    // Handle successful response
                    console.log("Data received: ", data);
                },
                error: function(xhr, status, error) {
                    // Handle errors
                    console.error("Error occurred: ", status, error);
                }
            });
        }

    });
});
