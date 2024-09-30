sap.ui.define([ 
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.mailprocessor.controller.MailProcessor", {

        onInit: function () {
            // Initialize tables for later use
            this._oTable1 = this.byId("mailTable1");
            this._oTable2 = this.byId("mailTable2");
            this._oTable3 = this.byId("mailTable3");

            // Ensure tables are initialized and bindings exist before applying filters
            this._applyDefaultFilters();
        },

        _applyDefaultFilters: function () {
            // Make sure the table bindings are available before applying filters
            var oTable1Binding = this._oTable1.getBinding("items");
            var oTable2Binding = this._oTable2.getBinding("items");
            var oTable3Binding = this._oTable3.getBinding("items");

            if (oTable1Binding && oTable2Binding && oTable3Binding) {
                // Set default tab filter (e.g., 'invoice')
                this._applyFilter("invoice");  // Change this to your preferred default tab key
            } else {
                // Retry applying the filter after a delay if bindings are not ready yet
                setTimeout(this._applyDefaultFilters.bind(this), 500);
            }
        },

        onTabSelect: function (oEvent) {
            // Get the selected tab key
            var sKey = oEvent.getParameter("key");

            // Apply the filter based on the selected key
            this._applyFilter(sKey);
        },


        _applyFilter: function (sKey) {
            var oFilters = [];
        
            switch (sKey) {
                case "invoice":
                    oFilters.push(new Filter("subject", FilterOperator.Contains, "invoice"));
                    break;
        
                case "support":
                    oFilters.push(new Filter("subject", FilterOperator.Contains, "support"));
                    break;
        
                case "other":
                    // This filter is a bit tricky since you want to exclude certain subjects.
                    // You'll have to ensure that none of the excluded subjects are present.
                    oFilters.push(new Filter({
                        filters: [
                            new Filter("subject", FilterOperator.NotContains, "invoice"),
                            new Filter("subject", FilterOperator.NotContains, "support")
                        ],
                        and: true
                    }));
                    break;
        
                default:
                    break;
            }
        
            // Apply filters to the tables if bindings are available
            this._applyFiltersToTable(this._oTable1, oFilters);
            this._applyFiltersToTable(this._oTable2, oFilters);
            this._applyFiltersToTable(this._oTable3, oFilters);
        },
        
        _applyFiltersToTable: function (oTable, oFilters) {
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter(oFilters); // Apply the filters
                }
            }
        },
        
        
        

        onSearch: function (oEvent) {
            // Get search field value
            var sQuery = this.byId("searchField").getValue();
            var oFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Create a filter for 'subject'
                oFilters.push(new Filter("subject", FilterOperator.Contains, sQuery));
            }

            // Additional Filters (sender, date, etc.)
            var sFrom = this.byId("inputFrom").getValue();
            var sDate = this.byId("inputDate").getDateValue();
            var sTime = this.byId("inputTime").getValue();
            var sSubject = this.byId("inputSubject").getValue();

            if (sFrom) {
                oFilters.push(new Filter("sender", FilterOperator.Contains, sFrom));
            }
            if (sDate) {
                oFilters.push(new Filter("date", FilterOperator.EQ, sDate));
            }
            if (sTime) {
                oFilters.push(new Filter("time", FilterOperator.EQ, sTime));
            }
            if (sSubject) {
                oFilters.push(new Filter("subject", FilterOperator.Contains, sSubject));
            }

            // Apply filters
            var oBinding1 = this._oTable1.getBinding("items");
            var oBinding2 = this._oTable2.getBinding("items");
            var oBinding3 = this._oTable3.getBinding("items");

            if (oBinding1) {
                oBinding1.filter(oFilters);
            }
            if (oBinding2) {
                oBinding2.filter(oFilters);
            }
            if (oBinding3) {
                oBinding3.filter(oFilters);
            }
        }

    });
});
