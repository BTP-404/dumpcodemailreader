sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,i,t){"use strict";return e.extend("com.mailprocessor.controller.MailProcessor",{onInit:function(){this._oTable1=this.byId("mailTable1");this._oTable2=this.byId("mailTable2");this._oTable3=this.byId("mailTable3");this._applyDefaultFilters()},_applyDefaultFilters:function(){var e=this._oTable1.getBinding("items");var i=this._oTable2.getBinding("items");var t=this._oTable3.getBinding("items");if(e&&i&&t){this._applyFilter("invoice")}else{setTimeout(this._applyDefaultFilters.bind(this),500)}},onTabSelect:function(e){var i=e.getParameter("key");this._applyFilter(i)},_applyFilter:function(e){var a=[];switch(e){case"invoice":a.push(new i("subject",t.Contains,"invoice"));break;case"support":a.push(new i("subject",t.Contains,"support"));break;case"other":a.push(new i({filters:[new i("subject",t.NotContains,"invoice"),new i("subject",t.NotContains,"support")],and:true}));break;default:break}this._applyFiltersToTable(this._oTable1,a);this._applyFiltersToTable(this._oTable2,a);this._applyFiltersToTable(this._oTable3,a)},_applyFiltersToTable:function(e,i){if(e){var t=e.getBinding("items");if(t){t.filter(i)}}},onSearch:function(e){var a=this.byId("searchField").getValue();var s=[];if(a&&a.length>0){s.push(new i("subject",t.Contains,a))}var n=this.byId("inputFrom").getValue();var l=this.byId("inputDate").getDateValue();var r=this.byId("inputTime").getValue();var o=this.byId("inputSubject").getValue();if(n){s.push(new i("sender",t.Contains,n))}if(l){s.push(new i("date",t.EQ,l))}if(r){s.push(new i("time",t.EQ,r))}if(o){s.push(new i("subject",t.Contains,o))}var u=this._oTable1.getBinding("items");var p=this._oTable2.getBinding("items");var h=this._oTable3.getBinding("items");if(u){u.filter(s)}if(p){p.filter(s)}if(h){h.filter(s)}}})});
//# sourceMappingURL=MailProcessor.controller.js.map