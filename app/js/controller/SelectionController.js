app.controller('SelectionController', ['$scope', function($scope) {
    // Static panels for now
    $scope.panels = [
	{
	    name: "Default"
	},
	{
	    name: "Additional"
	},
	{
	    name: "SuperLongTextHiLol"
	}
    ];
}]);
