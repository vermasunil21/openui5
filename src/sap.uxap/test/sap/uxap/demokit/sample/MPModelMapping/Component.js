sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
	"use strict";

	var Component = UIComponent.extend("sap.uxap.sample.MPModelMapping.Component", {

		metadata: {
			rootView: "sap.uxap.sample.MPModelMapping.ModelMapping",
			dependencies: {
				libs: [
					"sap.m"
				]
			},
			config: {
				sample: {
					stretch: true,
					files: [
						"ModelMapping.view.xml",
						"ModelMapping.controller.js",
						"ModelMappingBlock.js",
						"ModelMappingBlock.view.xml"
					]
				}
			}
		}
	});

	return Component;

}, true);
