(function () {
	'use strict';
	jQuery.sap.declare({modName: "sap.uxap.sample.BlockBaseEventing.EventingBlockController", "type": "controller"});

	sap.ui.core.mvc.Controller.extend("sap.uxap.sample.BlockBaseEventing.EventingBlockController", {

		onInnerDummy: function (oEvent) {
			/*
			 Delegate the eventing to the parent block.
			 The outside world will see this event as being triggered by the block itself.
			 */
			this.oParentBlock.fireDummy(oEvent.getParameters());
		}
	});
}());

