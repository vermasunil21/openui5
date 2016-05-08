sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

	var Component = UIComponent.extend("sap.ui.unified.sample.CalendarMinMax.Component", {

		metadata : {
			rootView : "sap.ui.unified.sample.CalendarMinMax.CalendarMinMax",
			dependencies : {
				libs : [
					"sap.ui.unified"
				]
			},
			includes: ["../style.css"],
			config : {
				sample : {
					files : [
						"CalendarMinMax.view.xml",
						"CalendarMinMax.controller.js"
					]
				}
			}
		}
	});

	return Component;

});
